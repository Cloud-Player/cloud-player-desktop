const Q = require('q');
const _ = require('underscore');
const LokiJs = require('lokijs');

/**
 * Backbone localStorage Adapter
 * Version 1.1.16
 *
 * https://github.com/jeromegn/Backbone.localStorage
 */
(function (root, factory) {
  if (typeof exports === 'object' && typeof require === 'function') {
    module.exports = factory(require("backbone"));
  } else if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(["backbone"], function (Backbone,_) {
      // Use global variables if the locals are undefined.
      return factory(Backbone || root.Backbone);
    });
  } else {
    factory(Backbone);
  }
}(this, function (Backbone) {

  var missingDbNameError = new Error('Databasename has to be specificed by setting the attribute dbName');

  Backbone.Q = Q;

  Backbone.LokiStore = function (name, constraints, lokiJs) {
    this.name = name;
    this.lokiJs = lokiJs || Backbone.LokiStore.lokiStore;
    this.constraints = constraints || [];

    if(!this.lokiJs){
      throw new Error('No database is availble. Make sure to pass either a database as argument or call Backbone.LokiStore.initialize');
    }
  };

  //static methods
  _.extend(Backbone.LokiStore, {

    initialize: function(dbPath, options){
      if(this.lokiStore){
        throw new Error('Database has already been initialized');
      }
      options = options || {};
      this.lokiStore = new LokiJs(dbPath);
      this.isInitialized = false;
      this.isInitializedCallback = function(){};

      if(!options.noAutoLoad){
        this.loadDatabase();
      }
    },
    loadDatabase: function(){
      this.lokiStore.loadDatabase({},function(){
        this.isInitialized = true;
        this.isInitializedCallback.apply(this,arguments);
      }.bind(this));
    },
    saveDatabase: function(){
      var dfd = Backbone.Q.defer();
      this.lokiStore.saveDatabase(function (rsp) {
        dfd.resolve();
      }.bind(this));
      return dfd.promise;
    }

  });

  //instance methods
  _.extend(Backbone.LokiStore.prototype, {

    save: function () {
      return Backbone.LokiStore.saveDatabase();
    },

    getCollection: function(){
      var dfd = Backbone.Q.defer(),
        resolver = function(){
          var existingCollection = this.getLoki().getCollection(this.name),
            newCollection = this.getLoki().addCollection(this.name, { indices: this.constraints});

          this.constraints.forEach(function(constraint){
            newCollection.ensureUniqueIndex(constraint);
          });

          dfd.resolve( existingCollection || newCollection );
        }.bind(this);

      if(Backbone.LokiStore.isInitialized){
        resolver();
      } else {
        Backbone.LokiStore.isInitializedCallback = resolver;
      }
      return dfd.promise;
    },

    find: function (model) {
      return this.getCollection().then(function(collection){
        return collection.get(model.id);
      });
    },

    findAll: function (query) {
      return this.getCollection().then(function(collection){
        if(query){
          return collection.find(query) || [];
        } else {
          return collection.data;
        }
      });
    },

    create: function (model) {
      console.log('START CREATE', this.name);
      return this.getCollection().then(function(collection){
        console.log('FETCHED COLLECTION', this.name);
        var rsp = collection.insert(model.toJSON());
        if(rsp && !_.isArray(rsp)){
          return this.save().then(function(){
            console.log('SAVED MODEL', this.name);
            model.set(rsp);
            return this.find(model);
          }.bind(this));
        } else {
          return Backbone.Q.reject('Error: Could not save model');
        }
      }.bind(this));
    },

    // Update a model by replacing its copy in `this.data`.
    update: function (model) {
      return this.getCollection().then(function(collection){
        var rsp = collection.update(model.toJSON());
        return this.save().then(function(){
          model.set(rsp);
          return this.find(model);
        }.bind(this));
      }.bind(this));
    },

    destroy: function (model) {
      console.log('START DESTROY', this.name)
      return this.getCollection().then(function(collection){
        console.log('FETCHED COLLECTION', this.name)
        collection.remove(model.toJSON());
        return this.save().then(function(){
          console.log('DESTROYED MODEL', this.name);
        }.bind(this));
      }.bind(this));
    },

    getLoki: function () {
      return this.lokiJs;
    }

  });

// localSync delegate to the model or collection's
// *localStorage* property, which should be an instance of `Store`.
// window.Store.sync and Backbone.localSync is deprecated, use Backbone.LocalStorage.sync instead
  Backbone.LokiStore.sync = function (method, model, options) {
    var lokiStore = _.result(model, 'lokiStore') || _.result(model.collection, 'lokiStore');

    var resp, errorMessage,
      syncDfd = Backbone.Q.defer();

    try {

      switch (method) {
        case "read":
          resp = model.id != undefined ? lokiStore.find(model) : lokiStore.findAll(options ? options.query : null);
          break;
        case "create":
          resp = lokiStore.create(model);
          break;
        case "update":
          resp = lokiStore.update(model);
          break;
        case "delete":
          resp = lokiStore.destroy(model);
          break;
      }

    } catch (error) {
      errorMessage = error.message;
      console.error(error);
    }

    if (resp) {
      resp.then(function (rsp) {
        if (options && options.success) {
          try{
            options.success(rsp);
          } catch(err){
            console.log(err);
          }
        }
        syncDfd.resolve(model);
      }, function(err){
        syncDfd.reject(err);
      });
    } else {
      if (options && options.error) {
        options.error(errorMessage);
      }
      syncDfd.reject(errorMessage);
    }

    // add compatibility with $.ajax
    // always execute callback for success and error
    if (options && options.complete) options.complete(resp);

    return syncDfd.promise;
  };

  Backbone.ajaxSync = Backbone.sync;

  Backbone.getSyncMethod = function (model, options) {
    var forceAjaxSync = options && options.ajaxSync;

    if (!forceAjaxSync && (_.result(model, 'lokiStore') || _.result(model.collection, 'lokiStore'))) {
      return Backbone.LokiStore.sync;
    }

    return Backbone.ajaxSync;
  };

// Override 'Backbone.sync' to default to localSync,
// the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
  Backbone.sync = function (method, model, options) {
    return Backbone.getSyncMethod(model, options).apply(this, [method, model, options]);
  };

  Backbone.LokiModel = Backbone.Model.extend({
    dbName: null,
    idAttribute: '$loki',
    constraints: [],
    constructor: function (model, options) {
      if(options && options.collection){
        if(!this.dbName){
          this.dbName = options.collection.dbName;
        }
        if(this.constraints.length===0){
          this.constraints = options.collection.constraints;
        }
      }
      if (!this.dbName) {
        throw missingDbNameError
      }
      this.lokiStore = new Backbone.LokiStore(this.dbName, this.constraints);
      return Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });

  Backbone.LokiCollection = Backbone.Collection.extend({
    dbName: null,
    constraints: [],
    model: Backbone.LokiModel,
    find: function(query){
      return this.fetch({
        query: query
      });
    },
    constructor: function () {
      if (!this.dbName) {
        throw missingDbNameError
      }
      this.lokiStore = new Backbone.LokiStore(this.dbName, this.constraints);
      return Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });

  return Backbone;
}));