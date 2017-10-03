function ExportClick(eye, plane, right, up, away) {
  /*
     function to make the postscript file
     the function name begins with "Export" because of my eslint settings
  */
  var file = document.getElementById('file').files[0];
  console.log(file);
  console.log(eye);
  console.log(plane);
  console.log(right);
  console.log(up);
  console.log(away);
}
