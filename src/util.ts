'use strict';
import { Transform } from 'stream';
import PluginError = require("../node_modules/plugin-error");
import fancyLog from 'fancy-log';
import { CLIEngine } from 'eslint';

/**
 * Convenience method for creating a transform stream in object mode
 *
 * @param {Function} transform - An async function that is called for each stream chunk
 * @param {Function} [flush] - An async function that is called before closing the stream
 * @returns {stream} A transform stream
 */
export const transform = (transform: Function, flush?: Function): typeof $TSFixMe => {
    if (typeof flush === 'function') {
        return new Transform({
            objectMode: true,
            transform,
            flush
        });
    }
    return new Transform({
        objectMode: true,
        transform
    });
};
/**
 * Mimic the CLIEngine's createIgnoreResult function,
 * only without the ESLint CLI reference.
 *
 * @param {Object} file - file with a "path" property
 * @returns {Object} An ESLint report with an ignore warning
 */
export const createIgnoreResult = (file: typeof $TSFixMe): object => {
    const patt = /node_modules\//; // RegEx for Linux and macOS
    const patt2 = /node_modules\\/; // Regex for Windows
    let str;
    if (patt.test(file.path) || patt2.test(file.path)) {
        str = 'File ignored because it has a node_modules/** path';
    }
    else {
        str = 'File ignored because of .eslintignore file';
    }
    return {
        filePath: file.path,
        messages: [{
                fatal: false,
                severity: 1,
                message: str
            }],
        errorCount: 0,
        warningCount: 1
    };
};
/**
 * Convert a string array to a boolean map.
 * @param {string[]|null} keys The keys to assign true.
 * @param {boolean} defaultValue The default value for each property.
 * @param {string} displayName The property name which is used in error message.
 * @returns {Record<string,boolean>} The boolean map.
 */
export function toBooleanMap(keys: string[] | null, defaultValue: boolean, displayName: string): Record<string, boolean> {
    if (keys && !Array.isArray(keys)) {
        throw Error(`${displayName} must be an array.`);
    }
    if (keys && keys.length > 0) {
        return keys.reduce((map, def) => {
            const [key, value] = def.split(':');
            if (key !== '__proto__') {
                map[key] = value === undefined ? defaultValue : value === 'true';
            }
            return map;
        }, {});
    }
}
/**
 * Create config helper to merge various config sources
 *
 * @param {Object} options - options to migrate
 * @returns {Object} migrated options
 */
export function migrateOptions(options: typeof $TSFixMe): object {
    if (typeof options === 'string') {
        // basic config path overload: gulpEslint('path/to/config.json')
        const returnValue = { eslintOptions: { overrideConfigFile: options } };
        return returnValue;
    }
    const { overrideConfig: originalOverrideConfig, quiet, warnFileIgnored, warnIgnored: originalWarnIgnored, ...eslintOptions } = options;
    if (originalOverrideConfig != null && typeof originalOverrideConfig !== 'object') {
        throw Error('\'overrideConfig\' must be an object or null.');
    }
    const overrideConfig = (eslintOptions as any).overrideConfig
        = originalOverrideConfig != null ? { ...originalOverrideConfig } : {};
    function migrateOption(
        oldName: typeof $TSFixMe,
        newName: typeof $TSFixMe = oldName,
        convert = (value: typeof $TSFixMe) => value
    ) {
        const value = eslintOptions[oldName];
        delete eslintOptions[oldName];
        if (value !== undefined) {
            overrideConfig[newName] = convert(value);
        }
    }{
        const { configFile } = eslintOptions;
        delete (eslintOptions as any).configFile;
        if (configFile !== undefined) {
            (eslintOptions as any).overrideConfigFile = configFile;
        }
    }
    migrateOption('envs', 'env', envs => toBooleanMap(envs, true, 'envs'));
    migrateOption('globals', undefined, globals => toBooleanMap(globals, false, 'globals'));
    migrateOption('ignorePattern', 'ignorePatterns');
    migrateOption('parser');
    migrateOption('parserOptions');
    if (Array.isArray((eslintOptions as any).plugins)) {
        migrateOption('plugins');
    }
    migrateOption('rules');
    const warnIgnored = warnFileIgnored !== undefined ? warnFileIgnored : originalWarnIgnored;
    const returnValue = { eslintOptions, quiet, warnIgnored };
    return returnValue;
};

/**
 * Ensure that callback errors are wrapped in a gulp PluginError
 *
 * @param {Function} callback - callback to wrap
 * @param {Object} [value=] - A value to pass to the callback
 * @returns {Function} A callback to call(back) the callback
 */
export const handleCallback = (callback: Function, value: object): Function => {
    return (err: typeof $TSFixMe) => {
        if (err != null && !(err instanceof PluginError)) {
            err = new PluginError(err.plugin || 'gulp-eslint', err, {
                showStack: (err.showStack !== false)
            });
        }
        callback(err, value);
    };
};

/**
 * Call sync or async action and handle any thrown or async error
 *
 * @param {Function} action - Result action to call
 * @param {(Object|Array)} result - An ESLint result or result list
 * @param {Function} done - An callback for when the action is complete
 */
export const tryResultAction = (
    action: Function,
    result: (object | Array<any>),
    done: Function
) => {
    try {
        if (action.length > 1) {
            // async action
            action: any.call(this, result, done);
        }
        else {
            // sync action
            action.call(this, result);
            done();
        }
    }
    catch (error) {
        done(error == null ? new Error('Unknown Error') : error);
    }
};

/**
 * Get first message in an ESLint result to meet a condition
 *
 * @param {Object} result - An ESLint result
 * @param {Function} condition - A condition function that is passed a message and returns a boolean
 * @returns {Object} The first message to pass the condition or null
 */
export const firstResultMessage = (
    result: typeof $TSFixMe,
    condition: Function
): object | null => {
    if (!result.messages) {
        return null;
    }
    return result.messages.find(condition);
};

/**
 * Get the severity level of a message
 *
 * @param {Object} message - an ESLint message
 * @returns {Number} the severity level of the message
 */
export function getSeverity(message: typeof $TSFixMe): number {
    const level = message.fatal ? 2 : message.severity;
    if (Array.isArray(level)) {
        return level[0];
    }
    return level;
}

/**
 * Determine if a message is an error
 *
 * @param {Object} message - an ESLint message
 * @returns {Boolean} whether the message is an error message
 */
export function isErrorMessage(message: object): boolean {
    return getSeverity(message) > 1;
}

/**
 * Determine if a message is a warning or error
 *
 * @param {Object} message - an ESLint message
 * @returns {Boolean} whether the message is a warning or error message
 */
export function isWarningMessage(message: object): boolean {
    return getSeverity(message) > 0;
}

/**
 * Increment count if message is an error
 *
 * @param {Number} count - count of errors
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of errors, message included
 */
export function countErrorMessage(count: number, message: object): number {
    return count + Number(isErrorMessage(message));
}

/**
 * Increment count if message is a warning
 *
 * @param {Number} count - count of warnings
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of warnings, message included
 */
export function countWarningMessage(count: number, message: typeof $TSFixMe): number {
    return count + Number(message.severity === 1);
}

/**
 * Increment count if message is a fixable error
 *
 * @param {Number} count - count of errors
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of errors, message included
 */
export function countFixableErrorMessage(count: number, message: typeof $TSFixMe): number {
    return count + Number(isErrorMessage(message) && message.fix !== undefined);
}

/**
 * Increment count if message is a fixable warning
 *
 * @param {Number} count - count of errors
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of errors, message included
 */
export function countFixableWarningMessage(count: number, message: typeof $TSFixMe): number {
    return count + Number(message.severity === 1 && message.fix !== undefined);
}

/**
 * Filter result messages, update error and warning counts
 *
 * @param {Object} result - an ESLint result
 * @param {Function} [filter=isErrorMessage] - A function that evaluates what messages to keep
 * @returns {Object} A filtered ESLint result
 */
export const filterResult = (result: typeof $TSFixMe, filter: Function): object => {
    if (typeof filter !== 'function') {
        filter = isErrorMessage;
    }
    const messages = result.messages.filter(filter, result);
    const newResult = {
        filePath: result.filePath,
        messages: messages,
        errorCount: messages.reduce(countErrorMessage, 0),
        warningCount: messages.reduce(countWarningMessage, 0),
        fixableErrorCount: messages.reduce(countFixableErrorMessage, 0),
        fixableWarningCount: messages.reduce(countFixableWarningMessage, 0)
    };
    if (result.output !== undefined) {
        (newResult as any).output = result.output;
    }
    else {
        (newResult as any).source = result.source;
    }
    return newResult;
};

/**
 * Resolve formatter from unknown type (accepts string or function)
 *
 * @throws TypeError thrown if unable to resolve the formatter type
 * @param {(String|Function)} [formatter=stylish] - A name to resolve as a formatter. If a function is provided, the same function is returned.
 * @returns {Function} An ESLint formatter
 */
export const resolveFormatter = (formatter: (string | Function)): Function => {
    // use ESLint to look up formatter references
    if (typeof formatter !== 'function') {
        // load formatter (module, relative to cwd, ESLint formatter)
        formatter = CLIEngine.getFormatter(formatter);
    }
    return formatter;
};

/**
 * Resolve writable
 *
 * @param {(Function|stream)} [writable=fancyLog] - A stream or function to resolve as a format writer
 * @returns {Function} A function that writes formatted messages
 */
export const resolveWritable = (writable: (Function | typeof $TSFixMe)): Function => {
    if (!writable) {
        writable = fancyLog;
    }
    else if (typeof writable.write === 'function') {
        writable = writable.write.bind(writable);
    }
    return writable;
};

/**
 * Write formatter results to writable/output
 *
 * @param {Object[]} results - A list of ESLint results
 * @param {Function} formatter - A function used to format ESLint results
 * @param {Function} writable - A function used to write formatted ESLint results
 */
export const writeResults = (results: typeof $TSFixMe, formatter: Function, writable: Function) => {
    if (!results) {
        results = [];
    }
    const firstResult = results.find((result: typeof $TSFixMe) => result.config);
    const message = formatter(results, firstResult ? firstResult.config : {});
    if (writable && message != null && message !== '') {
        writable(message);
    }
};
