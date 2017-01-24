
var ColorSpecs = {};

ColorSpecs["monochrome"] = [
    {f:0, r:0, g:0, b:0},
    {f:1, r:255, g:255, b:255}
];


ColorSpecs["rainbow"] = [
    {f:0, r:110, g:0, b:187},
    {f:0.15, r:0, g:0, b:255},
    {f:0.33, r:0, g:255, b:255},
    {f:0.50, r:0, g:201, b:0},
    {f:0.66, r:255, g:255, b:0},
    {f:0.85, r:255, g:0, b:0},
    {f:0.98, r:93, g:0, b:0},
    {f:1, r:255, g:255, b:255}
];

ColorSpecs["divergent"] = [
    {f: 0, r: 2, g: 3, b: 206},
    {f: 0.25, r: 143, g: 226, b: 255},
    {f: 0.5, r: 255, g: 255, b: 255},
    {f: 0.75, r: 255, g: 241, b: 27},
    {f: 1.0, r: 253, g: 0, b: 0}
];

function getLowerColorStopForFraction(f, colorSpec) {
    var lastStop = colorSpec[0];
    for (var i = 0; i < colorSpec.length; i++) {
        var stop = colorSpec[i];
        if (stop.f >= f) {
            return lastStop;
        }
        lastStop = stop;
    }
    return lastStop; // Might not need this, or in another form
}

function getUpperColorStopForFraction(f, colorSpec) {
    for (var i = 0; i < colorSpec.length; i++) {
        var stop = colorSpec[i];
        if (stop.f >= f) {
            return stop;
        }
    }
    return ColorAltimetrySpec[ColorAltimetrySpec.length - 1]; // Might not need this, or in another form
}


function getColorStopForFraction(f, colorSpec) {
    var lower = getLowerColorStopForFraction(f, colorSpec);
    var upper = getUpperColorStopForFraction(f, colorSpec);
    return {
        "lower": lower,
        "upper": upper
    };
}

function getColorForFraction(f, colorSpec) {

    var lowerUpper = getColorStopForFraction(f, colorSpec);
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

function heightToColorAltimetry(canvas, invert, colorSpecName) {

    var colorSpec = ColorSpecs[colorSpecName];

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
        var color = getColorForFraction(f, colorSpec);

        /*
        var hillShadeResolution = 4;
        if ((i + hillShadeResolution*4) > width*4 && (i - hillShadeResolution*4) < width*4*height) {
            var shadeF = computeHillshadeValueForPoint(src, width, i, hillShadeResolution);
            color.r *= shadeF;
            color.g *= shadeF;
            color.b *= shadeF;
        }
        */

        dst.data[ i ] = color.r;
        dst.data[ i + 1 ] = color.g;
        dst.data[ i + 2 ] = color.b;
        dst.data[ i + 3 ] = 255;
    }

    context.putImageData( dst, 0, 0 );
}


var degToRad = function(v) {
    return v * (Math.PI / 180);
};

var radToDeg = function(v) {
    return v * (180 / Math.PI);
};

function computeHillshadeValueForPoint(src, width, i, res) {

    scale = 100.0;
    var altitude = 35;
    var azimuth = 270;
    var lightIntensity = 1.0;
    var darkIntensity = 1.0;

    var tl, l, bl, tr, r, br, t, b;

    tl = src.data[(i - (width * 4)) - (4 * res)];
    bl = src.data[(i + (width * 4)) - (4 * res)];
    l = src.data[i - (4 * res)];
    r = src.data[i + (4 * res)];
    t = src.data[i - (width * (4 * res))];
    b = src.data[i + (width * (4 * res))];
    tr = src.data[(i - (width * 4)) + (4 * res)];
    br = src.data[(i + (width * 4)) + (4 * res)];

    var x = ((tl + l + bl) - (tr + r + br)) / (8.0 * scale);
    var y = ((bl + b + br) - (tl + t, tr)) / (8.0 * scale);

    var slope = (Math.PI / 2.0) - Math.atan(Math.atan(Math.sqrt(x * x + y * y)));
    var aspect = Math.atan2(y, x);

    var cang = Math.sin(degToRad(altitude)) * Math.sin(slope) +
        Math.cos(degToRad(altitude)) * Math.cos(slope) *
        Math.cos(degToRad(azimuth) - (Math.PI / 2.0) - aspect);

    cang = (cang <= 0) ? 1.0 : (1.0 + (254.0 * cang));
    var f = ((cang / 180.0) * 2) - 1.0;

    if (f > 0) {
        f *= lightIntensity;
    } else if (f < 0) {
        f *= darkIntensity;
    }

    return f;
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