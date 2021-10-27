
/**
 * 
 * @param {*} timestamp - the timestamp (millis)
 * @returns 
 */
function startOfDay( timestamp ) {
    var d = new Date( timestamp );
    return d.setHours( 0, 0, 0, 0 );
}

function endOfDay( timestamp ) {
    var d = new Date( timestamp );
    d = new Date( d.setHours( 0, 0, 0, 0 ) );
    d.setDate( d.getDate() + 1 );
    return d.getTime();
}

module.exports = { startOfDay, endOfDay }