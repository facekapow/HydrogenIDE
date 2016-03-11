// Generated by CoffeeScript 1.10.0
(function() {
  var BrowserWindow, Menu, MenuItem, Separator, app, appName, fileManager, path, ref, ref1, webInterface;

  ref = require('electron'), app = ref.app, BrowserWindow = ref.BrowserWindow, Menu = ref.Menu;

  ref1 = require('./menus'), Separator = ref1.Separator, MenuItem = ref1.MenuItem;

  webInterface = require('./interface');

  fileManager = require('./fileManager');

  path = require('path');

  appName = 'Hydrogen IDE';

  app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
      return app.quit();
    }
  });

  app.on('ready', function() {
    var appMenu, base, darwin, editMenu, fileMenu, helpMenu, menu, onCloseTab, onPreferences, project, viewMenu, window, windowMenu;
    window = new BrowserWindow({
      icon: __dirname + '/hydrogen-icon.png'
    });
    webInterface = webInterface(window);
    fileManager = fileManager(window);
    window.loadURL("file://" + __dirname + "/../web/index.html");
    window.on('closed', function() {
      return window = null;
    });
    darwin = process.platform === 'darwin';
    onPreferences = function() {
      return void 0;
    };
    onCloseTab = function() {
      return webInterface.closeCurrent();
    };
    base = [];
    project = null;
    fileMenu = new MenuItem('File', null, null, true);
    fileMenu.appendChild(new MenuItem('Save File', 'CmdOrCtrl+S', function() {
      return webInterface.getFileContents(function(err, cont, fn) {
        if (err != null) {
          return console.error(err);
        }
        if (fn == null) {
          return webInterface.createToast('Could not save file: the current tab isn\'t a file tab.');
        }
        return fileManager.saveFile(fn, cont, function(err) {
          if (err != null) {
            return console.error(err);
          }
        });
      });
    }));
    fileMenu.appendChild(new MenuItem('New Project', 'CmdOrCtrl+Shift+N', function() {
      return fileManager.newProject(function(err, proj) {
        if (err != null) {
          return console.error(err);
        }
        project = proj;
        webInterface.removeSidebars();
        return webInterface.sendProject(proj);
      });
    }));
    fileMenu.appendChild(new MenuItem('Open Project', 'CmdOrCtrl+Shift+O', function() {
      return fileManager.openProject(function(err, proj) {
        if (err != null) {
          return console.error(err);
        }
        project = proj;
        webInterface.removeSidebars();
        return webInterface.sendProject(proj);
      });
    }));
    fileMenu.appendChild(new Separator);
    fileMenu.appendChild(new MenuItem('Reload Files', 'CmdOrCtrl+R', function() {
      if (project != null) {
        return webInterface.reloadProject();
      }
    }));
    fileMenu.appendChild(new MenuItem('Remove all .DS_Stores', null, function() {
      if (project != null) {
        return fileManager.cleanDS_Stores(project.path, function(err) {
          if (err != null) {
            return console.error(err);
          }
          webInterface.createToast('Done cleaning.');
          return webInterface.reloadProject();
        });
      }
    }));
    editMenu = new MenuItem('Edit', null, null, true);
    editMenu.appendChild(new MenuItem('Undo', 'CmdOrCtrl+Z', 'undo'));
    editMenu.appendChild(new MenuItem('Redo', (darwin === true ? 'Command+Y' : 'Shift+CmdOrCtrl+Z'), 'redo'));
    editMenu.appendChild(new Separator);
    editMenu.appendChild(new MenuItem('Cut', 'CmdOrCtrl+X', 'cut'));
    editMenu.appendChild(new MenuItem('Copy', 'CmdOrCtrl+C', 'copy'));
    editMenu.appendChild(new MenuItem('Paste', 'CmdOrCtrl+V', function(item, window) {
      return webInterface.wantsPaste();
    }));
    editMenu.appendChild(new MenuItem('Select All', 'CmdOrCtrl+A', 'selectall'));
    viewMenu = new MenuItem('View', null, null, true);
    viewMenu.appendChild(new MenuItem('Reload', function(item, window) {
      return window != null ? window.reload() : void 0;
    }));
    viewMenu.appendChild(new MenuItem('Toggle Full Screen', (darwin === true ? 'Ctrl+Command+F' : 'F11'), function(item, window) {
      return window != null ? window.setFullScreen(!(window != null ? window.isFullScreen() : void 0)) : void 0;
    }));
    viewMenu.appendChild(new MenuItem('Toggle Developer Tools', (darwin === true ? 'Alt+Command+I' : 'CmdOrCtrl+Shift+I'), function(item, window) {
      return window != null ? window.toggleDevTools() : void 0;
    }));
    windowMenu = new MenuItem('Window', null, 'window', true);
    windowMenu.appendChild(new MenuItem('Minimize', 'CmdOrCtrl+M', 'minimize'));
    windowMenu.appendChild(new MenuItem('Close Current Tab', 'CmdOrCtrl+W', onCloseTab));
    helpMenu = new MenuItem('Help', null, 'help', true);
    helpMenu.appendChild(new MenuItem('Learn Nothing', null, function() {
      return webInterface.createToast('You just learned a whole lot of nothing!');
    }));
    appMenu = new MenuItem(appName, null, null, true);
    appMenu.appendChild(new MenuItem("About " + appName, null, 'about'));
    appMenu.appendChild(new Separator);
    appMenu.appendChild(new MenuItem('Preferences', 'Command+,', function() {
      return void 0;
    }));
    appMenu.appendChild(new Separator);
    appMenu.appendChild(new MenuItem('Services', null, 'services', true));
    appMenu.appendChild(new Separator);
    appMenu.appendChild(new MenuItem("Hide " + appName, 'Command+H', 'hide'));
    appMenu.appendChild(new MenuItem('Hide Others', 'Command+Shift+H', 'hideothers'));
    appMenu.appendChild(new MenuItem('Show All', null, 'unhide'));
    appMenu.appendChild(new Separator);
    appMenu.appendChild(new MenuItem('Quit', 'Command+Q', function() {
      return app.quit();
    }));
    if (darwin === true) {
      windowMenu.appendChild(new Separator);
      windowMenu.appendChild(new MenuItem('Bring All to Front', null, 'front'));
    } else {
      editMenu.appendChild(new MenuItem('Settings', 'Command+,', onPreferences));
    }
    if (darwin === true) {
      base.push(appMenu);
    }
    base.push(fileMenu, editMenu, viewMenu, windowMenu, helpMenu);
    menu = Menu.buildFromTemplate(base);
    return Menu.setApplicationMenu(menu);
  });

}).call(this);

//# sourceMappingURL=index.js.map
