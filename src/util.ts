'use strict';
import { Transform } from 'stream';
import PluginError = require("../node_modules/plugin-error");
// @ts-expect-error ts-migrate(1259) FIXME: Module '"/home/doamatto/Documents/git/doamatto/gul... Remove this comment to see the full error message
import fancyLog from 'fancy-log';
import { CLIEngine } from 'eslint';
/**
 * Convenience method for creating a transform stream in object mode
 *
 * @param {Function} transform - An async function that is called for each stream chunk
 * @param {Function} [flush] - An async function that is called before closing the stream
 * @returns {stream} A transform stream
 */
exports.transform = function (transform: any, flush: any) {
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
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'file' implicitly has an 'any' type.
exports.createIgnoreResult = file => {
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
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'keys' implicitly has an 'any' type.
function toBooleanMap(keys, defaultValue, displayName) {
    if (keys && !Array.isArray(keys)) {
        throw Error(`${displayName} must be an array.`);
    }
    if (keys && keys.length > 0) {
        // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'map' implicitly has an 'any' type.
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
exports.migrateOptions = function migrateOptions(options = {}) {
    if (typeof options === 'string') {
        // basic config path overload: gulpEslint('path/to/config.json')
        const returnValue = { eslintOptions: { overrideConfigFile: options } };
        return returnValue;
    }
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'overrideConfig' does not exist on type '... Remove this comment to see the full error message
    const { overrideConfig: originalOverrideConfig, quiet, warnFileIgnored, warnIgnored: originalWarnIgnored, ...eslintOptions } = options;
    if (originalOverrideConfig != null && typeof originalOverrideConfig !== 'object') {
        throw Error('\'overrideConfig\' must be an object or null.');
    }
    const overrideConfig = (eslintOptions as any).overrideConfig
        = originalOverrideConfig != null ? { ...originalOverrideConfig } : {};
    // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'oldName' implicitly has an 'any' type.
    function migrateOption(oldName, newName = oldName, convert = value => value) {
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        const value = eslintOptions[oldName];
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        delete eslintOptions[oldName];
        if (value !== undefined) {
            overrideConfig[newName] = convert(value);
        }
    }
    {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'configFile' does not exist on type '{}'.
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
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'callback' implicitly has an 'any' type.
exports.handleCallback = (callback, value) => {
    // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'err' implicitly has an 'any' type.
    return err => {
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
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'action' implicitly has an 'any' type.
exports.tryResultAction = function (action, result, done) {
    try {
        if (action.length > 1) {
            // async action
            // @ts-expect-error ts-migrate(2693) FIXME: 'any' only refers to a type, but is being used as ... Remove this comment to see the full error message
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
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'result' implicitly has an 'any' type.
exports.firstResultMessage = (result, condition) => {
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
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'message' implicitly has an 'any' type.
function getSeverity(message) {
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
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'message' implicitly has an 'any' type.
export function isErrorMessage(message) {
    return getSeverity(message) > 1;
}
/**
 * Determine if a message is a warning or error
 *
 * @param {Object} message - an ESLint message
 * @returns {Boolean} whether the message is a warning or error message
 */
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'message' implicitly has an 'any' type.
export function isWarningMessage(message) {
    return getSeverity(message) > 0;
}
/**
 * Increment count if message is an error
 *
 * @param {Number} count - count of errors
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of errors, message included
 */
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'count' implicitly has an 'any' type.
function countErrorMessage(count, message) {
    return count + Number(isErrorMessage(message));
}
/**
 * Increment count if message is a warning
 *
 * @param {Number} count - count of warnings
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of warnings, message included
 */
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'count' implicitly has an 'any' type.
function countWarningMessage(count, message) {
    return count + Number(message.severity === 1);
}
/**
 * Increment count if message is a fixable error
 *
 * @param {Number} count - count of errors
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of errors, message included
 */
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'count' implicitly has an 'any' type.
function countFixableErrorMessage(count, message) {
    return count + Number(isErrorMessage(message) && message.fix !== undefined);
}
/**
 * Increment count if message is a fixable warning
 *
 * @param {Number} count - count of errors
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of errors, message included
 */
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'count' implicitly has an 'any' type.
function countFixableWarningMessage(count, message) {
    return count + Number(message.severity === 1 && message.fix !== undefined);
}
/**
 * Filter result messages, update error and warning counts
 *
 * @param {Object} result - an ESLint result
 * @param {Function} [filter=isErrorMessage] - A function that evaluates what messages to keep
 * @returns {Object} A filtered ESLint result
 */
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'result' implicitly has an 'any' type.
exports.filterResult = (result, filter) => {
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
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'formatter' implicitly has an 'any' type... Remove this comment to see the full error message
exports.resolveFormatter = (formatter) => {
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
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'writable' implicitly has an 'any' type.
exports.resolveWritable = (writable) => {
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
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'results' implicitly has an 'any' type.
exports.writeResults = (results, formatter, writable) => {
    if (!results) {
        results = [];
    }
    // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'result' implicitly has an 'any' type.
    const firstResult = results.find(result => result.config);
    const message = formatter(results, firstResult ? firstResult.config : {});
    if (writable && message != null && message !== '') {
        writable(message);
    }
};
