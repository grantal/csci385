"use strict";

var canvas;
var gl;

var points = [];

// stack of transformation matrices
var transformStack = [];

// the matrix that will multiply the location
var transformMatrix = mat4.create();

// this is gonna hold the location of the "uniform matrix"
// which will multiply the postition vector 
// that code is in index.html under the vertex shader
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
        vec2.fromValues( 0, 0),
        vec2.fromValues( 0, 1),
        vec2.fromValues( 1, 0)
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
  /*
  let matrix = mat4(
      [1, 0, 0, x],
      [0, 1, 0, y],
      [0, 0, 1, z],
      [0, 0, 0, 1]
  );
  */
  // multiply the transform matrix by the matrix we just made
  //transformMatrix = mult(transformMatrix, matrix);
  let d = vec3.fromValues(x,y,z);
  mat4.translate(transformMatrix, transformMatrix, d);
  //transformMatrix = translate(transformMatrix, d);
}

// rotates around the z axis
// https://en.wikipedia.org/wiki/Rotation_matrix#Basic_rotations
function glRotatef(theta){
  /*
  let matrix = mat4(
      [Math.cos(theta), -Math.sin(theta), 0, 0],
      [Math.sin(theta),  Math.cos(theta), 0, 0],
      [              0,                0, 1, 0],
      [              0,                0, 0, 1]
  );
  // multiply the transform matrix by the matrix we just made
  transformMatrix = mult(transformMatrix, matrix);
  */
  mat4.rotateZ(transformMatrix, transformMatrix, theta)
}

// scales matrix by x, y, z
// we went over this one in class
function glScalef(x, y, z){
  /*
  let matrix = mat4(
      [x, 0, 0, 0],
      [0, y, 0, 0],
      [0, 0, z, 0],
      [0, 0, 0, 1]
  );
  // multiply the transform matrix by the matrix we just made
  transformMatrix = mult(transformMatrix, matrix);
  */
  let d = vec3.fromValues(x,y,z);
  mat4.scale(transformMatrix, transformMatrix, d);
}

// adds transformMatrix to the stack
function glPushMatrix(){
  transformStack.push(transformMatrix);
}

// sets transformMatrix to the stop of the stack
// and pops the top off
function glPopMatrix(){
  transformMatrix = transformStack.pop();
}

// draws a right triangle
function RTRI(){
    // makes it so it will get transformed by transformMatrix
    gl.uniformMatrix4fv(matrixLocation, false, transformMatrix);
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}

// draws a square
function BOX(){
  RTRI();
  glPushMatrix();
  glTranslatef(1.0, 1.0, 0.0);
  glRotatef(Math.PI);
  RTRI();
  glPopMatrix();
}

// draws a rectangle
function RECT(){
  glPushMatrix();
  glScalef(0.5,1.0,1.0);
  BOX();
  glPopMatrix();
}

function render(program)
{
  gl.clear( gl.COLOR_BUFFER_BIT );
  //glScalef(0.5,0.5,0.0);
  glTranslatef(-0.5,-0.5,0.0);
  RECT();
}


// Sources:
// https://github.com/greggman/webgl-fundamentals/blob/master/webgl/webgl-2d-geometry-matrix-transform-with-projection.html
