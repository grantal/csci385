// So this is a heavily modified version of this file:
// https://github.com/esangel/WebGL/blob/master/Chap2/gasket2.js
// which is an example from Angel's "Interactive Computer Graphics"
// I also used this as a reference for how to transform stuff:
// https://github.com/greggman/webgl-fundamentals/blob/master/webgl/webgl-2d-geometry-matrix-transform-with-projection.html
// I also read parts of Chapter 4 of Angel's book.
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

// similarly, this will hold the color location
var colorLoc;

// this will hold the color
var color = vec4.fromValues(1.0, 0.0, 0.0, 1.0);

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // First, initialize the corners of our triangle with three points.

    var vertices = [
        vec2.fromValues( 0, 0),
        vec2.fromValues( 0, 1),
        vec2.fromValues( 1, 0)
    ];

    triangle(vertices[0], vertices[1], vertices[2]);
    // so there is one trianlge in the points list that will get redrawn
    // over and over again to make our picture

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    // make the background dark blue
    gl.clearColor( 0.0, 0.0, 0.2, 1.0 );

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

    colorLoc = gl.getUniformLocation(program, "vColor");

    render();
};

function triangle( a, b, c )
{
    points.push( a, b, c );
}

// translates matrix by x, y, z
function glTranslatef(x, y, z){
  let d = vec3.fromValues(x,y,z);
  mat4.translate(transformMatrix, transformMatrix, d);
}

// rotates around the z axis
function glRotatef(theta){
  mat4.rotateZ(transformMatrix, transformMatrix, theta)
}

// scales matrix by x, y, z
function glScalef(x, y, z){
  let d = vec3.fromValues(x,y,z);
  mat4.scale(transformMatrix, transformMatrix, d);
}

// adds copy of transformMatrix to the stack
function glPushMatrix(){
  transformStack.push(mat4.clone(transformMatrix));
}

// sets transformMatrix to the top of the stack
// and pops the top off
function glPopMatrix(){
  transformMatrix = transformStack.pop();
}

// draws a right triangle
function RTRI(){
    // makes it so it will get transformed by transformMatrix
    gl.uniformMatrix4fv(matrixLocation, false, transformMatrix);
    gl.uniform4fv(colorLoc, color);
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
  // make the ground
  glPushMatrix();
  glTranslatef(1.0,-1.0,0.0);
  glScalef(2.0,1.0,1.0);
  glRotatef(Math.PI/2);
  color = vec4.fromValues(0.1, 0.1, 0.1, 1.0);
  RECT();
  glPopMatrix();

  // make the building
  glPushMatrix();
  glScalef(1.5,1.5,1.0);
  glTranslatef(-0.25,-0.5,0.0);
  color = vec4.fromValues(0.3, 0.3, 0.3, 1.0);
  RECT();
  glPopMatrix();

  // make the windows
  glPushMatrix();
  color = vec4.fromValues(0.8, 0.8, 0.1, 1.0);
  glScalef(0.2,0.2,1.0);
  glTranslatef(-2.25,2.5,0.0);
  // this makes each row of windows 
  for (let j = 0; j < 5; j++){
    glPushMatrix();
    // this makes each individual window
    for (let i = 0; i < 4; i++){
      glTranslatef(0.8,0.0,0.0);
      RECT();
    }
    glPopMatrix();
    glTranslatef(0.0,-1.5,0.0);
  }

}


