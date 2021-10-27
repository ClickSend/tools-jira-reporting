
function generateReport(args) {
    require( 'report-key-implementation.js').generateReport(args);
}


exports.command = 'ticket-history-chart';
exports.desc = "Generate a chart that shows the different statuses of a ticket over time."
exports.handler = generateReport;
