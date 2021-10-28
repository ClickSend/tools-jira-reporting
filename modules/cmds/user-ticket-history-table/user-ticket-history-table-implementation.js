const jira = require('../../jira.js')
const fs = require('fs')
const lux = require('luxon');
const { DateTime } = require('luxon');
const Array2D = require("array-2d-js");
const { UV_FS_O_FILEMAP } = require('constants');
const { monitorEventLoopDelay } = require('perf_hooks');

async function generateUserTicketHistoryReport(args) {
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
async function generateUserReport(user, args) {
    var u = await jira.getMatchingUsers(user, args);

    if (u === undefined || u.length === 0) {
        throw "User name " + user + " did not return any valid users.";
    }
    if (u.length > 1) {
        var err = "User name " + user + " matched multiple users.  Please be more specific. (";
        u.forEach(usr => {
            err += "'" + usr.displayName + "', ";
        })
        err = err.substr(0, err.length - 2);

        err += ")";

        throw err;
    }

    args.fullUser = u[0];
    var userID = args.fullUser.accountId;

    var jql = 'assignee was ' + userID + ' and createdDate < "' + args.endDate + '" and ( resolution = unresolved or resolutiondate > "' + args.startDate + '")';
    if( args.jql != undefined ) {
        jql += " and " + args.jql;
    }
    var jiraResult = await jira.executeQuery(jql, args, { maxResults: 1000 });

    // Get the extracted date times.
    var extracted = extractDateTimes(jiraResult, args);
    if (extracted.length == 0) {
        console.debug("No records found");
        console.debug(args.jql);
        throw "No records found.";
    }

    // find the min and max
    var startTime = extractStartTime(extracted).startOf('hour');
    var endTime = extractEndTime(extracted).endOf('hour');

    // Get all of our tickets (x-axis)
    var tickets = getAllTickets(extracted);

    var time = startTime;

    var timeSlots = Math.round(0.5 + (endTime - startTime) / 1000 / 60 / args.granularity);
    var data = new Array2D(tickets.length + 1, timeSlots + 1);

    // Add the headers
    data.fillPosition(0, 0, "Time")

    var index = 1;
    tickets.forEach((ticket) => {
        data.fillPosition(index++, 0, ticket);
    });

    // Now add all of the times
    // Write these hour in 15 minute incremenets
    index = 1;
    while (time < endTime) {
        time = time.plus({ minutes: args.granularity });
        data.fillPosition(0, index++, time);
    }

    extracted.forEach((ex) => {
        var x = tickets.indexOf(ex.key) + 1;
        var y = getIndexFromTime(startTime, ex.when, args);

        var result = data.getPosition(x, y);
        if (result === undefined) {
            result = "";
        }

        if (ex.what == "Assigned") {
            result = result + "S";
        }
        else {
            result = result + "E";
        }
        data.fillPosition(x, y, result);
    })

    // Collapse everything
    for (var x = 1; x < data.width; x++) {
        for (var y = 1; y < data.height; y++) {
            data.fillPosition(x, y, collapseSEs(data.getPosition(x, y)));
        }
    }

    // If the first entry in a row is an "E", then the whole row up to that point is "Y".
    fillInitialEs(data);
    fillYN(data);

    // Remove the things that they didn't work on in this time period
    removeEmptyTickets(data);

    dumpData(data, args.fullUser.displayName + '.csv', args);

}

function removeEmptyTickets(data) {
    for (var x = data.width - 1; x > 0; x--) {
        var count = 0;
        for (var y = 0; y < data.height; y++) {
            if (data.getPosition(x, y) === 'Y') {
                // They worked on it - skip to the next ticket
                count++;
                break;
            }
        }
        if (count === 0) {
            data.removeColumn(x);
        }
    }
}

function validateArgs(args) {
    // Check required fields
    if (args.user == undefined) {
        throw "history-user: --user required";
    }

    if (args.endDate === undefined) {
        args.endDate = DateTime.now().toFormat('yyyy-MM-dd');
    }

    if (args.startDate === undefined) {
        args.startDate = DateTime.now().minus({ week: 4 }).toFormat('yyyy-MM-dd');
    }

    // check format
    //   if( args.endDate) {

    //   }

    // if( args.startDate ) {

    // }

    // Set defaults
    if (args.granularity == undefined) {
        args.granularity = 60;
    }

}

function dumpData(data, fileName, args) {
    var line = "";
    var startDate = lux.DateTime.fromISO(args.startDate);
    var endDate = lux.DateTime.fromISO(args.endDate).plus({ day: 1 });

    for (var y = 0; y < data.height; y++) {
        var when = data.getPosition(0, y);
        if (when < startDate || when > endDate) {
            continue;
        }
        if (!args.includeWeekends && when.weekday > 5) {
            continue;
        }
        if (!args.allDay && (when.hour < 9 || when.hour > 17)) {
            continue;
        }

        for (var x = 0; x < data.width; x++) {
            if (x > 0) {
                line += ',';
            }
            if (x == 0 && y > 0) {
                line += data.getPosition(x, y).toFormat('yyyy-MM-dd HH:mm');
            }
            else {
                line += data.getPosition(x, y);
            }
        }
        line += '\n';
    }

    if (args.dir.substr(args.dir.length - 1) == "/") {
        fileName = args.dir + fileName;
    }
    else {
        fileName = args.dir + "/" + fileName;
    }

    console.log("Writing to " + fileName);
    fs.writeFile(fileName, line, (error) => {
        if (error) throw err;
    });
}

function fillYN(data) {

    for (var x = 1; x < data.width; x++) {
        var value = 'N';
        for (var y = 1; y < data.height; y++) {
            var v2 = data.getPosition(x, y);

            // If it's a blip, then we have a "Y", but we don't change VALUE
            if (v2 === 'B') {
                data.fillPosition(x, y, 'Y');
            }
            // No matter what we have, if we have a S(tart) or Y, then we 
            // write a Y and continue with it.
            else if (v2 === 'S' || v2 === 'Y') {
                data.fillPosition(x, y, 'Y');
                value = 'Y'
            }
            // No matter what we have, if we have a S(tart) or Y, then we 
            // write a Y and continue with it.
            else if (v2 === 'E') {
                data.fillPosition(x, y, 'N');
                value = 'N';
            }
            // Otherwise, just continue filling with the same thing
            else {
                data.fillPosition(x, y, value);
            }

        }
    }

    return data;
}

function fillInitialEs(data) {
    for (var x = 1; x < data.width; x++) {
        for (var y = 1; y < data.height; y++) {
            if (data.getPosition(x, y) === 'E') {
                // Okay - fill this row to the current position to "Y"
                for (var z = 1; z <= y; z++) {
                    data.fillPosition(x, z, "Y");
                }
                break; // out of the loop
            }
            if (data.getPosition(x, y) === 'S') {
                break;
            }
        }
    }
}

// The START of the windows is all we care about
function getIndexFromTime(startTime, searchTime, args) {
    var delta = searchTime.diff(startTime);
    var lines = delta / (1000 * 60 * args.granularity);

    return Math.round(lines) + 1;

}

function collapseSEs(value) {
    if (value === undefined) {
        return undefined;
    }

    if (value.length == 1) {
        return value;
    }

    // SE or ES is the same as nothing
    if (value.length % 2 == 0) {
        return 'B'; // We had a blip!
    }

    // Odd numbers - so whatever there is the most of, that wins.
    var s = (value.match(new RegExp("S", "g")) || []).length
    var e = (value.match(new RegExp("E", "g")) || []).length

    if (s > e) {
        return "S";
    }
    else {
        return "E";
    }
}

/**
 *  Get all tickets in sorted order
 * 
 */
function getAllTickets(data) {
    var keys = new Set();
    // A set makes it unique for minimal effort
    data.forEach((entry) => {
        keys.add(entry.key);
    });

    // Convert to an array so that we can sort it easily.
    var result = [];
    keys.forEach((entry) => {
        result.push(entry);
    });

    return result.sort();
}

function extractStartTime(data) {
    var min = undefined;
    data.forEach((entry) => {
        if (min === undefined) {
            min = entry.when;
        }
        else if (entry.when < min) {
            min = entry.when;
        }
    });

    return min;
}

function extractEndTime(data) {
    var max = undefined;
    data.forEach((entry) => {
        if (max === undefined) {
            max = entry.when;
        }
        else if (entry.when > max) {
            max = entry.when;
        }
    });

    return max;
}

function extractDateTimes(jiraResult, args) {
    var fullName = args.fullUser.displayName;

    var result = [];

    jiraResult.issues.forEach((issue) => {
        var key = issue.key;

        issue.changelog.histories.forEach((history) => {
            history.items.forEach((item) => {
                if (item.field === 'assignee') {

                    var timestamp = lux.DateTime.fromISO(history.created);
                    if (item.toString === fullName) {
                        result.push({
                            key: key,
                            what: 'Assigned',
                            when: timestamp
                        });
                    }
                    if (item.fromString === fullName) {
                        result.push({
                            key: key,
                            what: 'Unassigned',
                            when: timestamp
                        });
                    }
                }
            })
        })
    });

    return result;
}

module.exports = { generateUserTicketHistoryReport };