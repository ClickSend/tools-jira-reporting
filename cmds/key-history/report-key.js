const jira = require( '../../modules/jira.js' )
const img  = require( '../../modules/jira-img.js' )
const fs = require( 'fs' )
const layout = require( './layout.default.json')

function addCommandOptions( args ) {
    return args.command( 
        ['key-report', 'rpt-key'], 
        'Produce a timeline report for a specific Jira key (or multiple reports for multiple keys)',
        function(argv) {
            generateReport( args );
        }
    )
    .option( 'key', {
        describe : 'The Jira key(s) on which to report',
        requiresArg : true,
        array : true
      });
}

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

    // layout.header.labels.forEach( label => {
    //     img.drawBox( canvas, { 
    //         left : label.x, 
    //         top : 0,
    //         width : label.width,
    //         height : label.y } );
    // });
    // TODO - use the directorytempla as a prefix
    console.log( "Generating report  reports/" + key + '.svg');
    fs.writeFileSync( "reports/" + key + '.svg', canvas.toBuffer() );
  }

  exports.command = 'report-key';
  exports.desc = "Generate a timeline report for a given key or keys"
  exports.handler = generateReport;
