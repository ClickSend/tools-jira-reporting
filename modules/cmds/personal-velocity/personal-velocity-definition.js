const report = require('./personal-velocity-implementation.js')

async function generateReport(args) {
    await report.generateReport(args);
}


/**
 ** Exports for the command line processor
 **/

exports.command = 'personal-velocity';
exports.desc = "How many story points were closed in the time period on which the user worked.  This looks for tickets on which the user worked in the time period AND tickets that were closed in the time period.  What we're trying to work out here is the same as a team's velocity, which is all of the tickets closed in a sprint, but for an individual user.";
exports.handler = async function (y) { await generateReport(y) };
exports.builder = function (yargs) {
    return yargs
        .option('user',
            {
                alias: 'users',
                demandOption: true,
                describe: 'The user name(s) on which to report.  If multiple users are specified, multiple reports will be generated',
                type: 'array',
                group: 'personal-velocity options'
            }
        )
        .option('startDate',
            {
                demandOption: false,
                description: 'The first date (inclusive) for which to generate the report in ISO format (YYYY-MM-DD).  Defaults to two weeks ago.',
                type: 'string',
                group: 'personal-velocity options'
            }
        )
        .option('endDate',
            {
                demandOption: false,
                description: 'The last date (inclusive) for which to generate the report in ISO format (YYYY-MM-DD).  Defaults to today.',
                type: 'string',
                group: 'personal-velocity options'
            }
        )
        .option('jql',
            {
                demandOption: false,
                description: 'Additional JQL commands that will be added to the querty after appending an "and"',
                type: 'string',
                group: 'personal-velocity options'
            }
        )
        .option('dir',
            {
                demandOption: false,
                description: 'The directory into which to put the report',
                default: './reports',
                type: 'string',
                group: 'personal-velocity options'
            }
        )
        .option('file',
            {
                demandOption: false,
                description: 'The output file name.  ${USER}, ${START-DATE} and ${END-DATE} can be used to write the report based on parameters.  If you are running this report for multiple users, and do not use parameters for the file name, the file will be overwritten with each subsequent user (this isn\' what you want.)',
                default: 'personal-velocity-${USER}-${START-DATE}-${END-DATE}',
                type: 'string',
                group: 'personal-velocity options'
            }
        )
        .option('doneStatus',
            {
                demandOption: false,
                description: 'The status (or statuses) that indicate that a ticket is done.',
                default: 'Done',
                type: 'array',
                group: 'personal-velocity options'
            }
        )
        .option("console",
            {
                demandOption: false,
                description: 'If set, override the file options and only write the resulting output to the console.',
                default: 'false',
                type: 'boolean',
                group: 'personal-velocity options'
            }
        )
}
