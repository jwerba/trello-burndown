
var TaskDao = require('./taskDao');
var Promise = require('promise');


var Provider = function Provider(settings) {
    this.settings = settings;
    if (!this.settings.databaseId) throw 'this.settings.databaseId is missing';
    this.daoConfig = new TaskDao(this.settings.databaseId, 'configurations');
    this.exportsDao = new TaskDao(this.settings.databaseId, 'exports');
    this.extendedDao = new TaskDao(this.settings.databaseId, 'extended');
    this.daoConfig.init();
    this.exportsDao.init();
    this.extendedDao.init();
};

module.exports = Provider;


Provider.prototype = (function () {
    var _getAll = function () {
        var self = this;
        var promise = new Promise(function (fulfill, reject) {
            try {
                self.daoConfig.getAll(function (data, error) {
                    
                    if (error) reject(null, error);
                    else fulfill(data, error);

                });
            } catch (e) {
                reject(null, e);
            }
        });
        return promise;
    };
    
    var _save = function (configuration) {
        var self = this;
        var promise = new Promise(function (fulfill, reject) {
            try {
                if (!configuration.id) configuration.id = configuration.name;
                self.daoConfig.addOrUpdateItem(configuration, function (error, data) {
                    if (error) reject(null, error);
                    else fulfill(data, error);
                });
            } catch (e) {
                reject(null, e);
            }
        });
        return promise;
    };
    
    var _getStats = function (sprintName) {
        var self = this;
        var promise = new Promise(function (fulfill, reject) {
            try {
                var stats = {
                    id : sprintName,
                    statistics: null,
                    extended: null
                };
                self.exportsDao.getItem(sprintName, function (error, data) {
                    if (error) reject(null, error);
                    else {
                        if (data.content){
                            stats.statistics = data.content;    
                        } else {
                            stats.statistics = data;
                        }
                        self.extendedDao.getItem(sprintName, function (error, data) {
                            if (error) reject(error);
                            else {
                                stats.extended = data;
                                fulfill(stats);
                            }
                        });
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
        return promise;
    };
    
    
    var _saveStats = function (stats) {
        var self = this;
        var localStats = stats;
        var promise = new Promise(function (fulfill, reject) {
            
            var obj = localStats.statistics;
            if (Object.prototype.toString.call(obj) === '[object Array]') {
                var obj = {
                    'id': localStats.name,
                    'content': localStats.statistics
                };
            } else {
                obj.id = localStats.name;
            }

            self.exportsDao.addOrUpdateItem(obj, function (error, data) {
                if (error) reject(error);
                else {
                    var obj = localStats.extended;
                    if (Object.prototype.toString.call(obj) === '[object Array]') {
                        var obj = {
                            'id': localStats.name,
                            'content': localStats.extended
                        };
                    } else {
                        obj.id = localStats.name;
                    }
                    self.extendedDao.addOrUpdateItem(obj, function (error, data) {
                        if (error) reject(error);
                        else {
                            console.log('extendedDao addOrUpdateItem updated!! ' + data.id);
                            fulfill();
                        } 
                    });
                }
            });
        });
        return promise;
    };
    
    
    return {
        getAllConfigurations: _getAll,
        getStatistics: _getStats,
        saveConfiguration: _save,
        saveStatistics: _saveStats,
    }

}());