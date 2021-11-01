const jira = require('../../jira.js')
//const img = require('../../jira-img.js')
const fs = require('fs')
const layout = require('./layout.default.json')


async function generateReport(args) {
    //    validateArgs(args);

    if (Array.isArray(args.keys)) {
        for (var i = 0; i < args.keys.length; i++) {
            await generateKeyReport(args.keys[i], args);
        }
    }
    else {
        generateKeyReport(args.key, args);
    }
}

/**
 * Generate a single report - this isn't called externally, but we export it
 * anyway, just in case someone else wants to use it.
 * @param {*} key 
 * @param {*} args 
 */
async function generateKeyReport(key, args) {
    var layout = args.layout;

    var ticket = await jira.getHistory(key, args);
    var statusData = getStatusMap(ticket);
    var headers = getStatusSet(statusData);
    var statusData = jira.getStatusData(ticket);
    var timeRange = jira.getTimeFrameForTicket(statusData);

    var canvas = img.initCanvas(layout);

    img.generateTitle(canvas, ticket.key, statusData[statusData.length - 1].status);
    img.generateStatusHeaders(canvas, layout, headers);
    img.generateDateStamps(canvas, layout, timeRange);
    img.generateStatusBlocks(canvas, layout, timeRange, statusData);

    console.log("Generating report  reports/" + key + '.svg');
    fs.writeFileSync("reports/" + key + '.svg', canvas.toBuffer());
}

/**
 *  Get all of the status change times for the ticket.
 */
function getStatusHistory(ticket) {
    var statusMap = new Map();

    // When the ticket is created is a special case.
    var histories = ticket.changelog.histories;
    var when = lux.DateTime.fromISO(ticket.fields.created);
    statusMap.set(lux.DateTime.fromISO(ticket.fields.created), 'New');

    // Here are all of the other statuses
    histories.forEach((history) => {
        history.items.forEach((item) => {
            if (item.field === 'status') {
                when = lux.DateTime.fromISO(history.created);
                statusMap.set(when, item.toString);
            }
        })
    })

    return statusMap;
}
/**
* We want to get a UNIQUE set of all of the statuses that 
* have been set on this ticket. 
* 
* The tickets are listed in the order of their first 
* occurance on the ticket.
* 
* This is where we convert the times into LUX
* 
* @param {*} ticket 
* @returns An ordered set of the statuses for the ticket-
*/
function getStatusSet(ticket) {
    var statusMap = new Map();

    // When the ticket is created is a special case.
    var histories = ticket.changelog.histories;
    var when = lux.DateTime.fromISO(ticket.fields.created);
    statusMap.set(lux.DateTime.fromISO(ticket.fields.created), 'New');

    // Here are all of the other statuses
    histories.forEach((history) => {
        history.items.forEach((item) => {
            if (item.field === 'status') {
                when = lux.DateTime.fromISO(history.created);
                statusMap.set(when, item.toString);
            }
        })
    })


    var keys = Array.from(statusMap.keys());
    keys = keys.sort();
    var result = new Set();
    keys.forEach((k) => {
        result.add(statusMap.get(k));
    });

    return result;

}

module.exports = { generateReport }