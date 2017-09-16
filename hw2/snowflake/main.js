// I used this page:
// https://en.wikipedia.org/wiki/Koch_snowflake
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

// approximately the square root of 3 over 2
const rad3o2 = 0.86602540378;


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // First, initialize the corners of our triangle with three points.

    var vertices = [
        vec2.fromValues( 0.0, 0.0),
        vec2.fromValues( 0.5, rad3o2),
        vec2.fromValues( 1.0, 0.0)
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

// draws a regular triangle
function REG(){
    // makes it so it will get transformed by transformMatrix
    gl.uniformMatrix4fv(matrixLocation, false, transformMatrix);
    gl.uniform4fv(colorLoc, color);
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}


// gives the value for x and y for each of the 8 surrouding boxes on
// each level of the carpet
var carpetxy = [
 [-1,  1], [0,  1], [1,  1],
 [-1,  0],          [1,  0],
 [-1, -1], [0, -1], [1, -1],
];

// recursive function that makes a toothed edge of the snowflake
function snowflake(levels, maxLevels){
  if (levels > maxLevels){
    return 0;
  }
  REG();
  // recurse on the other 4 toothed edges
  glPushMatrix();
  // edges are on third the size
  glScalef((1/3),(1/3),1.0);

  // edge to the left of this edge
  glPushMatrix();
  glTranslatef(-1.9, 0.0, 0.0);
  snowflake(levels+1, maxLevels);
  glPopMatrix();

  // edge on the left side of the triangle
  glPushMatrix();
  glRotatef(Math.PI/3);
  glTranslatef(1.0, 0.0, 0.0);
  snowflake(levels+1, maxLevels);
  glPopMatrix();

  // edge on the right side of the triangle
  glPushMatrix();
  glTranslatef(3.0, 0.0, 0.0);
  glRotatef(-(Math.PI/3));
  glTranslatef(-2.0, 0.0, 0.0);
  snowflake(levels+1, maxLevels);
  glPopMatrix();

  // edge to the right of this edge
  glPushMatrix();
  glTranslatef(3.9, 0.0, 0.0);
  snowflake(levels+1, maxLevels);
  glPopMatrix();
  glPopMatrix();
}

function render(program)
{
  gl.clear( gl.COLOR_BUFFER_BIT );
  // make the snowflake white
  color = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
  // levels of recursion
  let maxLevels = 6;

  // make first level big and centered
  //glScalef(1.5, 1.5, 1.0);
  glTranslatef(-0.5, -(rad3o2 / 3), 0.0);
  REG();

  glScalef((1/3),(1/3),1.0);
  // make the left side of the triangle
  glRotatef(Math.PI/3);
  glTranslatef(1.0, 0.0, 0.0);
  snowflake(1, maxLevels);

  //make the right side of the triangle
  glTranslatef(2.0, 0.0, 0.0);
  glRotatef((-2)*(Math.PI/3));
  glTranslatef(1.0, 0.0, 0.0);
  snowflake(1, maxLevels);

  //make the bottom side of the triangle
  glTranslatef(2.0, 0.0, 0.0);
  glRotatef((-2)*(Math.PI/3));
  glTranslatef(1.0, 0.0, 0.0);
  snowflake(1, maxLevels);

}


