const jira = require('../../jira.js')

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
    var JQL = '    (assignee changed to ' + user.accountId + ' before 2021-10-14 and assignee changed from ' + user.accountId + ' after 2021-10-01)'
            + ' OR (assignee changed from ' + user.accountId + ' during(' + args.startDate + ',' + args.endDate + '))'
            + ' OR (assignee changed to ' + user.accountId + ' during(' + args.startDate + ',' + args.endDate + '))';

    var json = await jira.executeQuery( JQL, args );
    var storyPoints = await jira.getTicketFieldValue( json.issues[1], "Story Points", args );
    
    console.log( "Key\tStory Points\tTotal Time Spent\tUser Time Spent");

    for( var i = 0; i < json.issues.length; i++ ) {
        var ticket = json.issues[i];
        var storyPoints = await jira.getTicketFieldValue( ticket, "Story Points", args );
        var timeSpentTotal = await  jira.getTicketFieldValue( ticket, "Time Spent", args );
        var timeSpentUser = getTimeSpentByAccountId( ticket, user.id );

        console.log( ticket.key + "\t" + storyPoints + "\t" + timeSpentTotal + "\t" + timeSpentUser );
    }

}

function getTimeSpentByAccountId( ticket, accountId ) {
    var result = 0;

    // go through the history and grab all o the "timespent" values from each update made by the user.
    for( var h = 0; i < ticket.changelog.histories.length; i++ ) {
        var history = ticket.changelog.histories[h];
        if( history.author.accountId === accountId ) {
            for( var i = 0; i < history.items.length; i++ ) {
                var item = history.items[i];
                if( item.field === 'timespent' ) {
                    result += item.field.to;
                }
            }
        }
    }

    return result;
}


module.exports = {
    generateReport
}