'use strict';

const fileManager = require('./fileManager');
const helpers = require('hydrogen-helpers');
global.app = new helpers.ApplicationWrapper(__dirname);

let window = null;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('quit', () => {
  fileManager.appWillClose();
});

app.on('ready', () => {
  window = new helpers.BrowserWindow(app, {
    icon: `${__dirname}/icons/hicolor/512x512@2x/apps/hydrogen-ide.png`
  });

  window.loadView('index');
  window.on('closed', () => window = null);
  app.loadMenu('menu.json', 'menuCommands');
});
