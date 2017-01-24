

function heightToColorAltimetry(canvas) {

}


/**
 * Expects monochrome images, only checks red channel
 * @param canvas
 * @returns {{min: number, max: number}}
 */
function getMinMaxValuesMonochrome(canvas) {
    var context = canvas.getContext( '2d' );

    var width = canvas.width;
    var height = canvas.height;

    var min = 255;
    var max = 0;

    var src = context.getImageData( 0, 0, width, height );

    for ( var i = 0, l = width * height * 4; i < l; i += 4 ) {
        var value = src.data[ i ];
        min = (value < min) ? value : min;
        max = (value > max) ? value : max;
    }

    return {
        "min": min,
        "max": max
    };
}



function invertMap( canvas ) {
    var context = canvas.getContext( '2d' );

    var width = canvas.width;
    var height = canvas.height;

    var src = context.getImageData( 0, 0, width, height );
    var dst = context.createImageData( width, height );

    for ( var i = 0, l = width * height * 4; i < l; i += 4 ) {


        dst.data[ i ] = 255 - src.data[ i ];
        dst.data[ i + 1 ] = 255 - src.data[ i + 1 ];
        dst.data[ i + 2 ] = 255 - src.data[ i + 2 ];
        dst.data[ i + 3 ] = src.data[ i + 4 ];
    }

    context.putImageData( dst, 0, 0 );
}

// height2normal - www.mrdoob.com/lab/javascript/height2normal/
function height2normal( canvas ) {

    var context = canvas.getContext('2d');

    var width = canvas.width;
    var height = canvas.height;

    var src = context.getImageData(0, 0, width, height);
    var dst = context.createImageData(width, height);

    for (var i = 0, l = width * height * 4; i < l; i += 4) {

        var x1, x2, y1, y2;

        if (i % ( width * 4 ) == 0) {
            // left edge
            x1 = src.data[i];
            x2 = src.data[i + 4];
        } else if (i % ( width * 4 ) == ( width - 1 ) * 4) {
            // right edge
            x1 = src.data[i - 4];
            x2 = src.data[i];
        } else {
            x1 = src.data[i - 4];
            x2 = src.data[i + 4];
        }

        if (i < width * 4) {
            // top edge
            y1 = src.data[i];
            y2 = src.data[i + width * 4];
        } else if (i > width * ( height - 1 ) * 4) {
            // bottom edge
            y1 = src.data[i - width * 4];
            y2 = src.data[i];
        } else {
            y1 = src.data[i - width * 4];
            y2 = src.data[i + width * 4];
        }

        dst.data[i] = ( x1 - x2 ) + 127;
        dst.data[i + 1] = ( y1 - y2 ) + 127;
        dst.data[i + 2] = 255;
        dst.data[i + 3] = 255;

    }

    context.putImageData(dst, 0, 0);
}