'use strict';

const fileManager = require('./fileManager');
const helpers = require('hydrogen-helpers');
const child_process = require('child_process');
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

  app.main.__addFunction('exec', (str, opt, cb) => child_process.exec(str, opt, (p1, p2, p3) => cb(p1, p2, p3)));

  window.loadView('index');
  window.on('closed', () => window = null);
  app.loadMenu('menu.json', 'menuCommands');
});
