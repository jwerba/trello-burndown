var docdbUtils = require('./docdbUtils');
var Promise = require('promise');
var DocumentClient = require('documentdb').DocumentClient;


var dbConfiguration = {
    endpoint : "https://attoburndown.documents.azure.com:443/",
    authKey: "L35mq97v6e93uTtr7S7EH6TqMwATZ34f0N4YaEckzFCXDY3ua35tGKisnVYjrK981tW32eHOx4qDPQhc4peqJQ=="
};

var TaskDao = function TaskDao(databaseId, collectionId) {
    
    this.client = new DocumentClient(dbConfiguration.endpoint, { "masterKey": dbConfiguration.authKey });
    this.databaseId = databaseId;
    this.collectionId = collectionId;
    
    this.database = null;
    this.collection = null;
    this.initialized = false;
    this.promise = null;
};

module.exports = TaskDao;


TaskDao.prototype = {
    init: function (callback) {
        if (this.promise != null) return;
        var self = this;
        if (self.initialized == true) return;
        this.promise = new Promise(function (fulfill, reject) {
            docdbUtils.getOrCreateDatabase(self.client, self.databaseId, function (err, db) {
                if (err) {
                    console.log(err);
                    if (callback)
                        callback(err);
                    reject();
                    self.promise = null;
                } else {
                    self.database = db;
                    docdbUtils.getOrCreateCollection(self.client, self.database._self, self.collectionId, function (err, coll) {
                        if (!err) {
                            self.collection = coll;
                            self.initialized = true;
                        }
                        else {
                            self.initialized = false;
                        }
                        if (callback)
                            callback(err);
                        fulfill();
                        self.promise = null;
                    });
                }
            });


        });
    },
    
    
    isPromiseRunning: function () {
        var self = this;
        if (!self.initialized && this.promise == null) throw ('have to call init first');
        return !self.initialized;
    },
    
    find: function (querySpec, callback) {
        var self = this;
        if (self.isPromiseRunning()) {
            this.promise.then(function () {
                self.find(querySpec, callback);
            });
            return;
        }
        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
            if (err) {
                if (callback)
                    callback(err);

            } else {
                if (callback)
                    callback(null, results);
            }
        });
    },
    
    addItem: function (item, callback) {
        var self = this;
        if (self.isPromiseRunning()) {
            this.promise.then(function () {
                self.addItem(item, callback);
            });
            return;
        }
        
        item.date = Date.now();
        self.client.createDocument(self.collection._self, item, function (err, doc) {
            if (err) {
                if (callback)
                    callback(err);
            } else {
                if (callback)
                    callback(null, doc);
            }
        });
    },
    
    addOrUpdateItem: function (item, callback) {
        var self = this;
        if (self.isPromiseRunning()) {
            this.promise.then(function () {
                self.addOrUpdateItem(item, callback);
            });
            return;
        }
        var itemId = item.id;
        self.getItem(itemId, function (err, doc) {
            if (err) {
                console.error(err);
                if (callback) callback(err);
                return;
            }
            if (doc == null) {
                item.date = Date.now();
                self.client.createDocument(self.collection._self, item, function (err, doc) {
                    if (err) {
                        console.error(err);
                        if (callback)
                            callback(err);
                    } else {
                        if (callback)
                            callback(null, doc);
                    }
                });
            } else {
                if (JSON.stringify(doc) === JSON.stringify(item)) {
                    if (callback) callback({details: 'Update ignored. No changes to the object'}, doc);
                }
                else {
                    item.date = Date.now();
                    self.client.replaceDocument(doc._self, item, function (err, replaced) {
                        if (err) {
                            console.error(err);
                            if (callback)
                                callback(err);
                        } else {
                            if (callback)
                                callback(null, replaced);
                        }
                    });
                }
            }
        });
    },
    
    
    getItem: function (itemId, callback) {
        var self = this;
        if (self.isPromiseRunning()) {
            this.promise.then(function () {
                self.getItem(itemId, callback);
            });
            return;
        }
        
        var querySpec = {
            query: 'SELECT * FROM ' + this.collectionId + ' r WHERE r.id = @id',
            parameters: [{
                    name: '@id',
                    value: itemId
                }]
        };
        
        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
            if (err) {
                if (callback)
                    callback(err);
            } else {
                if (callback) {
                    callback(null, results[0]? results[0] : null);
                }
                    
            }
        });
    },
    
    
    getAll: function (callback) {
        console.log("TaskDao.prototype.getAll");
        var self = this;
        if (self.isPromiseRunning()) {
            console.log("Promise is running...");
            this.promise.then(function () {
                console.log("Promise finished. Calling then function (self)...");
                self.getAll(callback);
            });
            return;
        }
        
        var querySpec = { query: 'SELECT * FROM ' + this.collectionId };
        //console.log("querySpec = ' "  + querySpec.query +  "'");
        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
            if (err) {
                console.log("self.client.queryDocuments callback with errors. Details: " + err);
                if (callback)
                    callback([], err);
            } else {
                console.log("self.client.queryDocuments callback succesfully"); //Details: " + JSON.stringify(results));
                if (callback) {
                    callback(results? results : null, null);
                }
                    
            }
        });
    }

};