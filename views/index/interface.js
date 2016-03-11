'use strict';

const electron = require('electron');

app.web.__addFunction('createToast', (text, length) => Toast.makeText(text, (length || Toast.LENGTH_SHORT), false).show());
app.web.__addFunction('createDialog', (args, cb) => {
  const dialog = new WebDialog(args);
  defaultWebDialogManager.addDialog(dialog);
  defaultWebDialogManager.checkQueue();
  dialog.once('choiceSelected', (choice) => cb(choice));
  dialog.once('inputSubmitted', (input) => cb(input));
  dialog.once('hidden', () => cb());
});
app.web.__addFunction('sendProject', (proj) => window.loadProject(proj));
app.web.__addFunction('getFileContents', (cb) => {
  const tab = defaultTabManager.activeTab;
  if (tab) {
    const lines = tab.contElement.get('.lines')[0];
    if (lines) {
      let cont = '';
      const children = lines.get('.line');
      for (let i in children) {
        const line = children[i];
        let lineCont = '';
        for (let char of line.get('.char')) {
          lineCont += char.html().replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        }
        cont += lineCont;
        if ((i === children.length - 1 && lineCont !== '') || i !== children.length - 1) cont += '\n';
      }
      cb(cont, tab.tabElement.dataset.filePath);
    } else {
      cb(null, null);
    }
  }
});
app.web.__addFunction('removeSidebars', () => {
  const sidebars = document.get('.sidebar');
  for (let i in sidebars) {
    if (!sidebars.hasOwnProperty(i)) continue;
    sidebars[i].remove();
  }
});
app.web.__addFunction('reloadProject', () => {
  setTimeout(() => window.loadProjectFiles(defaultSidebarManager.left, window.project.path), 10);
});
app.web.__addFunction('closeCurrent', () => defaultTabManager.removeTab(defaultTabManager.activeTab.id));
window.paste = () => {
  if (defaultTabManager.activeTab && defaultTabManager.activeTab.addText) {
    defaultTabManager.activeTab.addText(electron.clipboard.readText());
  }
}
app.web.__addFunction('wantsPaste', window.paste);
