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

const psfile = '%!PS-Adobe-2.0\n/poly { 4 dict\nbegin\n/N exch def\n/A 360 N div def\n1 0 moveto\nN {\nA cos A sin lineto\n/A A 360 N div add def\n} repeat\nclosepath\nend\n} def\ngsave\n72 8.5 2 div mul dup translate\n0 72 11 8.5 sub mul translate\n1 720 div setlinewidth\n1000.0 1000.0 scale\n0.0 setgray\nnewpath\n-0.006944212595521401 -0.08292411231790225 moveto\n-0.08231116827571414 -0.010324735513460685 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n-0.008581373632050669 -0.05053955422820488 moveto\n-0.006944212595521405 -0.08292411231790224 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n-0.014395352010563365 0.06446631039360652 moveto\n-0.008581373632050669 -0.05053955422820488 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n-0.06733637376426249 0.006165982044616675 moveto\n-0.08231116827571414 -0.010324735513460685 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n-0.01439535201056337 0.06446631039360651 moveto\n-0.06733637376426249 0.006165982044616675 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n0.009268220234022143 -0.06776652708413398 moveto\n-0.006944212595521405 -0.08292411231790224 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n0.023867301172606006 -0.05411732242818498 moveto\n0.009268220234022143 -0.06776652708413398 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n0.0665644468943822 -0.014198228710362776 moveto\n0.023867301172606006 -0.05411732242818498 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n0.021135095995799408 0.02994317231294441 moveto\n0.0665644468943822 -0.014198228710362776 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n-0.01439535201056337 0.06446631039360651 moveto\n0.021135095995799408 0.02994317231294441 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n-0.0673363737642625 0.006165982044616672 moveto\n-0.08746336979577342 0.02559091781109733 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n0.02479809734779162 -0.08275469843986036 moveto\n0.009268220234022143 -0.06776652708413398 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n0.023867301172605986 -0.054117322428185025 moveto\n0.024798097347791623 -0.08275469843986036 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n0.01735893537187521 0.14612256211999075 moveto\n0.021135095995799415 0.02994317231294441 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n0.017358935371875203 0.14612256211999075 moveto\n-0.08746336979577342 0.02559091781109733 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n0.14249377130224408 0.02369325896907455 moveto\n0.024798097347791623 -0.08275469843986036 lineto\nclosepath\nstroke\n0.0 setgray\nnewpath\n0.017358935371875217 0.14612256211999075 moveto\n0.14249377130224408 0.023693258969074555 lineto\nclosepath\nstroke\ngrestore\nshowpage';

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
        //console.log(e.target.result);
        console.log(cameraMove.eye);
        console.log(cameraMove.center);
        console.log(cameraMove.up);

        const psfilename = file.name.replace(/\.obj/g, '.ps');
        download(psfilename, psfile);
      };
      r.readAsText(file);
    }
  }
}
