
const { createCanvas } = require('canvas')
const time = require( './timeutils.js' )
var lux = require('luxon');

const FONT = '13px Helvetica';
const TITLE_FONT = '18px Helvetica Bold';
const MILLIS_PER_HOUR = (1000 * 60 * 60 );
const MILLIS_PER_15MINUTES = MILLIS_PER_HOUR / 4;
const MILLIS_PER_DAY = MILLIS_PER_HOUR * 24;
const MILLIS_PER_2DAYS = MILLIS_PER_DAY * 2;
const MILLIS_PER_3DAYS = MILLIS_PER_DAY * 3;
const MILLIS_PER_4DAYS = MILLIS_PER_DAY * 4;
const MILLIS_PER_5DAYS = MILLIS_PER_DAY * 5;
const MILLIS_PER_WEEK = MILLIS_PER_DAY * 7;
const MILLIS_PER_FORTNIGHT = MILLIS_PER_WEEK * 2;
const MILLIS_PER_4WEEK = MILLIS_PER_WEEK * 4;
const MAX_STEPS = 60;

const COLOURS = [ 
    'rgba(0,0,0,1)',
    'rgba(192,192,192,1)',
    'rgba(128,0,0,1)',
    'rgba(0,128,128,1)',
    'rgba(255,0,0,1)',
    'rgba(128,0,128,1)',
    'rgba(0,0,255,1)',
    'rgba(255,0,255,1)',
    'rgba(0,128,0,1)',
    'rgba(0,255,0,1)',
    'rgba(128,128,0,1)',
    'rgba(0,0,128,1)',
    'rgba(0,255,255,1)'
];

/**
 * Initialise a canvas appropriately sized for the ticket.
 * @param {*} ticket 
 * @returns canvas
 */
function initCanvas( layout ) {
    // TODO - take out the *2
    const canvas = createCanvas(layout.width, layout.height, 'svg' );
    return canvas;
}

/**
 * 
 * @param {*} canvas 
 * @param {*} text 
 * @param {*} x 
 * @param {*} y 
 * @param {*} spacing 
 * @param {*} alignment 
 * @param {*} rotation 
 */
function renderTextList( canvas, text, x, y, spacing, alignment, rotation ) {
    const ctx = canvas.getContext('2d')

}

function getWidestText( canvas, text, options ) {
    const ctx = canvas.getContext('2d');
    ctx.save();

    if(options.font != undefined ) {
        ctx.font = options.font;
    }

    var width = 0;

    if( Array.isArray(text)) {
        text.forEach( t => {
            var w = ctx.measureText( t ).width;
            if( w > width ) {
                width = w;
            }
        });
    }
    ctx.restore();

    return width;
}

function getTallestText( canvas, text, options ) {
    const ctx = canvas.getContext('2d')
    if(options.font != undefined ) {
        ctx.font = options.font;
    }
    var width = 0;
    if( Array.isArray(text)) {
        text.forEach( t => {
            var w = ctx.measureText( t ).width;
            if( w > width ) {
                width = w;
            }
        });
    }
    ctx.restore();

    return width;
}

function generateStatusHeaders( canvas, layout, headers ) {
    const ctx = canvas.getContext('2d')

    var textMetrics = ctx.measureText( '2020-01-01' );
    var textHeight = textMetrics.actualBoundingBoxAscent  - textMetrics.actualBoundingBoxDescent

    var x = layout.header.left;
    var y = layout.header.top;
    var height = layout.header.height;

    layout.header.labels = new Map();

    spacing = layout.header.width / headers.size;
    ctx.font = FONT;
    var colourIndex = 0;


    headers.forEach( (status) => {
        colourIndex++;
        if( colourIndex >= COLOURS.size ) {
            colourIndex = 0;
        }

        ctx.save();
        ctx.translate( (textHeight / 2.0 ) + x + (spacing / 2.0 ), height );
        ctx.rotate( -Math.PI/2);
//        ctx.translate( 0, 0);
        ctx.fillText(status, 0, 0)


        layout.header.labels.set( status, {
             x : x, 
             y : height,
            width : spacing,
            colour : COLOURS[colourIndex] });

        ctx.restore();

        // down the middle of the data area.
        ctx.strokeStyle = COLOURS[colourIndex];
        ctx.beginPath();
        ctx.lineTo( x + spacing / 2, layout.header.top + layout.header.height + 10 );
        ctx.lineTo( x + spacing / 2, layout.body.top + layout.body.height );
        ctx.stroke();
        
        x += spacing;
    })
}

function getYFromTime( minTimeMillis, maxTimeMillis, top, height, timeMillis ) {
    var millis = maxTimeMillis - minTimeMillis;
    var ppms = height / millis;
    return top + ((timeMillis - minTimeMillis) * ppms)
}

function generateDateStamps( canvas, layout, timeRange ) {

    var startOfFirstDay = timeRange.min.startOf('day')
    var endOfLastDay    = timeRange.max.endOf('day');

    const interval = lux.Interval.fromDateTimes( startOfFirstDay, endOfLastDay );

    const scale = getScale( interval );

    // Get the text size
    const ctx = canvas.getContext('2d')
    ctx.font = FONT;
    var textSize = getCalculatedTextMetrics( ctx, "2020-01-01" );

    var time = startOfFirstDay;
    var y = layout.dates.top + textSize.totalHeight;
    var majorCount = interval.length() / scale.major;
    var startY = y;
    var endY = y;
    
    var spacing = (layout.dates.height - textSize.totalHeight) / (majorCount - 1);

    while( time <= endOfLastDay ) {
       
        label = time.toFormat( scale.format );
        textSize = getTextDimensions( ctx, label );

        // Draw a line from the center of the text
        ctx.strokeStyle = 'rgba(128,128,128,0.5)';
        ctx.beginPath();
        ctx.lineTo( layout.dates.left + textSize.width + 10, y - textSize.height / 2 );
        ctx.lineTo( layout.header.left + layout.header.width, y - textSize.height / 2 );
        ctx.stroke();
        
        endY = y;
        ctx.fillText(label, layout.dates.left, y);
        y += spacing;
        time = time.plus( scale.major );
    }
    
    layout.time = {
        start : { y : startY },
        end : { y : endY }
    };

    ctx.restore();
}
function getCalculatedTextMetrics( ctx, text, options ) {
    ctx.save();
    var result = {};

    if( options.font) {
        ctx.font = options.font;
    }

    var textMetrics = ctx.measureText( text );

    textMetrics.middle = (( textMetrics.alphabeticBaseline + textMetrics.emHeighAscent ) + ( textMetrics.alphabeticBaseline - emHeightDescent )) / 2;
    textMetrics.verticalOffsetToMiddle = textMetrics.alphabeticBaseline - textMetrics.middle;
    textMetrics.totalHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    ctx.restore();

    return textMetrics;
}

function generateTitle( canvas, name, endStatus ) {
    const ctx = canvas.getContext('2d');
    ctx.font = TITLE_FONT;
    var textMetrics = ctx.measureText( '2020-01-01' );
    var textHeight = textMetrics.actualBoundingBoxAscent; // - textMetrics.actualBoundingBoxDescent

    var x = 10
    var y = 10 + textHeight;

    ctx.save();
    ctx.fillText(name, x, y );
    
    ctx.font = FONT;
    textMetrics = ctx.measureText( 'Current Status : ' + endStatus );
    ctx.fillText( 'Current Status : ' + endStatus, x, y + textMetrics.actualBoundingBoxAscent + 10);

    ctx.restore();
}

function generateStatusBlocks( canvas, layout, timeRange, statusData ) {
    // The big one here is how do we translate time into pixels
    // We know the size of the date block
    // And we know the number of milliseconds - so we are looking for
    // Pixels per Milliseconnd
    var startDate = statusData[0].start;
    const ctx = canvas.getContext('2d')

    // Remember - we graph from the CENTER of the lines - which are in the MIDDLE of the 
    // Date text - so we have to shrink the usable area by a bit a shift everythign down.
    ctx.font = FONT;
    var textMetrics = ctx.measureText( '2020-01-01' );
    var textHeight = textMetrics.actualBoundingBoxAscent; // - textMetrics.actualBoundingBoxDescent


   for( var i = 0; i < statusData.length; i++ ) {
    // for( var i = 0; i < 2; i++ ) {
        var top = getYFromTime( timeRange.min, timeRange.max, layout.dates.top + ( textHeight / 2 ), layout.dates.height - textHeight, statusData[i].start  );
        var bottom = getYFromTime( timeRange.min, timeRange.max, layout.dates.top + ( textHeight / 2 ), layout.dates.height - textHeight, statusData[i].end );

        var status = statusData[i].status;
        if( status != null ) {
            var left = layout.header.labels.get( status ).x;
            var width = layout.header.labels.get( status ).width;
            ctx.fillStyle = layout.header.labels.get( status ).colour;
            ctx.beginPath();
            var height = bottom - top;
            if( height < 1 ) {
                height = 1;
            }

            ctx.fillRect( left, top, width, height);
            ctx.stroke();
        }
    }
}


/**
 * Get the scale along the time axis.
 * 
 * This is the smallest unit we are going to display.
 * 
 * The thinking here is that we don't want to display more than 60 (MAX_STEPS) 
 * labels along the time axis.  We get the smallest unit that will come as
 * close to 60 steps without going over
 * @param {*} timeRange 
 */
function getScale( interval ) {
    var millis = interval.length();

    if( Math.floor( millis / MILLIS_PER_HOUR < MAX_STEPS ) ) {
        return {
            scale : 'HOUR',
            major : MILLIS_PER_HOUR,
            minor : MILLIS_PER_15MINUTES,
            format: 'yyyy-MM-dd HH:MM'
        };
    }
    else if( Math.floor( millis / MILLIS_PER_DAY < MAX_STEPS ) ) {
        return {
            scale : 'DAY',
            major : MILLIS_PER_DAY,
            minor : MILLIS_PER_HOUR * 6,
            format: 'yyyy-MM-dd'
        };
    }
    else {
        return {
            scale : 'WEEK',
            major : MILLIS_PER_WEEK,
            minor : MILLIS_PER_DAY,
            format: 'yyyy-MM-dd'
        };
    }  
    // We can add on fortnight and 4-week chunks here too.
}


module.exports = { initCanvas, generateStatusHeaders, generateDateStamps, generateStatusBlocks, generateTitle, getTallestText }