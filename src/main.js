'use strict';
const _ = require('underscore');
const electron = require('electron');
const app = electron.app;  // Module to control application life. // Module to create native browser window.
const ipc = electron.ipcMain;

const windowManager = require('./windows/window_manager');
const CloudPlayerWindow = require('./windows/cloud-player/cloud-player');
const SplashWindow = require('./windows/splash/splash');
const nativeMenu = require('./native_menu');

const os = require('os');
const winston = require('winston');
const globalShortcut = require('electron').globalShortcut;


winston.add(winston.transports.File, {filename: app.getPath('userData') + '/error.log'});

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
  windowManager.registerWindow(new SplashWindow());
  windowManager.registerWindow(new CloudPlayerWindow());

  windowManager.getWindowById('splash').open();

  ipc.on('show-portal', function () {
    windowManager.replaceOpenedWindowsWithWindow(windowManager.getWindowById('portal'), {reinitialize: true});
  });

  nativeMenu.setMenu();

  ['MediaPlayPause', 'MediaNextTrack', 'MediaPreviousTrack'].forEach(function (shortcut) {
    globalShortcut.register(shortcut, function () {
      if (windowManager.getActiveWindow()) {
        windowManager.getActiveWindow().trigger(shortcut);
      }
    });
  });
});

app.on('before-quit', function () {
  windowManager.getOpenedWindows().forEach(function (window) {
    window.trigger('before-quit');
  });
});
