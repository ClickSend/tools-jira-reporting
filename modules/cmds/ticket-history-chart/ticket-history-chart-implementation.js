const jira = require( '../../jira.js' )
const img  = require( '../../jira-img.js' )
const fs = require( 'fs' )
const layout = require( './layout.default.json')


function generateReport( args ) {
    args.user.forEach( u => generateUserReport( u, args ));
}

/**
 * Generate a single report - this isn't called externally, but we export it
 * anyway, just in case someone else wants to use it.
 * @param {*} key 
 * @param {*} args 
 */
async function generateUserReport( user, args ) {
    var layout = args.layout;

    var ticket = await jira.getHistory( key, args );
    var headers = jira.getStatusSet(ticket);
    var statusData = jira.getStatusData(ticket);
    var timeRange = jira.getTimeFrameForTicket(statusData);
    
    var canvas = img.initCanvas( layout );
    // img.drawBox( canvas, layout.header );
    // img.drawBox( canvas, layout.body );
    // img.drawBox( canvas, layout.dates );
    
    img.generateTitle( canvas, ticket.key, statusData[statusData.length - 1].status );
    img.generateStatusHeaders( canvas, layout, headers );
    img.generateDateStamps( canvas, layout, timeRange );
    img.generateStatusBlocks( canvas, layout, timeRange, statusData );

    console.log( "Generating report  reports/" + key + '.svg');
    fs.writeFileSync( "reports/" + key + '.svg', canvas.toBuffer() );
  }