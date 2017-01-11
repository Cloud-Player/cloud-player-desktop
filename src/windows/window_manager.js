const electron = require('electron');
const Window = require('./window');
const _ = require('underscore');
const Backbone = require('backbone');
const Q = require('q');

var WindowManager = function () {

};

_.extend(WindowManager.prototype, Backbone.Events, {
  _registeredWindows: [],
  _openedWindows: [],
  _lastActiveWindow: null,
  _activeWindow: null,
  _focusedWindow: null,
  _initializeWindowListeners: function (window) {
    window.on('opened', function () {
      this._lastActiveWindow = window;
      if (!_.findWhere(this._openedWindows, window)) {
        this._openedWindows.push(window);
      }
    }, this);
    window.on('closed', function () {
      this._openedWindows = _.without(this._openedWindows, window);
      if (window === this._activeWindow) {
        delete this._activeWindow;
      }
    }, this);
    window.on('focus', function () {
      this._lastActiveWindow = window;
      this._activeWindow = window;
    }, this);
  },
  isAlreadyRegistered: function (window) {
    return !!this.getWindowById(window.id);
  },
  registerWindow: function (window) {
    if (!window instanceof Window) {
      throw new Error('Has to be a window');
    }
    if (this.isAlreadyRegistered(window)) {
      throw new Error('Window has been already registered');
    }
    this._registeredWindows.push(window);
    this._initializeWindowListeners(window);
    return window;
  },
  unRegisterWindow: function (window) {
    this._registeredWindows = _.without(this._registeredWindows, window);
    return this._registeredWindows;
  },
  getRegisterWindows: function () {
    return this._registeredWindows;
  },
  getActiveWindow: function () {
    return this._activeWindow;
  },
  getOpenedWindows: function () {
    return this._openedWindows;
  },
  openLastWindow: function () {
    if (this._openedWindows.length === 0 && this._lastActiveWindow) {
      this._lastActiveWindow.open();
    } else if (this._openedWindows.length > 0) {
      _.last(this._openedWindows).open();
    }
  },
  getWindowById: function (id) {
    return _.findWhere(this._registeredWindows, {id: id});
  },
  closeWindows: function (windows) {
    var promiseQueue = [];
    windows.forEach(function (window) {
      promiseQueue.push(window.close());
    });
    return Q.all(promiseQueue);
  },
  closeAllOpenedWindows: function () {
    return this.closeWindows(this._openedWindows);
  },
  replaceOpenedWindowsWithWindow: function (window, opts) {
    var openedWindows = _.clone(this.getOpenedWindows());

    return window.open(opts).then(function () {
      window.window.hide();
      openedWindows = _.without(openedWindows, window);
      return this.closeWindows(openedWindows).then(function () {
        window.window.show();
        openedWindows = null;
        return this;
      }.bind(this));
    }.bind(this));
  }
});

module.exports = new WindowManager();