"use strict";

var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 5;

var transformStack = [];

var matrixLocation;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our triangle with three points.

    var vertices = [
        vec2( 0, 0),
        vec2( 0, 1),
        vec2( 1, 0)
    ];

    triangle(vertices[0], vertices[1], vertices[2]);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLocation = gl.getUniformLocation(program, "u_matrix");

    render();
};

function triangle( a, b, c )
{
    points.push( a, b, c );
}

// translates matrix by x, y, z
// https://en.wikipedia.org/wiki/Translation_(geometry)#Matrix_representation
function glTranslatef(x, y, z){
  let matrix = mat4(
      [1, 0, 0, x],
      [0, 1, 0, y],
      [0, 0, 1, z],
      [0, 0, 0, 1]
  );
  let m2 = transformStack.pop(); 
  transformStack.push(mult(m2, matrix));
  console.log(transformStack);
}

// adds an identity matrix to the stack
function glPushMatrix(){
  transformStack.push(mat4());
}

// rotates around the z axis
// https://en.wikipedia.org/wiki/Rotation_matrix#Basic_rotations
function glRotatef(theta){
  let matrix = mat4(
      [Math.cos(theta), -Math.sin(theta), 0, 0],
      [Math.sin(theta),  Math.cos(theta), 0, 0],
      [              0,                0, 1, 0],
      [              0,                0, 0, 1]
  );
  // multiply it with the top stack item
  let m2 = transformStack.pop(); 
  transformStack.push(mult(m2, matrix));
  console.log(transformStack);
}



// draws a right triangle
function RTRI(){
    // makes it so it will get transformed by the next thing on the stack
    let matrix = transformStack.pop()
    gl.uniformMatrix4fv(matrixLocation, false, flatten(matrix));
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}

// draws a square
function BOX(){
    
}

function render(program)
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    glPushMatrix(); // this initializes the transformation matrix to the 
                // identity matrix

    glTranslatef(-1.0, -1.0, 0.0);
    RTRI();


    glPushMatrix(); // this initializes the transformation matrix to the 

    glRotatef(Math.PI);
    RTRI();
}


// Sources:
// https://github.com/greggman/webgl-fundamentals/blob/master/webgl/webgl-2d-geometry-matrix-transform-with-projection.html
