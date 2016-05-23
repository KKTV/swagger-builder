'use strict';

const YAML = require('js-yaml'),
    JsonRefs = require('json-refs'),
    swaggerTools = require('swagger-tools');

const formatValidateResult = (result) => {
    let err = result.errors,
        warnings = result.warnings;

    let generator = (msgs) => {

        let result = '';

        for (let i = 0, m; i < msgs.length; i++) {
            m = msgs[i];
            result += `\t  ${m.message}\n`;
        }

        return result;
    };

    return `\tErrors:\n\n${generator(err || [])}\n\tWarnings:\n\n${generator(warnings || [])}`;
};

exports.validate = (swaggerObj) => {
    let validator = swaggerTools.specs.v2;

    return new Promise((resolve, reject) => {
        validator.validate(swaggerObj, (err, results) => {
            if (err) reject(err);
            console.log(formatValidateResult(results));
            resolve();
        });
    });
};

exports.build = (filepath) => {

    let that = this,
        options = {
            filter: ['relative'],
            loaderOptions: {
                processContent: function(res, callback) {
                    callback(undefined, YAML.safeLoad(res.text));
                }
            }
        };

    return JsonRefs.resolveRefsAt(filepath, options)
        .then(function(results) {
            var errors = [];

            Object.keys(results.refs).forEach(function(refPtr) {
                var refDetails = results.refs[refPtr];

                if (refDetails.type === 'invalid' || refDetails.error) {
                    errors.push(`  ${refPtr}: ${refDetails.error}`);
                }
            });

            if (errors.length > 0) {
                throw new Error(`Document has invalid references:\n\n${errors.join('\n')}`);
            } else {
                let swaggerObj = results.resolved;
                // console.log(JSON.stringify(results.resolved, null, 2));
                return that.validate(swaggerObj).then(() => {
                    return YAML.safeDump(swaggerObj, {
                        noRefs: true
                    });
                });
            }
        });

};
