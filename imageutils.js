
var BlackWhiteColorSpec = [
    {f:0, r:0, g:0, b:0},
    {f:1, r:255, g:255, b:255}
];

var ColorAltimetrySpec = [
    {f:0, r:110, g:0, b:187},
    {f:0.15, r:0, g:0, b:255},
    {f:0.33, r:0, g:255, b:255},
    {f:0.50, r:0, g:201, b:0},
    {f:0.66, r:255, g:255, b:0},
    {f:0.85, r:255, g:0, b:0},
    {f:0.98, r:93, g:0, b:0},
    {f:1, r:255, g:255, b:255}
];

function getLowerColorStopForFraction(f) {
    var lastStop = ColorAltimetrySpec[0];
    for (var i = 0; i < ColorAltimetrySpec.length; i++) {
        var stop = ColorAltimetrySpec[i];
        if (stop.f >= f) {
            return lastStop;
        }
        lastStop = stop;
    }
    return lastStop; // Might not need this, or in another form
}

function getUpperColorStopForFraction(f) {
    for (var i = 0; i < ColorAltimetrySpec.length; i++) {
        var stop = ColorAltimetrySpec[i];
        if (stop.f >= f) {
            return stop;
        }
    }
    return ColorAltimetrySpec[ColorAltimetrySpec.length - 1]; // Might not need this, or in another form
}


function getColorStopForFraction(f) {
    var lower = getLowerColorStopForFraction(f);
    var upper = getUpperColorStopForFraction(f);
    return {
        "lower": lower,
        "upper": upper
    };
}

function getColorForFraction(f) {

    var lowerUpper = getColorStopForFraction(f);
    var lower = lowerUpper.lower;
    var upper = lowerUpper.upper;

    var f2 = (f - lower.f) / (upper.f - lower.f);

    var r = (upper.r * f2) + (lower.r * (1 - f2));
    var g = (upper.g * f2) + (lower.g * (1 - f2));
    var b = (upper.b * f2) + (lower.b * (1 - f2));

    return {
        r: r,
        g: g,
        b: b
    };
}

function heightToColorAltimetry(canvas, invert) {
    var minMax = getMinMaxValuesMonochrome(canvas);

    var min = minMax.min;
    var max = minMax.max;


    var context = canvas.getContext( '2d' );

    var width = canvas.width;
    var height = canvas.height;

    var src = context.getImageData( 0, 0, width, height );
    var dst = context.createImageData( width, height );

    for ( var i = 0, l = width * height * 4; i < l; i += 4 ) {
        var value = src.data[ i ];
        var f = (value - min) / (max - min);

        if (invert) {
            f = 1.0 - f;
        }
        var color = getColorForFraction(f, invert);

        dst.data[ i ] = color.r;
        dst.data[ i + 1 ] = color.g;
        dst.data[ i + 2 ] = color.b;
        dst.data[ i + 3 ] = 255;
    }

    context.putImageData( dst, 0, 0 );
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
    var dst = context.createImageData( width, height );

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