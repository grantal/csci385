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
        console.log(e.target.result);
        console.log(cameraMove);
      };
      r.readAsText(file);
    } else {
      alert('Needs to be an obj file!');
    }
  }
}
