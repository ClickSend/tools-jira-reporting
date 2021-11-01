const jira = require('../../jira.js')
const fs = require('fs')

async function generateReport( args ) {
//    validateArgs(args);

    if (Array.isArray(args.user)) {
        for (var i = 0; i < args.user.length; i++) {
            await generateUserReport(args.user[i], args);
        }
    }
    else {
        generateUserReport(args.user, args);
    }

}

async function generateUserReport( userName, args ) {

    var user = await jira.getUserFromUserName( userName, args );

    // JQL = (assignee changed to Kevin before 2021-10-14 and assignee changed from kevin after 2021-10-01) OR (assignee changed from kevin during(2021-10-01,2021-10-14)) or (assignee changed to kevin during(2021-10-01,2021-10-14))
    var JQL = ' (    (assignee changed to ' + user.accountId + ' before 2021-10-14 and assignee changed from ' + user.accountId + ' after 2021-10-01)'
            + '  OR (assignee changed from ' + user.accountId + ' during(' + args.startDate + ',' + args.endDate + '))'
            + '  OR (assignee changed to ' + user.accountId + ' during(' + args.startDate + ',' + args.endDate + '))'
            + ' ) '
            + ' AND "Story Points[Number]" is not empty'
            + ' AND resolution = Done';

    var json = await jira.executeQuery( JQL, args );
    var fileName = userName + '.csv';

    var line =  "Key,Points,Total Time,User Time";

    for( var i = 0; i < json.issues.length; i++ ) {
        var issue = json.issues[i];
        var storyPoints = await jira.getIssueFieldValue( issue, "Story Points", args );
        var timeSpentTotal = await  jira.getIssueFieldValue( issue, "Time Spent", args );
        var timeSpentUser = await getTimeSpentByAccountId( issue.key, user.accountId, args );

        line +=  issue.key + "," + storyPoints + "," + timeSpentTotal + "," + timeSpentUser + '\n';
    }

    fs.writeFile(fileName, line, (error) => {
       
        if (error) throw err;
    });

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