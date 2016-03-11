'use strict';

const fileManager = require('./fileManager');
const fs = require('fs');
let project = null;

/*
 * Add your own actions like:
 * exports.YOUR_MENU_ACTION = () => console.log('i did a thing.');
 */

exports.learnNothing = () => app.web.alert('You just learned...nothing!');
exports.toggleDevTools = () => app.currentWindow.toggleDevTools();
exports.saveFile = () => {
  app.web.getFileContents((cont, fn) => {
    if (!cont || !fn) return app.web.createToast('Could not save file: the current tab isn\'t a file tab.');
    fs.writeFile(fn, cont, (err) => {
      if (err) return console.error(err);
    });
  });
}
exports.newProject = () => {
  fileManager.newProject((err, proj) => {
    if (err) return console.error(err);
    project = proj;
    app.web.removeSidebars();
    app.web.sendProject(proj);
  });
}
exports.openProject = () => {
  fileManager.openProject((err, proj) => {
    if (err) return console.error(err);
    project = proj;
    app.web.removeSidebars();
    app.web.sendProject(proj);
  });
}
exports.reloadProject = () => project && app.web.reloadProject();
exports.removeDSStores = () => {
  if (project) {
    fileManager.cleanDS_Stores(project.path, (err) => {
      if (err) return console.error(err);
      app.web.createToast('Done cleaning.');
      app.web.reloadProject();
    });
  }
}
exports.closeTab = () => app.web.closeCurrent();
