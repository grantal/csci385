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
  */
  const LmO = JSM.CoordSub(cameraMove.eye, cameraMove.center);
  const LmQ = JSM.CoordSub(cameraMove.eye, vertex);
  const Delta = JSM.VectorDot(LmO, cameraMove.up);
  const delta = JSM.VectorDot(LmQ, cameraMove.up);
  const lambda = Delta / delta;

  const QmL = JSM.CoordSub(vertex, cameraMove.eye);
  const lQmL = QmL.MultiplyScalar(lambda);
  const Qprime = JSM.CoordAdd(lQmL, cameraMove.eye);
  return new JSM.Coord2D(Qprime.x, Qprime.y);
}


// beginning and end of postscript file
const header = '%!PS-Adobe-2.0\n/poly { 4 dict\nbegin\n/N exch def\n/A 360 N div def\n1 0 moveto\nN {\nA cos A sin lineto\n/A A 360 N div add def\n} repeat\nclosepath\nend\n} def\ngsave\n72 8.5 2 div mul dup translate\n0 72 11 8.5 sub mul translate\n1 720 div setlinewidth\n1000.0 1000.0 scale\n';
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

        // load in vertices and faces from oj file
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
            faces.push([Number(line[1]), Number(line[2]), Number(line[3])]);
          }
        }

        console.log(vertices);

        let psfile = header;
        psfile += `0.0 setgray
newpath
-0.006944212595521401 -0.08292411231790225 moveto
-0.08231116827571414 -0.010324735513460685 lineto
closepath
stroke\n`;

        psfile += footer;
        const psfilename = file.name.replace(/\.obj/g, '.ps');
        //download(psfilename, psfile);
      };
      r.readAsText(file);
    }
  }
}
