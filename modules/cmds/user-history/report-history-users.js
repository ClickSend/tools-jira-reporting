const report = require('./report-implementation.js')

/**
 * Generate a single report - this isn't called externally, but we export it
 * anyway, just in case someone else wants to use it.
 * @param {*} key 
 * @param {*} args 
 */
async function generateReport(args) {
    await report.generateUserTicketHistoryReport( args );
}


/**
 ** Exports for the command line processor
 **/

exports.command = 'user-ticket-history-table';
exports.desc = "Report that generates a list of tickets to which a user was assigned over a time period.";
exports.handler = async function( y ) { await generateReport(y) };
exports.builder = function (yargs) {
    return yargs
        .option('user',
            {
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
        .option('granulatiry',
            {
                demandOption: false,
                description: 'Report time block size in minutes.  Smaller numbers make bigger reports.',
                type: 'number',
                default: 60,
                group: 'user-history options'
            }
        )
        .option('skipWeekends',
            {
                demandOption: false,
                description: 'When present, the report won\'t contain data for Saturdays or Sundays.',
                type: 'boolean',
                default: true,
                group: 'user-history options'
            }
        )
        .option('workingHours',
            {
                demandOption: false,
                description: 'When present, the report will only report from 9:00am to 5:00pm',
                type: 'boolean',
                default: true,
                group: 'user-history options'
            }
        )
}
