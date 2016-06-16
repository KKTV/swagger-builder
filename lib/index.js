'use strict';

const YAML = require('js-yaml'),
    JsonRefs = require('json-refs'),
    swaggerTools = require('swagger-tools'),
    childProcess = require('child_process'),
    util = require('./util'),
    path = require('path');

exports.validate = (swaggerObj) => {
    let validator = swaggerTools.specs.v2;

    return new Promise((resolve, reject) => {
        validator.validate(swaggerObj, (err, results) => {
            if (err) reject(err);

            if (results) {
                return results.errors.length ? reject(results) : resolve(results);
            }

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
                return that.validate(swaggerObj).then((warnings) => {

                    if (warnings) {
                        console.log(util.generateErrorWarningMessages(warnings));
                    }

                    return YAML.safeDump(swaggerObj, {
                        noRefs: true
                    });
                });
            }
        });

};

exports.updateAPI = (file, apiId, stageName) => {

    if (!apiId) throw new Error('No API ID');

    let spawn = childProcess.spawn;

    return new Promise((resolve, reject) => {

        let args = [
            '-jar', path.join(__dirname, '../aws-apigateway-importer-1.0.3-SNAPSHOT-jar-with-dependencies.jar'),
            '--update', apiId
        ];

        if (stageName) {
            args = args.concat(['--deploy', stageName]);
        }

        args.push(file);

        console.log('EXECUTE:', 'java', args.join(' '));

        let cmd = spawn('java', args);

        cmd.stdout.pipe(process.stdout);
        cmd.stderr.pipe(process.stderr);

        cmd.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`child process exited with code ${code}`));
            }

            resolve();
        });
    });

};
