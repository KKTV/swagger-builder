'use strict';


exports.generateErrorWarningMessages = (result) => {

    if (!result) return;

    let err = result.errors,
        warnings = result.warnings;

    let generatePath = (paths) => paths.map((v) => {
        return v.replace(/\//g, '~');
    }).join('/');

    let generator = (msgs) => {

        let result = '';

        for (let i = 0, m; i < msgs.length; i++) {
            m = msgs[i];
            result += `   ${generatePath(m.path)}:\n     ${m.message}\n`;
        }

        return result;
    };

    let msg = '';

    if (err.length) {
        msg += ` Errors:\n\n${generator(err || [])}`;
    }

    if (warnings.length) {
        msg += msg ? '\n' : '';
        msg += ` Warnings:\n\n${generator(warnings || [])}`;
    }

    return msg;
};

