const report = require('./user-hours-per-point-implementation.js')

/**
 * Generate a single report - this isn't called externally, but we export it
 * anyway, just in case someone else wants to use it.
 * @param {*} key 
 * @param {*} args 
 */
async function generateReport(args) {
    await report.generateReport( args );
}


/**
 ** Exports for the command line processor
 **/

exports.command = 'user-hours-per-point';
exports.desc = "Determine how many hours it takes to complete one story point of work";
exports.handler = async function( y ) { await generateReport(y) };
exports.builder = function (yargs) {
    return yargs
        .option('user',
            {
                alias : 'users',
                demandOption: true,
                describe: 'The user name(s) on which to report.  If multiple users are specified, multiple reports will be generated',
                type: 'array',
                group: 'user-history options'
            }
        )
        .option('startDate',
            {
                demandOption: false,
                description: 'The first date (inclusive) for which to generate the report in ISO format (YYYY-MM-DD).  Defaults to 30 days ago.',
                type: 'string',
                group: 'user-history options'
            }
        )
        .option('endDate',
            {
                demandOption: false,
                description: 'The last date (inclusive) for which to generate the report in ISO format (YYYY-MM-DD).  Defaults to today.',
                type: 'string',
                group: 'user-history options'
            }
        )
}
