'use strict';

const fileManager = require('./fileManager');
const settingsManager = require('./settingsManager');
const helpers = require('hydrogen-helpers');
global.app = new helpers.ApplicationWrapper(__dirname);
global.organic = require('electron').app;

let window = null;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('quit', () => {
  fileManager.appWillClose();
});

organic.setPath('userData', `${app.getPath('appData')}/Hydrogen IDE`);

app.on('ready', () => {
  window = new helpers.BrowserWindow(app, {
    icon: `${__dirname}/icons/hicolor/512x512@2x/apps/hydrogen-ide.png`
  });

  app.main.__addFunction('getHighlighters', (cb) => settingsManager.getHighlighters((err, hl) => cb(err, hl)));

  window.loadView('index');
  window.on('closed', () => window = null);
  app.loadMenu('menu.json', 'menuCommands');
  settingsManager.checkDirs((err) => {
    if (err) return app.web.createToast(`Could not create settings directories: ${err.message}`);
    settingsManager.checkModules((err) => {
      if (err) return app.web.createToast(`Could not update application modules: ${err.message}`);
    });
  });
});
