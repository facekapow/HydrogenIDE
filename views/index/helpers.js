'use strict';

const EventEmitter = require('events');
const __ = require('mini-utils');
const path = require('path');
const fs = require('fs');
const Highlights = require('highlights');
const exists = (...objs) => {
  for (let obj of objs) {
    if (obj === null || obj === undefined || typeof obj === 'undefined') {
      return false;
    }
  }
  return true;
}
const or = (obj1, obj2) => (exists(obj1)) ? obj1 : obj2;
const range = (num1, num2, including) => {
  const ret = [];
  for (let i = num1; i < num2; i++) ret.push(i);
  if (including) ret.push(num2);
  return ret;
}
const highlighter = new Highlights();
app.main.getHighlighters((err, hls) => {
  if (err) app.web.createToast(`Error loading syntax highlighters: ${err.message}`);
  for (let hl of hls) {
    highlighter.requireGrammarsSync({
      modulePath: `${app.getPath('userData')}/highlighters/node_modules/${hl}`
    });
  }
});

const getScopeNameForExtension = (ext) => {
  const extsJSON = fs.readFileSync(`${app.getPath('userData')}/highlighters/extensions.json`);
  const exts = JSON.parse(String(extsJSON));
  for (const scopeExt of Object.keys(exts)) if (`.${scopeExt}` === ext) return exts[scopeExt];
  return '';
}

class Tab extends EventEmitter {
  constructor(tabName, tabId, tabCont, tabController) {
    super();
    let controller = or(tabController, window.defaultTabManager);
    let name = or(tabName, '');
    let id = or(tabId, controller.nextIndex);
    let cont = or(tabCont, '');

    this.active = false;
    this.removed = false;

    this._tab = document.create('div', {
      className: 'tab',
      dataset: {
        id: String(id)
      }
    });
    this._name = document.create('span', {
      className: 'tabName',
      innerHTML: name
    });
    this._close = document.create('span', {
      className: 'close tabClose',
      innerHTML: 'x'
    });

    this._tab.appendChild(this._name);
    this._tab.appendChild(this._close);

    this._tab.on('click', () => this.emit('click'));
    this._close.on('click', (e) => {
      e.stopPropagation();
      this.emit('close');
    });

    this._cont = document.create('div', {
      className: 'tabCont',
      innerHTML: cont,
      dataset: {
        id: String(id)
      }
    });

    Object.defineProperties(this, {
      name: {
        get: () => name,
        set: (val) => {
          name = val;
          this._name.html(val);
        }
      },
      id: {
        get: () => id,
        set: (val) => {
          if (!controller.indexAvailable(val)) {
            throw new Error('ID not available.');
          }
          id = val;
          this._tab.dataset.id = String(val);
          this._cont.dataset.id = String(val);
          controller.tabIdChanged(this);
        }
      },
      cont: {
        get: () => cont,
        set: (val) => {
          cont = val;
          this._cont.html(val);
        }
      },
      tabElement: {
        get: () => this._tab
      },
      contElement: {
        get: () => this._cont
      }
    });

    setTimeout(() => this.emit('created'), 0);
  }
  remove() {
    this._tab.remove();
    this._cont.remove();
    this._tab = null;
    this._cont = null;
    this._name = null;
    this._close = null;
    this.closeDisabled = false;
    this.removed = true;
    this.emit('removed');
  }
  recreate() {
    this.removed = false;
    this._tab = document.create('div', {
      className: 'tab',
      dataset: {
        id: String(this.id)
      }
    });
    this._name = document.create('span', {
      className: 'tabName',
      innerHTML: this.name
    });
    this._close = document.create('span', {
      className: 'close tabClose',
      innerHTML: 'x'
    });

    this._tab.appendChild(this._name);
    this._tab.appendChild(this._close);

    this._tab.on('click', () => this.emit('click'));
    this._close.on('click', (e) => {
      e.stopPropagation();
      this.emit('close');
    });

    this._cont = document.create('div', {
      className: 'tabCont',
      innerHTML: this.cont,
      dataset: {
        id: String(this.id)
      }
    });

    this.emit('recreate');
  }
  activate() {
    if (this.removed) return null;
    if (!this.active) {
      this._tab.addClass('activeTab');
      this._cont.addClass('activeCont');
      this.active = true;
      this.emit('activated');
    }
  }
  deactivate() {
    if (this.removed) return null;
    if (this.active) {
      this._tab.removeClass('activeTab');
      this._cont.removeClass('activeCont');
      this.active = false;
      this.emit('deactivated');
    }
  }
  disableClose() {
    if (!this.removed) return null;
    if (!this.closeDisabled) {
      this.closeDisabled = true;
      this._close.remove();
    }
  }
  enableClose() {
    if (this.removed) return null;
    if (this.closeDisabled) {
      this.closeDisabled = false;
      this._close = document.create('span', {
        className: 'close tabClose',
        innerHTML: 'x'
      });
      this._close.on('click', (e) => {
        e.stopPropagation();
        this.emit('close');
      });
      this._tab.appendChild(this._close);
    }
  }
}

class TabManager extends EventEmitter {
  constructor(active, header, cont) {
    super();
    this.activeIndex = 0;
    this.activeTab = null;
    this.tabs = [];
    this.nextIndex = this.tabs.length;
    this.tabParents = {
      headers: or(header, document.get('#tabHeaders')),
      conts: or(cont, document.get('#tabConts'))
    }

    if (active) {
      if (typeof active === 'number') {
        activeIndex = active;
        activeTab = tabs[active];
      } else if (active instanceof Tab) {
        activeTab = active;
        activeIndex = active.id;
        if (!exists(this.getTab(active.id))) this.tabs[active.id] = this.activeTab;
      }
    }
  }
  getTab(i) {
    return (this.tabs[i]) ? this.tabs[i] : null;
  }
  getNearestTab(index) {
    for (let i of range(index-1, 0, true)) {
      if (exists(this.tabs[i])) return this.tabs[i];
    }
    for (let i of range(index+1, this.tabs.length)) {
      if (exists(this.tabs[i])) return this.tabs[i];
    }
    return null;
  }
  setActiveTab(i) {
    const tab = this.getTab(i);
    if (!exists(tab)) return false;
    if (this.activeTab) this.activeTab.deactivate();
    tab.activate()
    this.activeTab = tab;
    this.emit('activeTabChanged');
    return true;
  }
  removeTab(i) {
    const tab = this.getTab(i);
    if (!exists(tab)) return false;
    const nearest = this.getNearestTab(this.activeTab.id);
    if (exists(this.activeTab, nearest)) this.setActiveTab(nearest.id);
    if (!tab.removed) tab.remove();
    this.tabs[i] = null;
    return true;
  }
  addTab(tab) {
    if (!(tab instanceof Tab)) return false;
    if (exists(this.tabs[tab.id])) throw new Error('Tab ID is taken.');
    this.tabParents.headers.appendChild(tab.tabElement);
    this.tabParents.conts.appendChild(tab.contElement);
    this.tabs[tab.id] = tab;
    this.nextIndex = this.tabs.length;
    tab.on('click', () => this.setActiveTab(tab.id));
    tab.on('close', () => this.removeTab(tab.id));
    tab.on('removed', () => this.removeTab(tab.id));
    return true;
  }
  tabExists(args) {
    if (exists(args.withName) || exists(args.withId)) {
      for (let tab of this.tabs) {
        if (exists(tab)) {
          if (exists(args.withName) && tab.name === args.withName) {
            return true;
          }
          if (exists(args.withId) && tab.id === args.withId) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

class WebDialog extends EventEmitter {
  constructor(args) {
    super();
    args.type = or(args.type, 0);
    args.text = or(args.text, '');
    args.choices = or(args.choices, []);

    this._box = document.create('div', {
      className: 'dialogBox'
    });
    this._close = document.create('span', {
      className: 'close dialogClose',
      innerHTML: 'x'
    });
    this._overlay = document.create('div', {
      className: 'dialogOverlay'
    });

    this.removeOnHide = true;
    this.hideOnChoice = true;

    switch(args.type) {
      case 0:
        // basic text dialog
        this._box.appendChild(document.create('span', {
          innerHTML: args.text
        }));
        break;
      case 1:
        // choice dialog
        if (args.text !== '') {
          this._box.appendChild(document.create('span', {
            innerHTML: args.text
          }));
          this._box.appendChild(document.create('br'));
        }
        for (let i in args.choices) {
          if (!args.choices.hasOwnProperty(i)) continue;
          ((i) => {
            const choice = args.choices[i];
            let child = null, child2 = null;
            if (typeof choice !== 'string') {
              child = document.create('span', {
                className: 'linkStyle',
                innerHTML: choice[0]
              });
              child2 = document.create('span', {
                innerHTML: choice[1]
              });
            } else {
              child = document.create('span', {
                className: 'linkStyle',
                innerHTML: choice
              });
            }
            child.on('click', () => {
              this.emit('choiceSelected', i);
              if (this.hideOnChoice) this.hide();
            });
            this._box.appendChild(child);
            if (exists(child2)) {
              this._box.appendChild(document.create('span', {
                innerHTML: ' - '
              }));
              this._box.appendChild(child2);
            }
            this._box.appendChild(document.create('br'));
          })(i);
        }
        break;
      case 2:
        // input dialog
        let child = document.create('input', {
          type: 'text'
        });
        if (args.text !== '') child.placeholder = args.text;
        child.on('keydown', (e) => {
          if (e.keyCode === 13) {
            this.emit('inputSubmitted', child.value);
            if (this.hideOnChoice) this.hide();
          }
        });
        let child2 = document.create('span', {
          className: 'linkStyle',
          innerHTML: 'Done'
        });
        child2.on('click', () => {
          this.emit('inputSubmitted', child.value);
          if (this.hideOnChoice) this.hide();
        });
        this._box.appendChild(child);
        this._box.appendChild(document.create('span', {
          innerHTML: ' '
        }));
        this._box.appendChild(child2);
        break;
    }
    this._close.on('click', (e) => {
      e.stopPropagation();
      this.emit('close');
    });
    this._box.appendChild(this._close);
    Object.defineProperties(this, {
      dialogElement: {
        get: () => this._box
      },
      overlayElement: {
        get: () => this._overlay
      }
    });
    setTimeout(() => this.emit('created'), 0);
  }
  show() {
    this._resizeListener = () => {
      this._box.centerToWindow();
      this._box.css({
        left: this._box.css('marginLeft'),
        top: this._box.css('marginTop'),
        marginLeft: 0,
        marginTop: 0
      });
    }
    this._resizeListener();
    this._overlay.css({
      visibility: 'visible',
      opacity: 0.7
    });
    this._box.css({
      visibility: 'visible',
      opacity: 1
    });
    window.on('resize', this._resizeListener);
    this.emit('shown');
  }
  remove() {
    this._overlay.remove();
    this._close.remove();
    this._box.remove();
    this._overlay = null;
    this._close = null;
    this._box = null;
    this.emit('removed');
  }
  hide() {
    this._box.css({
      visibility: 'hidden',
      opacity: 0
    });
    this._overlay.css({
      visibility: 'hidden',
      opacity: 0
    });
    if (exists(this._resizeListener)) window.removeListener('resize', this._resizeListener);
    this.emit('hidden');
    if (this.removeOnHide) this.remove();
  }
}

class WebDialogManager extends EventEmitter {
  constructor(cont) {
    super();
    this.queue = [];
    this.dialogContainer = or(cont, document.body);
    this.currentlyPresenting = false;
  }
  checkQueue() {
    if (this.queue.length > 0 && !this.currentlyPresenting) {
      this.currentlyPresenting = true;
      this.queue[0].once('hidden', () => {
        this.emit('queueItemRemoved', this.queue.shift());
        this.currentlyPresenting = false;
        this.checkQueue();
      });
      this.queue[0].show();
      this.emit('queueItemShown')
    }
  }
  addDialog(dialog) {
    this.dialogContainer.appendChild(dialog.overlayElement);
    this.dialogContainer.appendChild(dialog.dialogElement);
    this.queue.push(dialog);
    dialog.on('close', () => dialog.hide());
    this.emit('queueItemAdded');
  }
}

class Sidebar extends EventEmitter {
  constructor(side, header) {
    super();
    side = or(side, 'left');
    header = or(header, '');
    this._bar = document.create('div', {
      className: 'sidebar'
    });
    this._header = document.create('span', {
      className: 'sidebarHeader',
      innerHTML: header
    });
    this._toolCont = document.create('div', {
      className: 'sidebarToolContainer',
    });
    this._cont = document.create('div', {
      className: 'sidebarItemContainer'
    });
    this.tools = [];
    this.children = [];
    this._bar.appendChild(this._header);
    this._bar.appendChild(this._toolCont);
    this._bar.appendChild(this._cont);
    Object.defineProperties(this, {
      barElement: {
        get: () => this._bar
      },
      headerElement: {
        get: () => this._toolCont
      },
      toolElement: {
        get: () => this._toolCont
      },
      containerElement: {
        get: () => this._cont
      }
    });
    if (side === 'left') {
      document.body.prependChild(this._bar)
    } else {
      document.body.appendChild(this._bar);
    }
    setTimeout(() => this.emit('created'), 0);
  }
  appendTool(tool) {
    this.tools.push(tool);
    this._toolCont.appendChild(tool.itemElement);
    this._toolCont.appendChild(document.createTextNode('\u00A0'));
    this._toolCont.appendChild(document.create('br'));
    this.emit('toolAppended');
  }
  removeChildren() {
    this._cont.innerHTML = '';
    this.children = [];
    this.emit('childrenRemoved');
  }
  appendChild(child) {
    this.children.push(child);
    this._cont.appendChild(child.itemElement);
    this._cont.appendChild(document.create('br'));
  }
}

class SidebarManager {
  constructor() {
    this.left = null;
    this.right = null;
  }
}

class SidebarToolItem extends EventEmitter {
  constructor(text) {
    super();
    this._item = document.create('span', {
      className: 'sidebarTool linkStyle',
      innerHTML: text
    });
    this._item.on('click', () => this.emit('click'));
    Object.defineProperty(this, 'itemElement', {
      get: () => this._item
    });
    setTimeout(() => this.emit('created'), 0);
  }
}

class SidebarFolderItem extends EventEmitter {
  constructor(folderName, path, indent) {
    super();
    indent = or(indent, '\u00A0\u00A0');
    this._item = document.create('div', {
      style: {
        display: 'inline-block'
      }
    });
    this._itemButton = document.create('span', {
      className: 'sidebarFolder linkStyle',
      innerHTML: folderName
    });
    this._files = document.create('div', {
      style: {
        display: 'none'
      }
    });
    this._item.appendChild(this._itemButton);
    this._item.appendChild(document.create('br'));
    this._item.appendChild(this._files);
    this._shown = false;
    Object.defineProperty(this, 'itemElement', {
      get: () => this._item
    });
    fs.readdir(`${path}/${folderName}`, (err, files) => {
      if (exists(err)) return Toast.makeText(`Could not create folder sidbear item: ${err.message}`, Toast.LENGTH_SHORT, false).show();
      for (let file of files) {
        ((file) => {
          fs.stat(`${path}/${folderName}/${file}`, (err, stats) => {
            if (exists(err)) return Toast.makeText(`Could not create folder sidebar item: ${err.message}`, Toast.LENGTH_SHORT, false).show();
            let fileItem = null;
            if (stats.isDirectory()) {
              fileItem = new SidebarFolderItem(file, `${path}/${folderName}`, `${indent}\u00A0\u00A0`);
            } else {
              fileItem = new SidebarFileItem(file, `${path}/${folderName}`);
            }
            this._files.appendChild(document.createTextNode(indent));
            this._files.appendChild(fileItem.itemElement);
            this._files.appendChild(document.create('br'));
          });
        })(file);
      }
    });
    this._itemButton.on('click', () => {
      this.emit('click');
      if (this._shown) {
        this._files.css('display', 'none');
        this._shown = false;
      } else {
        this._files.css('display', 'inline-block');
        this._shown = true;
      }
    });
    setTimeout(() => this.emit('created'), 0);
  }
}

class ContextMenu extends EventEmitter {
  constructor(items, x, y) {
    super();
    this._div = document.create('div', {
      style: {
        top: y + 'px',
        left: x + 'px'
      },
      className: 'ctxMenu'
    });
    this._items = [];
    for (var i = 0; i < items.length; i++) {
      ((i) => {
        var item = document.create('span', {
          className: 'menuItem linkStyle',
          innerHTML: items[i]
        });
        item.on('click', () => this.emit('click', i));
        this._items.push(item);
        this._div.appendChild(item);
      })(i);
    }
    this._overlay = document.create('div', {
      className: 'dialogOverlay noColor'
    });
    this._overlay.on('click', () => this.close());
    document.body.appendChild(this._div);
    document.body.appendChild(this._overlay);
    this._overlay.css({
      visibility: 'visible',
      opacity: 1
    });
  }
  close() {
    this._div.remove();
    this._div = null;
    this._overlay.remove();
    this._overlay = null;
  }
}

class SidebarFileItem extends EventEmitter {
  constructor(fileName, pth) {
    super();
    this._item = document.create('span', {
      className: 'sidebarFile linkStyle',
      innerHTML: fileName
    });
    Object.defineProperty(this, 'itemElement', {
      get: () => this._item
    });
    this._item.on('mousedown', (e) => {
      if (e.button === 2) {
        var ctx = new ContextMenu([
          'Rename File'
        ], e.screenX, e.screenY);
        ctx.on('click', (i) => {
          ctx.close();
          switch(i) {
            case 0:
              // Rename File
              const dialog = new WebDialog({
                type: 2,
                text: 'New file name + path'
              });
              dialog.on('inputSubmitted', input => {
                fs.rename(`${pth}/${fileName}`, `${pth}/${input}`, (err) => {
                  if (err) return Toast.makeText(`Could not rename file: ${err.message}`, Toast.LENGTH_SHORT, false).show();
                });
              });
              defaultWebDialogManager.addDialog(dialog);
              defaultWebDialogManager.checkQueue();
              break;
          }
        });
      } else {
        this.emit('click');
        const recursor = (fn, restPath) => {
          if (defaultTabManager.tabExists({
            withName: fn
          })) {
            return recursor(`${path.basename(restPath)}/${fn}`, path.dirname(restPath));
          } else {
            return fn;
          }
        }
        const name = recursor(fileName, pth);
        if (!(defaultTabManager.tabExists({
          withName: name
        }))) {
          fs.readFile(`${pth}/${fileName}`, (err, cont) => {
            if (exists(err)) return Toast.makeText(`Could not create file sidebar item: ${err.message}`, Toast.LENGTH_SHORT, false).show();
            cont = String(cont);
            let lines = document.create('div', {
              className: 'lines',
              tabIndex: -1
            });
            let lineArr = cont.split('\n');
            const getCursor = () => lines.getElementsByClassName('lineCursor')[0];
            const rmCursor = () => {
              const cursor = getCursor();
              if (exists(cursor)) {
                const prev = cursor.previousSibling;
                const next = cursor.nextSibling;
                if (exists(prev)) prev.style.paddingRight = '1px';
                if (exists(next)) next.style.paddingLeft = '1';
              }
            }
            const addCursor = () => {
              const cursor = getCursor();
              if (exists(cursor)) {
                const prev = cursor.previousSibling;
                const next = cursor.nextSibling;
                if (exists(prev)) prev.style.paddingRight = '0px';
                if (exists(next)) next.style.paddingLeft = '0px';
              }
            }
            const mkCursor = () => document.create('span', {className: 'lineCursor'});
            const getActive = () => lines.getElementsByClassName('activeLine')[0]
            const appendListener = (char) => {
              char.on('click', (e) => {
                e.stopPropagation();
                const x = e.clientX - char.getBoundingClientRect().left;
                const cursor = getCursor();
                rmCursor();
                if (exists(cursor)) cursor.remove();
                if (x <= char.offsetWidth/2) {
                  // left
                  char.parentNode.insertBefore(mkCursor(), char);
                } else {
                  // right
                  if (exists(char.nextSibling)) {
                    char.parentNode.insertBefore(mkCursor(), char.nextSibling);
                  } else {
                    char.parentNode.appendChild(mkCursor());
                  }
                }
                addCursor();
                const active = getActive();
                if (exists(active)) active.removeClass('activeLine');
                char.parentNode.addClass('activeLine');
              });
            }
            const appendLineListener = (line) => {
              line.on('click', (e) => {
                lines.focus();
                e.stopPropagation();
                const cursor = getCursor();
                rmCursor();
                if (exists(cursor)) cursor.remove();
                line.appendChild(mkCursor());
                addCursor();
                const active = getActive();
                if (exists(active)) active.removeClass('activeLine');
                line.addClass('activeLine');
              });
            }
            for (let lineStr of lineArr) {
              const line = document.create('div', {
                className: 'line'
              });
              for (let charStr of lineStr) {
                const char = document.create('span', {
                  className: 'char',
                  innerHTML: charStr.replace(' ', '\u00A0')
                });
                appendListener(char);
                line.appendChild(char);
              }
              appendLineListener(line);
              lines.appendChild(line);
            }
            lines.firstChild.prependChild(document.create('span', {
              className: 'lineCursor'
            }));
            lines.firstChild.addClass('activeLine');

            lines.on('keydown', (e) => {
              if (document.activeElement === lines) {
                const cursor = getCursor();
                if (exists(cursor)) {
                  switch(e.keyCode) {
                    case 86:
                      if (e.ctrlKey) {
                        e.preventDefault();
                        window.paste();
                      }
                      break;
                    case 8:
                      e.preventDefault();
                      const prev = cursor.previousSibling;
                      if (exists(prev)) {
                        prev.remove();
                      } else {
                        const node = cursor.parentNode.previousSibling;
                        const oldNode = cursor.parentNode;
                        if (exists(node)) {
                          node.click();
                          while (oldNode.childNodes.length !== 0) node.appendChild(oldNode.childNodes[0]);
                          oldNode.remove();
                        }
                      }
                      break;
                    case 13:
                      e.preventDefault();
                      const line = document.create('div', {
                        className: 'line'
                      });
                      appendLineListener(line);
                      lines.insertBefore(line, cursor.parentNode.nextSibling);
                      let next = cursor.nextSibling;
                      while (next) {
                        const tmp = next.nextSibling;
                        line.appendChild(next);
                        next = tmp;
                      }
                      const first = line.firstChild;
                      if (exists(first)) {
                        first.click();
                      } else {
                        line.click();
                      }
                      break;
                    case 32:
                      e.preventDefault();
                      const char = document.create('span', {
                        className: 'char',
                        innerHTML: '\u00A0'
                      });
                      appendListener(char);
                      cursor.parentNode.insertBefore(char, cursor);
                      break;
                    case 37:
                      e.preventDefault();
                      if (exists(cursor)) {
                        let sib = cursor.previousSibling;
                        if (exists(sib)) {
                          sib.click();
                        } else {
                          const line = cursor.parentNode.previousSibling;
                          if (exists(line)) line.click();
                        }
                      }
                      break;
                    case 39:
                      e.preventDefault();
                      if (exists(cursor)) {
                        let sib = cursor.nextSibling;
                        if (exists(sib) && exists(sib.nextSibling)) {
                          sib.nextSibling.click();
                        } else {
                          if (exists(sib)) {
                            const line = cursor.parentNode;
                            line.click();
                          } else {
                            const line = cursor.parentNode.nextSibling;
                            if (exists(line)) {
                              if (exists(line.firstChild)) {
                                line.firstChild.click();
                              } else {
                                line.click();
                              }
                            }
                          }
                        }
                      }
                      break;
                    case 38:
                      e.preventDefault();
                      if (exists(cursor)) {
                        const i = Array.prototype.indexOf.call(cursor.parentNode.childNodes, cursor);
                        const line = cursor.parentNode.previousSibling;
                        if (exists(line)) {
                          const elm = line.childNodes[i];
                          if (exists(elm)) {
                            elm.click();
                          } else {
                            line.click();
                          }
                        }
                      }
                      break;
                    case 40:
                      e.preventDefault();
                      if (exists(cursor)) {
                        const i = Array.prototype.indexOf.call(cursor.parentNode.childNodes, cursor);
                        const line = cursor.parentNode.nextSibling;
                        if (exists(line)) {
                          const elm = line.childNodes[i];
                          if (exists(elm)) {
                            elm.click();
                          } else {
                            line.click();
                          }
                        }
                      }
                      break;
                    case 9:
                      const e2 = new Event();
                      e2.initEvent('keydown', true, true);
                      e2.keyCode = 32;
                      e2.which = 32;
                      document.body.dispatchEvent(e2);
                      break;
                  }
                  highlight();
                }
              }
            });
            lines.on('keypress', (e) => {
              if (document.activeElement === lines) {
                const cursor = getCursor();
                for (let code of [13, 32]) if (e.keyCode === code) return;
                if (e.ctrlKey) return;
                if (exists(cursor)) {
                  let str = String.fromCharCode(e.keyCode);
                  if (!e.shiftKey) str = str.toLowerCase();
                  const char = document.create('span', {
                    className: 'char',
                    innerHTML: str
                  });
                  appendListener(char);
                  cursor.parentNode.insertBefore(char, cursor);
                  highlight();
                }
              }
            });
            lines.on('click', () => {
              lines.focus();
              const elm = lines.childNodes[lines.childNodes.length-1];
              if (exists(elm)) elm.click();
            });
            addCursor();
            const tab = new Tab(name);
            tab.tabElement.dataset.filePath = `${pth}/${fileName}`;
            tab.addText = (txt) => {
              lineArr = txt.split('\n');
              let lastChar = null;
              for (let i in lineArr) {
                let lineStr = lineArr[i];
                const cursor = getCursor();
                if (i === 0) {
                  const line = cursor.parentNode;
                  for (let charStr of lineStr) {
                    const char = document.create('span', {
                      className: 'char',
                      innerHTML: charStr.replace(' ', '\u00A0')
                    });
                    appendListener(char);
                    line.insertBefore(char, cursor);
                    lastChar = char;
                  }
                } else {
                  const line = document.create('div', {
                    className: 'line'
                  });
                  for (let charStr of lineStr) {
                    const char = document.create('span', {
                      className: 'char',
                      innerHTML: charStr.replace(' ', '\u00A0')
                    });
                    appendListener(char);
                    line.appendChild(char);
                    lastChar = char;
                  }
                  appendLineListener(line);
                  const p = cursor.parentNode;
                  if (exists(p.nextSibling)) {
                    lines.insertBefore(line, p.nextSibling);
                  } else {
                    lines.appendChild(line);
                  }
                }
              }
              if (exists(lastChar.nextSibling)) {
                lastChar.nextSibling.click();
              } else {
                lastChar.parentNode.click();
              }
            }
            tab.contElement.appendChild(lines);
            function highlight() {
              app.web.getFileContents((tmpCont) => {
                const html = highlighter.highlightSync({
                  fileContents: tmpCont,
                  scopeName: getScopeNameForExtension(path.extname(fileName))
                });
                const tmpElm = document.create('div', {
                  innerHTML: html
                });
                const lines2 = Array.prototype.slice.call(tmpElm.getElementsByClassName('line'), 0);
                const lines3 = Array.prototype.slice.call(lines.getElementsByClassName('line'), 0);
                for (let i in lines2) {
                  if (!lines2.hasOwnProperty(i)) continue;
                  const line = lines2[i];
                  const line2 = lines3[i];
                  if (!line2) continue;
                  const chars = Array.prototype.slice.call(line2.getElementsByClassName('char'), 0);
                  let char = 0;
                  function travel(node) {
                    if (node.childNodes && node.childNodes.length > 0) {
                      for (let j in node.childNodes) {
                        if (!node.childNodes.hasOwnProperty(j)) continue;
                        travel(node.childNodes[j]);
                      }
                    } else {
                      if (!node.wholeText) return;
                      for (let i = 0, len = node.wholeText.length; i < len; i++) {
                        if (chars[char]) chars[char].className = 'char ' + node.parentNode.parentNode.className;
                        char++;
                      }
                      node.parentNode.removeChild(node);
                    }
                  }
                  travel(line);
                  appendLineListener(lines2[i]);
                }
              });
            }
            highlight();
            defaultTabManager.addTab(tab);
            defaultTabManager.setActiveTab(tab.id);
            lines.focus();
            document.get('#tabHeaders').scrollIntoView();
            tab.on('activated', () => {
              lines.focus();
              document.get('#tabHeaders').scrollIntoView();
            });
          });
        }
      }
    });
  }
}

module.exports = {
  Tab: Tab,
  TabManager: TabManager,
  WebDialog: WebDialog,
  WebDialogManager: WebDialogManager,
  Sidebar: Sidebar,
  SidebarManager: SidebarManager,
  SidebarToolItem: SidebarToolItem,
  SidebarFileItem: SidebarFileItem,
  SidebarFolderItem: SidebarFolderItem
}
