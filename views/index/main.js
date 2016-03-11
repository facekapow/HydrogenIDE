'use strict';

const __ = require('mini-utils');
const helpers = require('./helpers');

for (let i in helpers) window[i] = helpers[i];

window.defaultTabManager = new TabManager();
window.defaultWebDialogManager = new WebDialogManager();
window.defaultSidebarManager = new SidebarManager();

const home = new Tab('Home', defaultTabManager.nextIndex, `<p>Make a new project with File--&gt;New Project or with ${(process.platform === 'darwin') ? 'Command' : 'Control'}+Shift+N</p>`);
defaultTabManager.addTab(home);
defaultTabManager.setActiveTab(home.id);
