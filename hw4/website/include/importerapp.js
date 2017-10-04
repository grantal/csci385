ImporterApp = function () { this.viewer = null;
  this.fileNames = null;
  this.inGenerate = false;
  this.dialog = null;
};

ImporterApp.prototype.Init = function () {
  if (!JSM.IsWebGLEnabled() || !JSM.IsFileApiEnabled()) {
    while (document.body.lastChild) {
      document.body.removeChild(document.body.lastChild);
    }

    const div = document.createElement('div');
    div.className = 'nosupport';
    div.innerHTML = [
      '<div id="nosupport">',
      this.GetWelcomeText(),
      '<div class="nosupporterror">You need a browser which supports the following technologies: WebGL, WebGLRenderingContext, File, FileReader, FileList, Blob, URL.</div>',
      '</div>',
    ].join('');
    document.body.appendChild(div);

    return;
  }

  const myThis = this;
  const top = document.getElementById('top');
  const importerButtons = new ImporterButtons(top);
  importerButtons.AddLogo('Online 3D Viewer <span class="version">v 0.5</span>', () => { myThis.WelcomeDialog(); });
  importerButtons.AddButton('images/openfile.png', 'Open File', () => { myThis.OpenFile(); });
  importerButtons.AddButton('images/fitinwindow.png', 'Fit In Window', () => { myThis.FitInWindow(); });
  importerButtons.AddButton('images/fixup.png', 'Enable/Disable Fixed Up Vector', () => { myThis.SetFixUp(); });
  importerButtons.AddButton('images/top.png', 'Set Up Vector (Z)', () => { myThis.SetNamedView('z'); });
  importerButtons.AddButton('images/bottom.png', 'Set Up Vector (-Z)', () => { myThis.SetNamedView('-z'); });
  importerButtons.AddButton('images/front.png', 'Set Up Vector (Y)', () => { myThis.SetNamedView('y'); });
  importerButtons.AddButton('images/back.png', 'Set Up Vector (-Y)', () => { myThis.SetNamedView('-y'); });
  importerButtons.AddButton('images/left.png', 'Set Up Vector (X)', () => { myThis.SetNamedView('x'); });
  importerButtons.AddButton('images/right.png', 'Set Up Vector (-X)', () => { myThis.SetNamedView('-x'); });
  importerButtons.AddButton('images/camera.png', 'Export PostScript file', () => { ExportSplat(myThis.viewer.viewer.cameraMove); });

  this.dialog = new FloatingDialog();

  window.addEventListener('resize', this.Resize.bind(this), false);
  this.Resize();

  this.viewer = new ImporterViewer();
  this.viewer.Init('example');

  window.addEventListener('dragover', this.DragOver.bind(this), false);
  window.addEventListener('drop', this.Drop.bind(this), false);

  const fileInput = document.getElementById('file');
  fileInput.addEventListener('change', this.FileSelected.bind(this), false);

  const testMode = this.InitTestMode();
  let hasHashModel = false;
  if (!testMode) {
    window.onhashchange = this.LoadFilesFromHash.bind(this);
    hasHashModel = this.LoadFilesFromHash();
  }
  if (!hasHashModel) {
    this.WelcomeDialog();
  }
};

ImporterApp.prototype.WelcomeDialog = function () {
  const dialogText = [
    '<div class="importerdialog">',
    this.GetWelcomeText(),
    '</div>',
  ].join('');
  this.dialog.Open({
    title: 'Welcome',
    text: dialogText,
    buttons: [
      {
        text: 'ok',
        callback(dialog) {
          dialog.Close();
        },
      },
    ],
  });
};

ImporterApp.prototype.GetWelcomeText = function () {
  const welcomeText = [
    '<div class="welcometitle">Welcome to Online 3D Viewer!</div>',
    '<div class="welcometext">Here you can view your local 3D models online. You have three ways to open a file. Use the open button above to select files, simply drag and drop files to this browser window, or define the url of the files as location hash.</div>',
    '<div class="welcometextformats">Supported formats: 3ds, obj, stl.</div>',
    '<div class="welcometext">Powered by <a target="_blank" href="https://github.com/mrdoob/three.js/">Three.js</a> and <a target="_blank" href="https://github.com/kovacsv/JSModeler">JSModeler</a>.</div>',
    '<div class="welcometext"><a target="_blank" href="https://github.com/kovacsv/Online3DViewer"><img src="images/githublogo.png"/></a></div>',
  ].join('');
  return welcomeText;
};

ImporterApp.prototype.Resize = function () {
  function SetWidth(elem, value) {
    elem.width = value;
    elem.style.width = `${value}px`;
  }

  function SetHeight(elem, value) {
    elem.height = value;
    elem.style.height = `${value}px`;
  }

  const top = document.getElementById('top');
  const left = document.getElementById('left');
  const canvas = document.getElementById('example');
  const height = document.body.clientHeight - top.offsetHeight;

  SetHeight(canvas, 0);
  SetWidth(canvas, 0);

  SetHeight(left, height);

  SetHeight(canvas, height);
  SetWidth(canvas, document.body.clientWidth - left.offsetWidth);

  this.dialog.Resize();
};

ImporterApp.prototype.JsonLoaded = function (progressBar) {
  const jsonData = this.viewer.GetJsonData();
  this.meshVisibility = {};
  let i;
  for (i = 0; i < jsonData.meshes.length; i++) {
    this.meshVisibility[i] = true;
  }

  this.Generate(progressBar);
};

ImporterApp.prototype.GenerateMenu = function () {
  function AddDefaultGroup(menu, name) {
    const group = menu.AddGroup(name, {
      openCloseButton: {
        visible: false,
        open: 'images/opened.png',
        close: 'images/closed.png',
        title: `Show/Hide ${name}`,
      },
    });
    return group;
  }

  function AddInformation(infoGroup, jsonData) {
    const infoTable = new InfoTable(infoGroup);

    const materialCount = jsonData.materials.length;
    let vertexCount = 0;
    let triangleCount = 0;

    let i,
      j,
      mesh,
      triangles;
    for (i = 0; i < jsonData.meshes.length; i++) {
      mesh = jsonData.meshes[i];
      vertexCount += mesh.vertices.length / 3;
      for (j = 0; j < mesh.triangles.length; j++) {
        triangles = mesh.triangles[j];
        triangleCount += triangles.parameters.length / 9;
      }
    }

    infoTable.AddRow('Material count', materialCount);
    infoTable.AddRow('Vertex count', vertexCount);
    infoTable.AddRow('Triangle count', triangleCount);
  }

  function AddMaterial(importerMenu, materialsGroup, material) {
    importerMenu.AddSubItem(materialsGroup, material.name, {
      openCloseButton: {
        visible: false,
        open: 'images/info.png',
        close: 'images/info.png',
        onOpen(content, material) {
          const table = new InfoTable(content);
          table.AddColorRow('Ambient', material.ambient);
          table.AddColorRow('Diffuse', material.diffuse);
          table.AddColorRow('Specular', material.specular);
          table.AddRow('Shininess', material.shininess.toFixed(2));
          table.AddRow('Opacity', material.opacity.toFixed(2));
        },
        title: 'Show/Hide Information',
        userData: material,
      },
    });
  }

  function AddMesh(importerApp, importerMenu, meshesGroup, mesh, meshIndex) {
    importerMenu.AddSubItem(meshesGroup, mesh.name, {
      openCloseButton: {
        visible: false,
        open: 'images/info.png',
        close: 'images/info.png',
        onOpen(content, mesh) {
          const table = new InfoTable(content);

          const min = new JSM.Coord(JSM.Inf, JSM.Inf, JSM.Inf);
          const max = new JSM.Coord(-JSM.Inf, -JSM.Inf, -JSM.Inf);
          let i,
            vertex;
          for (i = 0; i < mesh.vertices.length; i += 3) {
            vertex = new JSM.Coord(mesh.vertices[i], mesh.vertices[i + 1], mesh.vertices[i + 2]);
            min.x = JSM.Minimum(min.x, vertex.x);
            min.y = JSM.Minimum(min.y, vertex.y);
            min.z = JSM.Minimum(min.z, vertex.z);
            max.x = JSM.Maximum(max.x, vertex.x);
            max.y = JSM.Maximum(max.y, vertex.y);
            max.z = JSM.Maximum(max.z, vertex.z);
          }
          table.AddRow('X Size', (max.x - min.x).toFixed(2));
          table.AddRow('Y Size', (max.y - min.y).toFixed(2));
          table.AddRow('Z Size', (max.z - min.z).toFixed(2));

          let triangleCount = 0;
          let triangles;
          for (i = 0; i < mesh.triangles.length; i++) {
            triangles = mesh.triangles[i];
            triangleCount += triangles.parameters.length / 9;
          }

          table.AddRow('Vertex count', mesh.vertices.length / 3);
          table.AddRow('Triangle count', triangleCount);
        },
        title: 'Show/Hide Information',
        userData: mesh,
      },
      userButton: {
        visible: true,
        onCreate(image) {
          image.src = 'images/visible.png';
        },
        onClick(image, meshIndex) {
          const visible = importerApp.ShowHideMesh(meshIndex);
          image.src = visible ? 'images/visible.png' : 'images/hidden.png';
        },
        title: 'Show/Hide Mesh',
        userData: meshIndex,
      },
    });
  }

  const jsonData = this.viewer.GetJsonData();
  const menu = document.getElementById('menu');
  const importerMenu = new ImporterMenu(menu);

  const filesGroup = AddDefaultGroup(importerMenu, 'Files');
  importerMenu.AddSubItem(filesGroup, this.fileNames.main);
  let i;
  for (i = 0; i < this.fileNames.requested.length; i++) {
    importerMenu.AddSubItem(filesGroup, this.fileNames.requested[i]);
  }

  if (this.fileNames.missing.length > 0) {
    const missingFilesGroup = AddDefaultGroup(importerMenu, 'Missing Files');
    for (i = 0; i < this.fileNames.missing.length; i++) {
      importerMenu.AddSubItem(missingFilesGroup, this.fileNames.missing[i]);
    }
  }

  const infoGroup = AddDefaultGroup(importerMenu, 'Information');
  AddInformation(infoGroup, jsonData);

  const materialsGroup = AddDefaultGroup(importerMenu, 'Materials');
  let material;
  for (i = 0; i < jsonData.materials.length; i++) {
    material = jsonData.materials[i];
    AddMaterial(importerMenu, materialsGroup, material);
  }

  const meshesGroup = AddDefaultGroup(importerMenu, 'Meshes');
  let mesh;
  for (i = 0; i < jsonData.meshes.length; i++) {
    mesh = jsonData.meshes[i];
    AddMesh(this, importerMenu, meshesGroup, mesh, i);
  }
};

ImporterApp.prototype.GenerateError = function (errorMessage) {
  this.viewer.RemoveMeshes();
  const menu = document.getElementById('menu');
  while (menu.lastChild) {
    menu.removeChild(menu.lastChild);
  }

  this.dialog.Open({
    title: 'Error',
    text: `<div class="importerdialog">${errorMessage}</div>`,
    buttons: [
      {
        text: 'ok',
        callback(dialog) {
          dialog.Close();
        },
      },
    ],
  });
};

ImporterApp.prototype.Generate = function (progressBar) {
  function ShowMeshes(importerApp, progressBar, merge) {
    importerApp.inGenerate = true;
    const environment = {
      onStart(taskCount) {
        progressBar.Init(taskCount);
      },
      onProgress(currentTask) {
        progressBar.Step(currentTask + 1);
      },
      onFinish() {
        importerApp.GenerateMenu();
        importerApp.inGenerate = false;
      },
    };

    if (merge) {
      const jsonData = importerApp.viewer.GetJsonData();
      importerApp.viewer.SetJsonData(JSM.MergeJsonDataMeshes(jsonData));
    }
    importerApp.viewer.ShowAllMeshes(environment);
  }

  const jsonData = this.viewer.GetJsonData();
  if (jsonData.materials.length === 0 || jsonData.meshes.length === 0) {
    this.GenerateError('Failed to open file. Maybe something is wrong with your file.');
    return;
  }

  const myThis = this;
  if (jsonData.meshes.length > 250) {
    this.dialog.Open({
      title: 'Information',
      text: '<div class="importerdialog">The model contains a large number of meshes. It can cause performance problems. Would you like to merge meshes?</div>',
      buttons: [
        {
          text: 'yes',
          callback(dialog) {
            ShowMeshes(myThis, progressBar, true);
            dialog.Close();
          },
        },
        {
          text: 'no',
          callback(dialog) {
            ShowMeshes(myThis, progressBar, false);
            dialog.Close();
          },
        },
      ],
    });
  } else {
    ShowMeshes(myThis, progressBar, false);
  }
};

ImporterApp.prototype.FitInWindow = function () {
  this.viewer.FitInWindow();
};

ImporterApp.prototype.SetFixUp = function () {
  this.viewer.SetFixUp();
};

ImporterApp.prototype.SetNamedView = function (viewName) {
  this.viewer.SetNamedView(viewName);
};

ImporterApp.prototype.SetView = function (viewType) {
  this.viewer.SetView(viewType);
};

ImporterApp.prototype.ShowHideMesh = function (meshIndex) {
  this.meshVisibility[meshIndex] = !this.meshVisibility[meshIndex];
  if (this.meshVisibility[meshIndex]) {
    this.viewer.ShowMesh(meshIndex);
  } else {
    this.viewer.HideMesh(meshIndex);
  }
  return this.meshVisibility[meshIndex];
};

ImporterApp.prototype.ProcessFiles = function (fileList, isUrl) {
  this.dialog.Close();
  if (this.inGenerate) {
    return;
  }

  const userFiles = fileList;
  if (userFiles.length === 0) {
    return;
  }

  this.fileNames = null;

  const myThis = this;
  let processorFunc = JSM.ConvertFileListToJsonData;
  if (isUrl) {
    processorFunc = JSM.ConvertURLListToJsonData;
  }

  const menu = document.getElementById('menu');
  while (menu.lastChild) {
    menu.removeChild(menu.lastChild);
  }
  if (isUrl) {
    menu.innerHTML = 'Downloading files...';
  } else {
    menu.innerHTML = 'Loading files...';
  }

  processorFunc(userFiles, {
    onError() {
      myThis.GenerateError('No readable file found. You can open 3ds, obj and stl files.');
    },
    onReady(fileNames, jsonData) {
      myThis.fileNames = fileNames;
      myThis.viewer.SetJsonData(jsonData);

      const menu = document.getElementById('menu');
      const progressBar = new ImporterProgressBar(menu);
      myThis.JsonLoaded(progressBar);
    },
  });
};

ImporterApp.prototype.DragOver = function (event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
};

ImporterApp.prototype.Drop = function (event) {
  event.stopPropagation();
  event.preventDefault();
  this.ResetHash();
  this.ProcessFiles(event.dataTransfer.files, false);
};

ImporterApp.prototype.FileSelected = function (event) {
  event.stopPropagation();
  event.preventDefault();
  this.ResetHash();
  this.ProcessFiles(event.target.files, false);
};

ImporterApp.prototype.OpenFile = function () {
  const fileInput = document.getElementById('file');
  fileInput.click();
};

ImporterApp.prototype.ResetHash = function () {
  if (window.location.hash.length > 1) {
    window.location.hash = '';
  }
};


ImporterApp.prototype.LoadFilesFromHash = function () {
  if (window.location.hash.length < 2) {
    return false;
  }

  var hash = window.location.hash;
  var hash = hash.substr(1, hash.length - 1);
  const fileList = hash.split(',');
  this.ProcessFiles(fileList, true);
  return true;
};

ImporterApp.prototype.InitTestMode = function () {
  if (window.location.hash != '#test') {
    return false;
  }

  let currentTestFile = 0;
  const myThis = this;
  JSM.LoadJsonFile('testfiles_for_test/testfiles.json', (jsonContent) => {
    window.addEventListener('keydown', (event) => {
      const keyCode = event.which;
      if (keyCode == 84 && currentTestFile < jsonContent.files.length) {
        event.preventDefault();
        myThis.dialog.Close();
        myThis.ProcessFiles(jsonContent.files[currentTestFile], true);
        currentTestFile++;
      }
    }, false);
  });
  return true;
};

window.onload = function () {
  const importerApp = new ImporterApp();
  importerApp.Init();
};
