function download(filename, text) {
  /*
  This makes the browser download a text file with filename 'filename' and contents 'text'
  I stole this function from here:
  https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
  */
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function vertexSplat(vertex, cameraMove) {
  /*
  Takes a vertex's location in 3-space and some camera information
  returns vertex's location in 2-space
  used this:
  http://people.wku.edu/qi.li/teaching/446/cg4_geometry.pdf
  */
  return JSM.Project(vertex, cameraMove.eye, cameraMove.center, cameraMove.up, cameraMove.fieldOfView, 1, cameraMove.nearClippingPlane, cameraMove.farClippingPlane, [0,0,100,100]);
}

function intersect(v1, u1, v2, u2) {
  /*
    Sees if the line segment from v1 to u1 intersects the line segment from v2 to u2. If not,
    returns false. If they do intersect, it returns the intersection
    used this as reference:
    https://www.topcoder.com/community/data-science/data-science-tutorials/geometry-concepts-line-intersection-and-its-applications/
  */
  // checks that they could intersect
  if (Math.max(v1.x, u1.x) < Math.min(v2.x, u2.x)) {
    return false;
  }
  if (Math.max(v2.x, u2.x) < Math.min(v1.x, u1.x)) {
    return false;
  }
  if (Math.max(v1.y, u1.y) < Math.min(v2.y, u2.y)) {
    return false;
  }
  if (Math.max(v2.y, u2.y) < Math.min(v1.y, u1.y)) {
    return false;
  }

  const a1 = u1.y - v1.y;
  const a2 = u2.y - v2.y;
  const b1 = v1.x - u1.x;
  const b2 = v2.x - u2.x;
  const c1 = (a1 * v1.x) + (b1 * v1.y);
  const c2 = (a2 * v2.x) + (b2 * v2.y);

  const det = (a1 * b2) - (a2 * b1);
  if (det === 0) {
    return false;
  }
  const x = ((b2 * c1) - (b1 * c2)) / det;
  const y = ((a1 * c2) - (a2 * c1)) / det;

  // check that the intersection is on both lines
  if (x > Math.max(v1.x, u1.x) || x > Math.max(v2.x, u2.x)) {
    return false;
  }
  if (x < Math.min(v1.x, u1.x) || x < Math.min(v2.x, u2.x)) {
    return false;
  }
  if (y > Math.max(v1.y, u1.y) || y > Math.max(v2.y, u2.y)) {
    return false;
  }
  if (y < Math.min(v1.y, u1.y) || y < Math.min(v2.y, u2.y)) {
    return false;
  }
  return new JSM.Coord2D(x, y);
}


// beginning and end of postscript file
const header = '%!PS-Adobe-2.0\n/poly { 4 dict\nbegin\n/N exch def\n/A 360 N div def\n1 0 moveto\nN {\nA cos A sin lineto\n/A A 360 N div add def\n} repeat\nclosepath\nend\n} def\ngsave\n0 72 11 8.5 sub mul translate\n1 5 div setlinewidth\n5.0 5.0 scale\n';
const footer = 'grestore\nshowpage';

function ExportSplat(cameraMove) {
  /*
     function to make the postscript file
     the function name begins with "Export" because of my eslint settings
  */
  // read in the file that was loaded
  const file = document.getElementById('file').files[0];
  if (file) {
    // make sure filename ends in .obj
    const regexobj = /\w*\.obj/;
    if (regexobj.test(file.name)) {
      const r = new FileReader();
      r.onload = function fileLoaded(e) {
        // console.log(e.target.result);
        console.log(cameraMove.eye);
        console.log(cameraMove.center);
        console.log(cameraMove.up);

        let psfile = header;
        // load in vertices and faces from obj file
        const vertices = [];
        const faces = [];
        const lines = e.target.result.split('\n');
        for (let i = 0; i < lines.length; i += 1) {
          // split line by whitespace
          const line = lines[i].split(/\s+/g);
          // if it is a vertex, add its 2d coords to the list
          if (line[0] === 'v') {
            const vertex = new JSM.Coord(Number(line[1]), Number(line[2]), Number(line[3]));
            vertices.push(vertexSplat(vertex, cameraMove));
          }
          // if it's a face
          if (line[0] === 'f') {
            const face = [Number(line[1]), Number(line[2]), Number(line[3])];
            // this will loop through each pair of vertices on the face and draw a line
            console.log(face);
            for (let j = 0; j < 3; j += 1) {
              const v = vertices[face[j] - 1];
              const u = vertices[face[((j + 1) % 3)] - 1];
              psfile += '0.0 setgray\nnewpath\n';
              psfile += `${v.x} ${v.y} moveto\n`;
              psfile += `${u.x} ${u.y} lineto\n`;
              psfile += 'closepath\nstroke\n';
              // loops through every other pair of vertices of all previous faces to find
              // intersections
              for (let k = 0; k < faces.length; k += 1) {
                for (let h = 0; h < 3; h += 1) {
                  const v2 = vertices[faces[k][h] - 1];
                  const u2 = vertices[faces[k][((h + 1) % 3)] - 1];
                  // makes a circle at the intersection
                  const result = intersect(v, u, v2, u2);
                  if (result) {
                    psfile += `${result.x} ${result.y} 0.7 0 360 arc closepath\n0.0 setgray fill\n`;
                  }
                }
              }
            }
            faces.push(face);
          }
        }

        console.log(vertices);


        psfile += footer;
        const psfilename = file.name.replace(/\.obj/g, '.ps');
        download(psfilename, psfile);
      };
      r.readAsText(file);
    }
  }
}
