'use strict';

const fs = require('fs');
const path = require('path');
const CSON = require('cson');
const child_process = require('child_process');

module.exports = {
  checkDirs: (cb) => {
    const cfgDir = app.getPath('userData');
    fs.stat(cfgDir, (err) => {
      const done = () => {
        fs.stat(`${cfgDir}/highlighters`, (err) => {
          if (err) {
            if (err.code !== 'ENOENT') return cb(err);
            fs.mkdir(`${cfgDir}/highlighters`, (err) => {
              if (err) return cb(err);
              cb(null);
            });
          } else {
            cb(null);
          }
        });
      }
      if (err) {
        if (err.code !== 'ENOENT') return cb(err);
        fs.mkdir(cfgDir, (err) => {
          if (err) return cb(err);
          done()
        });
      } else {
        done()
      }
    });
  },
  checkModules: (cb) => {
    const cfgDir = app.getPath('userData');
    fs.stat(`${cfgDir}/highlighters/package.json`, (err) => {
      const done = () => {
        child_process.exec('npm update', {
          cwd: `${cfgDir}/highlighters`
        }, (err) => {
          if (err) return cb(err);
          module.exports.scanHighlighters();
          cb(null);
        });
      }
      if (err) {
        if (err.code !== 'ENOENT') return cb(err);
        fs.writeFile(`${cfgDir}/highlighters/package.json`, JSON.stringify({
          dependencies: {
            'language-javascript': 'atom/language-javascript',
            'language-coffee-script': 'atom/language-coffee-script',
            'language-json': 'atom/language-json',
            'language-gfm': 'atom/language-gfm',
            'language-html': 'atom/language-html',
            'language-css': 'atom/language-css',
            'language-mustache': 'atom/language-mustache'
          }
        }), (err) => {
          if (err) return cb(err);
          done();
        });
      } else {
        done();
      }
    });
  },
  getHighlighters: (cb) => {
    const cfgDir = app.getPath('userData');
    fs.readFile(`${cfgDir}/highlighters/package.json`, (err, cont) => {
      if (err) return cb(err, null);
      cb(null, Object.keys(JSON.parse(String(cont)).dependencies));
    });
  },
  scanHighlighters: () => {
    const cfgDir = app.getPath('userData');
    fs.readFile(`${cfgDir}/highlighters/extensions.json`, (err, extCont) => {
      if (err && err.code !== 'ENOENT') return;
      let exts = {};
      if (!err) {
        exts = JSON.parse(String(extCont));
      }
      fs.readdir(`${cfgDir}/highlighters/node_modules`, (err, hls) => {
        if (err) return;
        const tmp1 = (j) => {
          const hl = hls[j];
          fs.readdir(`${cfgDir}/highlighters/node_modules/${hl}/grammars`, (err, grammars) => {
            if (err) return;
            const tmp = (i) => {
              const grammar = grammars[i];
              fs.readFile(`${cfgDir}/highlighters/node_modules/${hl}/grammars/${grammar}`, (err, cont) => {
                if (err) return;
                let obj = {};
                if (path.extname(grammar) === '.json') {
                  obj = JSON.parse(String(cont));
                } else if (path.extname(grammar) === '.cson') {
                  obj = CSON.parse(String(cont));
                }
                for (const fileType of obj.fileTypes) {
                  exts[fileType] = obj.scopeName;
                }
                if (i+1 === grammars.length) {
                  if (j+1 === hls.length) {
                    fs.writeFile(`${cfgDir}/highlighters/extensions.json`, JSON.stringify(exts), (err) => {
                      if (err) return;
                    });
                  } else {
                    tmp1(j+1);
                  }
                } else {
                  tmp(i+1);
                }
              });
            }
            tmp(0);
          });
        }
        tmp1(0);
      });
    });
  }
}
