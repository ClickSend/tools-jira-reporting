const cliProgress = require('cli-progress');
const jira = require('../../jira.js')
const fs = require('fs')
const { DateTime } = require('luxon');

async function generateReport(args) {
    validateArgs(args);

    if (Array.isArray(args.user)) {
        for (var i = 0; i < args.user.length; i++) {
            if( args.debug || args.verbose ) {
                console.log('Running report for ' + args.user[i] );
            }
            await generateUserReport(args.user[i], args);
        }
    }
    else {
        generateUserReport(args.user, args);
    }
}

/**
 * Mostly date validation here.
 * @param {*} args 
 */
function validateArgs(args) {
    var startDate, endDate;

    if (args.endDate === undefined) {
        endDate = DateTime.now().startOf('day');
    }
    else {
        endDate = DateTime.fromISO(args.endDate).endOf('day');
    }

    if (!endDate.isValid) {
        throw "The end date is not valid.  Please use YYYY-MM-DD format.";
    }

    if (args.startDate === undefined) {
        startDate = endDate.minus({ days: 30 });
    }
    else {
        startDate = DateTime.fromISO(args.startDate).startOf('day');
    }

    if (!startDate.isValid) {
        throw "The start date is not valid.  Please use YYYY-MM-DD format.";
    }

    if (startDate > endDate) {
        throw "The start date must be before the end date.";
    }
}

async function generateUserReport(userName, args) {

    if( args.debug  ) {
        console.log( 'Getting user data for ' + userName + '\n' );
    }
    var user = await jira.getUserFromUserName(userName, args);

    // Quote out the statuses
    for (var i = 0; i < args.doneStatus.length; i++) {
        args.doneStatus[i] = addQuotes(args.doneStatus[i]);
    }

    var JQL = ' (    (assignee changed to ' + user.accountId + ' before 2021-10-14 and assignee changed from ' + user.accountId + ' after 2021-10-01)'
        + '  OR (assignee changed from ' + user.accountId + ' during(' + args.startDate + ',' + args.endDate + '))'
        + '  OR (assignee changed to ' + user.accountId + ' during(' + args.startDate + ',' + args.endDate + '))'
        + ' ) '
        + ' AND "Story Points[Number]" is not empty'
        + ' AND status in ( ' + args.doneStatus + ' )';


    if (args.jql !== undefined) {
        sql += ' AND ' + args.jql;
    }

    if( args.debug ) {
        console.log( "JQL for Query:");
        console.log( JQL );
        console.log( '\nRunning query....');
    }

    var json = await jira.executeQuery(JQL, args);

    if( args.debug ) {
        console.log( "JSON from JIRA:" );
        console.log( json );
    }

    var fileName = createFileName(userName, args);

    var totalStoryPoints = 0;

    for (var i = 0; i < json.issues.length; i++) {
        var issue = json.issues[i];
        totalStoryPoints += await jira.getIssueFieldValue(issue, "Story Points", args);
    }

    var line = userName + ": " + totalStoryPoints + " story points for " + args.startDate + " to " + args.endDate;

    if (args.console || args.verbose || args.debug ) {
        console.log(line);
    }
    if (!args.console) {
        fs.writeFile(args.dir + '/' + fileName, line, (error) => {
            if (error) throw err;
        });
    }

}

function createFileName(userName, args) {
    var fileName = args.file;
    fileName = fileName
        .replace("${USER}", userName)
        .replace("${START-DATE}", args.startDate)
        .replace("${END-DATE}", args.endDate);

    fileName += ".txt";

    return fileName;
}

function addQuotes(text) {
    if (!text) {
        throw "No value passed to addQuotes";
    }

    text = text.trim();

    if (!text.startsWith('"')) {
        text = '"' + text;
    }
    if (!text.endsWith('"')) {
        text += '"';
    }

    return text;
}


module.exports = {
    generateReport
}