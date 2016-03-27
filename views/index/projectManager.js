'use strict';

const fs = require('fs');
const child_process = require('child_process');

window.project = null;

window.loadProjectFiles = (bar, path) => {
  fs.readdir(path, (err, files) => {
    if (err) return Toast.makeText(`Could not read project folder: ${err.message}`, Toast.LENGTH_SHORT, false).show();
    bar.removeChildren();
    for (let i in files) {
      const file = files[i];
      (function(file) {
        fs.stat(`${path}/${file}`, (err, stats) => {
          if (err) return Toast.makeText(`Could not read project folder: ${err.message}`, Toast.LENGTH_SHORT, false).show();
          if (stats.isDirectory()) {
            bar.appendChild(new SidebarFolderItem(file, path));
          } else {
            bar.appendChild(new SidebarFileItem(file, path));
          }
        });
      })(file);
    }
  });
}

window.loadProject = proj => {
  window.project = proj;
  const bar = new Sidebar('left', proj.projectName);
  defaultSidebarManager.left = bar;
  const addFile = new SidebarToolItem('+ Add File');
  const addFolder = new SidebarToolItem('+ Add Folder');
  const runProject = new SidebarToolItem('\u25B6 Run');
  const installPkg = new SidebarToolItem('+ Install Pkg');
  const updatePkgs = new SidebarToolItem('\u2B06 Update Pkgs');
  addFile.on('click', () => {
    const dialog = new WebDialog({
      type: 2,
      text: 'File name + relative path'
    });
    dialog.on('inputSubmitted', input => {
      fs.writeFile(`${proj.path}/${input}`, '', err => {
        if (err) return Toast.makeText(`Could not creat file: ${err.message}`, Toast.LENGTH_SHORT, false).show();
        window.loadProjectFiles(bar, proj.path);
      });
    });
    defaultWebDialogManager.addDialog(dialog);
    defaultWebDialogManager.checkQueue();
  });
  addFolder.on('click', () => {
    const dialog = new WebDialog({
      type: 2,
      text: 'Folder name + relative path'
    });
    dialog.on('inputSubmitted', input => {
      fs.mkdir(`${proj.path}/${input}`, err => {
        if (err) return Toast.makeText(`Could not create folder: ${err.message}`, Toast.LENGTH_SHORT, false).show();
        window.loadProjectFiles(bar, proj.path);
      });
    });
    defaultWebDialogManager.addDialog(dialog);
    defaultWebDialogManager.checkQueue();
  });
  runProject.on('click', () => {
    Toast.makeText('Launching Electron...', Toast.LENGTH_LONG, false).show();
    child_process.exec(`${proj.path}/node_modules/.bin/electron ${proj.path}/index.js`, {
      cwd: proj.path
    }, (err, stderr, stdout) => {
      let txt = 'Application exited normally with code 0';
      if (err) txt = `Application exited with error: ${err.message}`;
      Toast.makeText(txt, Toast.LENGTH_LONG, false).show();
    });
  });
  installPkg.on('click', () => {
    const dialog = new WebDialog({
      type: 2,
      text: 'npm package name (can also be a path)'
    });
    dialog.on('inputSubmitted', input => {
      Toast.makeText('Running npm...', Toast.LENGTH_SHORT, false).show();
      child_process.exec(`npm install --save ${input}`, {
        cwd: proj.path
      }, (err, stdout, stderr) => {
        if (err) return Toast.makeText(`Could not install package: ${err.message}`, Toast.LENGTH_SHORT, false).show();
        window.loadProjectFiles(bar, proj.path);
        Toast.makeText('Finished package install.', Toast.LENGTH_SHORT, false).show();
      });
    });
    defaultWebDialogManager.addDialog(dialog);
    defaultWebDialogManager.checkQueue();
  });
  updatePkgs.on('click', () => {
    Toast.makeText('Running npm...', Toast.LENGTH_SHORT, false).show();
    child_process.exec('npm update', {
      cwd: proj.path
    }, (err, stdout, stderr) => {
      if (err) return Toast.makeText(`Could not update packages: ${err.message}`, Toast.LENGTH_SHORT, false).show();
      Toast.makeText('Finished updating packages.', Toast.LENGTH_SHORT, false).show();
    });
  });
  bar.appendTool(addFile);
  bar.appendTool(addFolder);
  bar.appendTool(runProject);
  bar.appendTool(installPkg);
  bar.appendTool(updatePkgs);
  window.loadProjectFiles(bar, proj.path);
}
