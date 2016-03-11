'use strict';

const fs = require('fs');
const electron = require('electron');
const path = require('path');
const ncp = require('ncp');
const __ = require('mini-utils');
const child_process = require('child_process');

const langs = ['JavaScript', 'CoffeeScript'];
const types = [
  [
    'Basic',
    'Simple application, with a single view'
  ],
  [
    'Tabbed',
    'Application with tabs, like this IDE'
  ]
];

let currWatch = null;

const setWatch = (dir) => {
  currWatch && currWatch.close();
  currWatch = fs.watch(dir, {
    persistent: false,
    recursive: true
  }, (e) => app.web.reloadProject());
}

module.exports = {
  appWillClose: () => currWatch && currWatch.close(),
  newProject: (cb) => {
    app.web.createDialog({
      type: 1,
      choices: langs,
      text: 'Project Language:'
    }, (lang) => {
      if (!lang) return cb(new Error('User canceled the dialog'), null);
      app.web.createDialog({
        type: 1,
        choices: types,
        text: 'Application Type:'
      }, (type) => {
        if (!type) return cb(new Error('User canceled the dialog'), null);
        app.web.createDialog({
          type: 2,
          text: 'Project Name'
        }, (name) => {
          const d = new Date();
          const proj = {
            dates: {
              created: `${d.getMonth()}-${d.getDate()}-${d.getFullYear()}`,
              lastModified: `${d.getMonth()}-${d.getDate()}-${d.getFullYear()}`
            },
            projectLanguage: lang,
            projectLanguageString: langs[lang],
            projectType: type,
            projectTypeString: types[type].option,
            projectName: name
          }
          electron.dialog.showOpenDialog(app.currentWindow._window, {
            title: 'Save project to:',
            defaultPath: __.homeDir(),
            properties: ['openDirectory', 'createDirectory']
          }, (dirs) => {
            if (!dirs || !dirs[0]) return cb(new Error('User canceled the dialog'), null);
            const dir = dirs[0];
            proj.path = `${dir}/${name}`
            fs.mkdir(proj.path, (err) => {
              if (err) return cb(err, null);
              ncp(`${__dirname}/projectTemplates/${types[type][0].toLowerCase()}/${langs[lang].toLowerCase()}`, proj.path, (err) => {
                if (err) return cb(err, null);
                fs.writeFile(`${proj.path}/${name}.oxyproj`, JSON.stringify(proj, null, '  '), (err) => {
                  if (err) return cb(err, null);
                  fs.writeFile(`${proj.path}/package.json`, JSON.stringify({
                    name: name,
                    version: '1.0.0',
                    description: name.substr(0, 1).toUpperCase() + name.slice(1),
                    main: 'index.js',
                    dependencies: {
                      'hydrogen-helpers': '^1.0.0'
                    }
                  }, null, '  '), (err) => {
                    if (err) return cb(err, null);
                    fs.writeFile(`${proj.path}/app.json`, JSON.stringify({
                      appTitle: name.toLowerCase(),
                      titleBarName: name.substr(0, 1).toUpperCase() + name.slice(1)
                    }, null, '  '), (err) => {
                      if (err) return cb(err, null);
                      fs.mkdir(`${proj.path}/node_modules`, (err) => {
                        if (err) return cb(err, null);
                        fs.mkdir(`${proj.path}/node_modules/hydrogen-helpers`, (err) => {
                          if (err) return cb(err, null);
                          ncp(`${__dirname}/hydrogen-helpers`, `${proj.path}/node_modules/hydrogen-helpers`, (err) => {
                            if (err) return cb(err, null);
                            app.web.createToast('Installing Electron...');
                            child_process.exec('npm install --save electron-prebuilt', {
                              cwd: proj.path
                            }, (err, stdout, stderr) => {
                              if (err) return cb(err, null);
                              cb(null, proj);
                              setWatch(proj.path);
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  },
  openProject: (cb) => {
    electron.dialog.showOpenDialog(app.currentWindow._window, {
      title: 'Open a project:',
      defaultPath: __.homeDir(),
      filters: [
        {
          name: 'Project Files',
          extensions: ['oxyproj']
        }
      ],
      properties: ['openFile', 'createDirectory']
    }, (files) => {
      if (!files || !files[0]) return cb(new Error('User canceled the dialog'), null);
      const file = files[0];
      fs.readFile(file, (err, cont) => {
        if (err) return cb(err, null);
        const proj = JSON.parse(String(cont));
        const pPath = path.dirname(file);
        if (proj.path !== pPath) {
          proj.path = pPath;
          fs.writeFile(file, JSON.stringify(proj, null, '  '), (err) => {
            if (err) return cb(err, null);
            cb(null, proj);
          });
        } else {
          cb(null, proj);
          setWatch(proj.path);
        }
      });
    });
  },
  rmRf: (list, cb) => {
    const tmp = (i) => {
      if (i >= list.length) return cb(null);
      fs.stat(list[i], (err, stats) => {
        if (err) return cb(err);
        if (stats.isDirectory()) {
          fs.readdir(list[i], (err, files) => {
            if (err) return cb(err);
            const arr = [];
            for (const file of files) arr.push(`${list[i]}/${file}`);
            module.exports.rmRf(arr, (err) => {
              if (err) cb(err);
              tmp(i+1);
            });
          });
        } else {
          fs.unlink(list[i], (err) => {
            if (err) return cb(err);
            tmp(i+1);
          });
        }
      });
    }
    tmp(0);
  },
  recurseList: (dir, cb) => {
    fs.readdir(dir, (err, files) => {
      if (err) return cb(err);
      let ret2 = [];
      const tmp = (i) => {
        if (i >= files.length) return  cb(null, ret2);
        const path2 = `${dir}/${files[i]}`;
        fs.stat(path2, (err, stats) => {
          if (err) return cb(err);
          if (stats.isDirectory()) {
            module.exports.recurseList(path2, (err, files2) => {
              if (err) return cb(err);
              ret2 = ret2.concat(files2);
              tmp(i+1);
            });
          } else {
            ret2.push(path2);
            tmp(i+1);
          }
        });
      }
      tmp(0);
    });
  },
  cleanDS_Stores: (dir, cb) => {
    module.exports.recurseList(dir, (err, list) => {
      if (err) return cb(err);
      const arr = [];
      for (let item of list) if (path.basename(item) === '.DS_Store') arr.push(item);
      module.exports.rmRf(arr, (err) => {
        if (err) return cb(err);
        cb(null);
      });
    });
  }
}
