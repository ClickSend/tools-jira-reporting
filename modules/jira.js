/**
 * Time is handled using LUX - all date/times ar econverted upon import.
 */
var https = require('follow-redirects').https;
var lux = require('luxon');

/**
 * Get the raw JSON for a ticket history.
 * @param {*} key 
 * @param {*} args 
 * @returns 
 */
function getHistory( key, args ) {
  return getJson( '/rest/api/3/issue/' + key + '?expand=changelog'. args );
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
 function getStatusSet( ticket ) {
  var statusMap = new Map();

  // When the ticket is created is a special case.
  var histories = ticket.changelog.histories;
  var when = lux.DateTime.fromISO( ticket.fields.created );
  statusMap.set( lux.DateTime.fromISO(ticket.fields.created), 'New' );

  // Here are all of the other statuses
  histories.forEach( (history) => {
    history.items.forEach((item) => {
      if( item.field === 'status' ) {
        when = lux.DateTime.fromISO( history.created );
        statusMap.set( when, item.toString );
      }
    })
  })


  var keys = Array.from( statusMap.keys() );
  keys = keys.sort();
  var result = new Set();
  keys.forEach( (k) => {
    result.add( statusMap.get( k ) );
  });

  return result;

}

function getTimeFrameForTicket( statusData ) {
  var timeFrame = {};
  
  timeFrame.min = statusData[ 0 ].start;
  timeFrame.max = statusData[ 0 ].end;

  // if( ticket.fields.resolution === null ) {
  //   timeFrame.max = lux.DateTime.now();
  // }


  statusData.forEach( (status) => {

    var newStart = status.start;
    var newEnd = status.end;

    if( newStart < timeFrame.min ) {
      timeFrame.min = newStart
    }
    if( timeFrame.max === undefined || newEnd > timeFrame.max ) {
      timeFrame.max = newEnd;
    }
  });

  // Whole day is our minimum granularity here
  timeFrame.min = timeFrame.min.startOf('day')
  timeFrame.max = timeFrame.max.endOf('day');

  return timeFrame;
}

/**
 * This is where we pull out all of the interesting status data for 
 * the ticket.
 * 
 * All date time information is in Lux.
 * 
 * We get the assignee, but we aren't doing anything with it at the moment.
 * @param {*} ticket 
 * @returns Set of StatusData
 */
function getStatusData( ticket ) {
  /**  
   * { start    : <date time>
   *   end      : <date time> - can be null
   *   status   : <string>
   *   assignee : <string> 
   * }
   */
  var statusData = new Array();

  var histories = ticket.changelog.histories;

  statusData.push( {
    start : lux.DateTime.fromISO(ticket.fields.created), 
    end : undefined,
    status : 'New',
    assignee : 'unassigned'} );

  histories.forEach( (history) => {
    history.items.forEach((item) => {
      var setStatus = null;
      var setAssignee = null;

      if( item.field === 'status'  ) {
        setStatus = item.toString;
        statusData.push( {
          start : lux.DateTime.fromISO(history.created),
          end   : undefined,
          status : setStatus,
          assignee : setAssignee
        });
      }
    })
  })

  // Okay - we need to figure out where the ends are.
  // Sort by the start date and the next record'd start date
  // should be the current record's end date
  // Doesn't work for the last status though.

  // sort status data by start date
  // Simple Bubble sort
  for( var i = 0; i < statusData.length - 1; i++) {
    for( var j = i+1; j < statusData.length; j++ ) {
      if( statusData[i].start > statusData[j].start ) {
        var temp = statusData[i];
        statusData[i] = statusData[j];
        statusData[j] = temp;
      }
    }
  }

  var previousStatus = null;
  var previousAssignee = null;

  // now grab those dates
  for( var i = 0; i < statusData.length - 1; i++ ) {
    statusData[i].end = statusData[ i + 1].start;
    if( statusData[i].assignee == null ) {
      statusData[i].assignee = previousStatus;
    }
    if( statusData[i].status == null ) {
      statusData[i].status = previousStatus;
    }

    previousStatus = statusData[i].status;
    previosAssignee = statusData[i].assignee;
  }

  // Here's a weird case.
  // If we are at the last element and there is no end time defined and the ticket is unresolved
  // then it's "still open" and the end date is right this second (because it hasn't yet ended)
  if( statusData[statusData.length - 1].end === undefined && ticket.fields.resolution  === null) {
    statusData[statusData.length - 1].end = lux.DateTime.now();
  }

  return statusData;
}

function setBasic( args ) {
  var mix =  args.username + ":" + args.password;
  args.basic = Buffer.from( mix ).toString( 'base64' );
  return args.basic;
}

function executeQuery( jql, args, headers ) {  
  jql = encodeURIComponent( jql );

  return getJson( '/rest/api/3/search?expand=changelog&maxResults=1000&jql=' + jql, args, headers );
}


function getJson( path, args, headers ) {
  setBasic( args );
  var P = new Promise( (resolve, reject) => {
    var options = {
      'method': 'GET',
      'hostname': args.host,
      'path': path,
      'headers': {
        'Authorization': 'Basic ' + args.basic,
        'Accept': 'application/json'
      },
      'maxRedirects': 20
    };

    if( headers ) {
      for( var key in headers ) {
        options.headers[ key ] = headers[key];
      }
    }
    var req = https.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function (chunk) {
      var body = Buffer.concat(chunks).toString();;
      var j = JSON.parse(body)
      resolve( j );
    });

    res.on("error", function (error) {
      reject(error);
    });
  });

  req.end();
  })

  return P;
}
function getMatchingUsers( query, args ) {
  query = encodeURIComponent( query );

  return getJson( '/rest/api/3/user/search?query=' + query, args );
}

module.exports = {
  getHistory, 
  getStatusSet, 
  getTimeFrameForTicket, 
  getStatusData, 
  executeQuery, 
  getMatchingUsers};