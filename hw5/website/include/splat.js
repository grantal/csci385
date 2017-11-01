/* global JSM */
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
  const result = JSM.Project(vertex, cameraMove.eye, cameraMove.center, cameraMove.up, cameraMove.fieldOfView, 1, cameraMove.nearClippingPlane, cameraMove.farClippingPlane, [0,0,100,100]);
  return result;
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

function distance(a, b) {
  /*
    Computes the 2D distance from a to b
  */
  const X = a.x - b.x;
  const Y = a.y - b.y;
  return Math.sqrt((X * X) + (Y * Y));
}

function distanceComparatorGenerator(Origin) {
  /*
    returns a function that will compare two arguments
    and will say that the lower argument is the one closer to Origin
  */
  function distanceComparator(a, b) {
    const adist = distance(Origin, a);
    const bdist = distance(Origin, b);
    if (adist < bdist) {
      return -1;
    }
    if (bdist < adist) {
      return 1;
    }
    return 0;
  }
  return distanceComparator;
}

function sortUnique(arr, compareFunction) {
  /*
    sorts list and removes any duplicates. I stole this function from here:
    https://stackoverflow.com/questions/4833651/javascript-array-sort-and-unique
  */
  if (arr.length === 0) return arr;

  arr.sort(compareFunction);
  const ret = [arr[0]];
  for (let i = 1; i < arr.length; i += 1) { // start loop at 1 as element 0 can never be a duplicate
    if (compareFunction(arr[i - 1], arr[i]) !== 0) {
      ret.push(arr[i]);
    }
  }
  return ret;
}

function midpoint(a, b) {
  /*
  returns the 2D midpoint of a and b
  */
  return new JSM.Coord2D((a.x + b.x) / 2, (a.y + b.y) / 2);
}

function findRay(cameraMove, m) {
  /*
    takes a point (m) in 2D and the camera information and returns the 3D unit vector that points
    from the camera in the direction of m on the near clipping plane
  */
  let M = new JSM.Coord(m.x, m.y, 1);
  M = JSM.Unproject(M, cameraMove.eye, cameraMove.center, cameraMove.up, cameraMove.fieldOfView, 1, cameraMove.nearClippingPlane, cameraMove.farClippingPlane, [0,0,100,100]);
  const dhat = JSM.CoordSub(M, cameraMove.eye);
  dhat.Normalize();
  return dhat;
}

function rayHitFace(R, passedd, Q1, Q2, Q3) {
  /*
    check to see if a ray coming from R in the direction of unit vector d intersects the face
    defined by the points Q1, Q2, Q3
    returns an array of length 2 with the first element being a bool of whether or not it hit
    and the second element being how how long the distance along the ray in between R and the plane
    of Q1, Q2, Q3
  */
  // need to make a new copy of d so this function doesn't have side effects on the real d
  const d = new JSM.Coord(passedd.x, passedd.y, passedd.z);

  const v2 = JSM.CoordSub(Q2, Q1);
  const v3 = JSM.CoordSub(Q3, Q1);
  const n = JSM.VectorCross(v2, v3);
  const o = new JSM.Coord(n.x, n.y, n.z);
  // n.MultiplyScalar(1 / (v2.Length() * v3.Length()));
  n.Normalize();
  const delta = JSM.VectorDot(JSM.CoordSub(R, Q1), n);
  const nhat = new JSM.Coord(n.x, n.y, n.z);
  nhat.MultiplyScalar(Math.sign(delta) / nhat.Length());
  const negd = new JSM.Coord(-1 * d.x, -1 * d.y, -1 * d.z);
  const ro = JSM.VectorDot(negd, nhat);
  if (ro < 0) {
    return [false, null];
  }
  const theta = Math.abs(delta) / ro;
  d.MultiplyScalar(theta);
  const P = JSM.CoordAdd(R, d);
  const w = JSM.CoordSub(P, Q1);
  const o2 = JSM.VectorCross(v2, w);
  const o3 = JSM.VectorCross(w, v3);
  // if o2 or o3 are pointing opposite o
  if (JSM.VectorDot(o, o2) < 0 || JSM.VectorDot(o, o3) < 0) {
    return [false, theta, P];
  }
  const alpha2 = o2.Length() / o.Length();
  const alpha3 = o3.Length() / o.Length();
  const alpha1 = (1 - alpha2) - alpha3;
  return [(alpha1 >= 0) && (alpha2 >= 0) && (alpha3 >= 0), theta, P, alpha1, alpha2, alpha3];
}


function rayHitFaceNo(R, d, faceNo, faces, vertices) {
  /*
    wrapper function for rayHitFace that takes R and d (as usually) and gets Q1, Q2, Q3 based on
    the given face number and the faces list and the vertices list
  */
  const Q1 = vertices[faces[faceNo][0] - 1];
  const Q2 = vertices[faces[faceNo][1] - 1];
  const Q3 = vertices[faces[faceNo][2] - 1];
  return rayHitFace(R, d, Q1, Q2, Q3);
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
        let psfile = header;
        // load in vertices and faces from obj file
        const vertices = [];
        const vertices3d = [];
        const faces = [];
        const lines = e.target.result.split('\n');
        // mapping from one endpoint on a line segment to all of the intersections on that segment
        const segments = new Map();
        for (let i = 0; i < lines.length; i += 1) {
          // split line by whitespace
          const line = lines[i].split(/\s+/g);
          // if it is a vertex, add its 2d and 3d coords to each list
          if (line[0] === 'v') {
            const vertex = new JSM.Coord(Number(line[1]), Number(line[2]), Number(line[3]));
            vertices3d.push(vertex);
            vertices.push(vertexSplat(vertex, cameraMove));
          }
          // if it's a face
          if (line[0] === 'f') {
            const face = [Number(line[1]), Number(line[2]), Number(line[3])];
            // this will loop through each pair of vertices on the face and draw a line
            for (let j = 0; j < 3; j += 1) {
              const v = vertices[face[j] - 1];
              const u = vertices[face[((j + 1) % 3)] - 1];
              // so it the key is 31, thats the fourth face, second edge
              segments.set((faces.length * 10) + j, [v, [u]]);
              // loops through every other pair of vertices of all previous faces to find
              // intersections
              for (let k = 0; k < faces.length; k += 1) {
                for (let h = 0; h < 3; h += 1) {
                  const v2 = vertices[faces[k][h] - 1];
                  const u2 = vertices[faces[k][((h + 1) % 3)] - 1];

                  // make sure these edges are not the same
                  if (!((v.IsEqual(v2) && u.IsEqual(u2)) || (v.IsEqual(u2) && u.IsEqual(v2)))) {
                    const result = intersect(v, u, v2, u2);
                    if (result) {
                      // add this intersection to the dict entry for each line segment it's on
                      segments.get((faces.length * 10) + j)[1].push(result);
                      segments.get((k * 10) + h)[1].push(result);
                    }
                  }
                }
              }
            }
            faces.push(face);
          }
        }


        // here we add all of the midpoints
        for (const tuple of segments) {
          // first, we order the instersections on the line by their distance from v
          const v = tuple[1][0];
          let intersections = tuple[1][1];
          const comp = distanceComparatorGenerator(v);
          intersections = sortUnique(intersections, comp);

          // So, the numbersing system for the keys is 10*FaceNumber + Edgenumber, so we get the
          // Face number back by integer dividing the key by 10
          const faceno = Math.floor(tuple[0] / 10);

          // add each midpoint of each intersection on the segment
          for (let i = 0; i < intersections.length; i += 1) {
            let a = 0;
            const b = intersections[i];
            if (i === 0) {
              a = v;
            } else {
              a = intersections[i - 1];
            }
            const m = midpoint(a, b);
            const dhat = findRay(cameraMove, m);
            // find how far away the current face is
            const fdist = rayHitFaceNo(cameraMove.eye, dhat, faceno, faces, vertices3d)[1];
            let noObstruction = true;
            for (let j = 0; j < faces.length; j += 1) {
              // if this is is not the face that this midpoint lives on
              if (j !== faceno) {
                const result = rayHitFaceNo(cameraMove.eye, dhat, j, faces, vertices3d);
                if (result[0] && (result[1] < fdist)) {
                  // record that there was an obsctruction
                  noObstruction = false;
                }
              }
            }
            if (noObstruction) {
              // if there is no face closer to the camera than the face this midpoint is on,
              // draw a black line between its endpoints
              psfile += '0.0 setgray\nnewpath\n';
              psfile += `${a.x} ${a.y} moveto\n`;
              psfile += `${b.x} ${b.y} lineto\n`;
              psfile += 'closepath\nstroke\n';
            }
          }
        }

        // add the footer and download the file
        psfile += footer;
        const psfilename = file.name.replace(/\.obj/g, '.ps');
        download(psfilename, psfile);
      };
      r.readAsText(file);
    }
  }
}
