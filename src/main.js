'use strict';
const _ = require('underscore');
const electron = require('electron');
const app = electron.app;  // Module to control application life. // Module to create native browser window.
const ipc = electron.ipcMain;

const windowManager = require('./windows/window_manager');
const AuxAppWindow = require('./windows/aux-app/aux-app');
const nativeMenu = require('./native_menu');
const globalShortcut = require('electron').globalShortcut;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  windowManager.openLastWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
  windowManager.registerWindow(new AuxAppWindow());

  windowManager.getWindowById('portal').open();

  nativeMenu.setMenu();

  ['MediaPlayPause', 'MediaNextTrack', 'MediaPreviousTrack'].forEach(function (shortcut) {
    globalShortcut.register(shortcut, function () {
      if (windowManager.getActiveWindow()) {
        windowManager.getActiveWindow().trigger(shortcut);
      }
    });
  });
});

let canClose = false;
ipc.on('can-close', () => {
  console.log('got permission to close app');
  canClose = true;
  app.quit();
});

app.on('before-quit', function (ev) {
  const activeWindow = windowManager.getActiveWindow();
  if (!activeWindow) {
    return;
  }
  if (!canClose) {
    console.log('before-quit prepare close');
    activeWindow.window.webContents.send('prepare-close');
    ev.preventDefault();
  } else {
    console.log('before-quite propagate close');
    activeWindow.trigger('before-quit');
  }
});

app.on('will-quit', () => {
  console.log('WILL QUIT');
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});
