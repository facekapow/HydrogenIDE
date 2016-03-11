'use strict';
const hydrogen = require('hydrogen-helpers');
global.app = new hydrogen.ApplicationWrapper(__dirname);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('ready', () => {
  let window = new hydrogen.BrowserWindow(app);

  window.loadView('index');
  window.on('closed', () => window = null);
  app.loadMenu('menu.json', 'menuCommands');
});
