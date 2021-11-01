const report = require('./ticket-history-chart-implementation.js');
/**
 * We have to pass this off to an import so that we can use the async functions
 * Yargs doesn't want to play nice with the type of module import that makes this possible.
 */
async function generateReport(args) {
    await report.generateReport(args);
}

exports.command = 'ticket-history-chart';
exports.desc = "Generate a chart that shows the different statuses of a ticket over time."
exports.handler = generateReport;
exports.builder = function (yargs) {
    return yargs
        .option('key',
            {
                alias : 'keys k',
                demandOption: true,
                describe: 'The Jira ticket key(s) on which to report',
                type: 'array',
                group: 'ticket-history-chart options:'
            }
        )
        .option('type',
            {
                demandOption: false,
                description: 'The report type to create (PDF | SVG)',
                type: 'string',
                group: 'user-history options',
                choices : ['PDF','SVG']

            }
        )
}
