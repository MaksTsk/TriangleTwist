"use strict";

var ShapeType = {
    TRIANGLE: 'triangle',
    SQUARE: 'square'
};

var canvas;
var gl;

var points;
var bufferId;

var vPosition;
var uAngle;

var numTimesToDivide = 5;
var angle = 0;
var currentShapeType = ShapeType.TRIANGLE;

$(document).ready(function (){
    init();
    $('#power-slider').change(powerSliderChanged);
    $('#angle-slider').change(onAngleSliderChanged);
    $('#shape-type').change(onShapeTypeChanged);
});

function onShapeTypeChanged () {
    currentShapeType = $(this).val();

    updateTrianglesBuffer();
    render();
}

function onAngleSliderChanged () {
    var sliderValue = parseFloat($(this).val());

    angle = sliderValue * Math.PI / 180;;

    console.log(sliderValue);
    console.log(angle);
    updateAngleOnShader();

    render();
}

function updateAngleOnShader () {
    gl.uniform1f(uAngle, angle);
}

function powerSliderChanged () {
    numTimesToDivide = parseInt($(this).val());

    updateTrianglesBuffer();

    render();
}

function init () {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    uAngle = gl.getUniformLocation(program, 'uAngle');

    console.log(uAngle);

    // Load the data into the GPU

    bufferId = gl.createBuffer();

    updateTrianglesBuffer();

    render();
};

function getVertexiesByShapeType (shapeType) {
    switch(shapeType){
        case ShapeType.TRIANGLE:
            return [
                vec2( 0, 1 ),
                vec2(  -0.5, - Math.sqrt(3)/2),
                vec2(  0.5, - Math.sqrt(3)/2 )
            ];
        case ShapeType.SQUARE:
            return [
                vec2(-0.5,-0.5),
                vec2(-0.5, 0.5),
                vec2(0.5, 0.5),
                vec2(0.5, -0.5)
            ];
        default: 
            throw ('Unknown shape type');
    }
}

function divideShape (vertices, shapeType) {
    switch(shapeType){
        case ShapeType.TRIANGLE:
            divideTriangle( vertices[0], vertices[1], vertices[2],
                   numTimesToDivide);
            break;
        case ShapeType.SQUARE:
            divideTriangle( vertices[0], vertices[1], vertices[2],
                   numTimesToDivide);
            divideTriangle( vertices[0], vertices[2], vertices[3],
                   numTimesToDivide);
            break;
        default: 
            throw ('Unknown shape type');
    }
}

function updateTrianglesBuffer () {   
    points = [];

    var vertices = getVertexiesByShapeType(currentShapeType);

    divideShape(vertices, currentShapeType);

    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );

    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
}

function triangle( a, b, c )
{
    points.push( a, b, c );
}

function divideTriangle( a, b, c, count )
{
    // check for end of recursion

    if ( count == 0 ) {
        triangle( a, b, c );
    }
    else {

        //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles

        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
        divideTriangle( ab, bc, ac, count);
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    for (var i=0; i<points.length; i+=3) {
        gl.drawArrays( gl.LINE_LOOP, i, 3);
    }  
}
