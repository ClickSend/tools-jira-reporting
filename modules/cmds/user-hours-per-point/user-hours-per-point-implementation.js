const cliProgress = require('cli-progress');
const jira = require('../../jira.js')
const fs = require('fs')
const { DateTime } = require('luxon');

async function generateReport( args ) {
    validateArgs(args);

    if (Array.isArray(args.user)) {
        for (var i = 0; i < args.user.length; i++) {
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
function validateArgs( args ) {
    var startDate, endDate;

    if( args.endDate === undefined ) {
        endDate = DateTime.now().startOf( 'day' );
    }
    else {
        endDate = DateTime.fromISO( args.endDate ).endOf( 'day' );
    }

    if( !endDate.isValid ) {
        throw "The end date is not valid.  Please use YYYY-MM-DD format.";
    }
    
    if( args.startDate === undefined ) {
        startDate = endDate.minus( {days : 30});
    }
    else {
       startDate = DateTime.fromISO( args.startDate ).startOf( 'day' );
    }

    if( !startDate.isValid ) {
        throw "The start date is not valid.  Please use YYYY-MM-DD format.";
    }

    if( startDate > endDate ) {
        throw "The start date must be before the end date.";
    }
}

async function generateUserReport( userName, args ) {

    var user = await jira.getUserFromUserName( userName, args );

    var JQL = ' (    (assignee changed to ' + user.accountId + ' before 2021-10-14 and assignee changed from ' + user.accountId + ' after 2021-10-01)'
            + '  OR (assignee changed from ' + user.accountId + ' during(' + args.startDate + ',' + args.endDate + '))'
            + '  OR (assignee changed to ' + user.accountId + ' during(' + args.startDate + ',' + args.endDate + '))'
            + ' ) '
            + ' AND "Story Points[Number]" is not empty'
            + ' AND resolution = Done';

    if( args.jql !== undefined ) {
        sql += ' AND ' + args.jql;
    }

    var json = await jira.executeQuery( JQL, args );
    var fileName = userName + '.csv';

    var line =  "Key,Points,Total Time,User Time";

    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar1.start(json.issues.length, 0);

    for( var i = 0; i < json.issues.length; i++ ) {
        var issue = json.issues[i];
        var storyPoints = await jira.getIssueFieldValue( issue, "Story Points", args );
        var timeSpentTotal = await  jira.getIssueFieldValue( issue, "Time Spent", args );
        var timeSpentUser = await getTimeSpentByAccountId( issue.key, user.accountId, args );

        line +=  issue.key + "," + storyPoints + "," + timeSpentTotal + "," + timeSpentUser + '\n';
        bar1.update(i);

    }

    fs.writeFile(args.dir + '/' + fileName, line, (error) => {
        if (error) throw err;
    });

    bar1.update(json.issues.length);

    bar1.stop();

}

async function getTimeSpentByAccountId( issue, accountId, args ) {
    var result = 0;

    var worklog = await jira.getWorkLog( issue, args );

    for( var i = 0; i < worklog.worklogs.length; i++ ) {
        if( worklog.worklogs[i].author.accountId === accountId ) {
            result += worklog.worklogs[i].timeSpentSeconds;
        }
    }

    return result;
}


module.exports = {
    generateReport
}