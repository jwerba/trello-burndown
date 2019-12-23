
var Promise = require('promise');
var fs = require('fs');
var path = require('path');

var Provider = function Provider(settings) {
    this.settings = settings;
    if (!this.settings.exportPath) {
        this.settings.exportPath = path.join(global.settings.root, 'export');
    }
    if (!fs.existsSync(this.settings.exportPath))
        fs.mkdirSync(this.settings.exportPath);
    this.exportConfigPath = path.join(this.settings.exportPath, 'config');
    this.exportStatsPath = path.join(this.settings.exportPath, 'stats');
    if (!fs.existsSync(this.exportConfigPath))
        fs.mkdirSync(this.exportConfigPath);
    if (!fs.existsSync(this.exportStatsPath))
        fs.mkdirSync(this.exportStatsPath);
};

module.exports = Provider;


Provider.prototype = (function () {
    var _getAll = function () {
        configs = readAllConfigs(this.exportConfigPath);
        return configs;
        /*
        var self = this;
        var promise = new Promise(function (fulfill, reject) {
            try {
                configs = readAllConfigs(self.exportConfigPath);
                fulfill(configs, null);
            } catch (e) {
                reject(null, e);
            }
        });
        return promise;
        */
    };
    
    var _save = function (configuration) {
        if (!configuration.id)
            configuration.id = configuration.name;
        saveJSONConfig(this.exportConfigPath, configuration, configuration.id);
        return configuration;

        /*
        var self = this;
        if (!configuration.id)
            configuration.id = configuration.name;
        var promise = new Promise(function (fulfill, reject) {
            try {
                saveJSONConfig(self.exportConfigPath, configuration, configuration.id);
                fulfill(configuration, null);
            } catch (e) {
                reject(null, e);
            }
        });
        return promise;
        */
    };
    
    var _getStats = function (id) {
        var stat = readStat(this.exportStatsPath, id);
        return stat;        
        /*
        var promise = new Promise(function (fulfill, reject) {
            try {
                var stat = readStat(self.exportStatsPath, sprintName);
                fulfill(stat, null);
            } catch (e) {
                reject(null, e);
            }
        });
        return promise;
        */
    };
    
    
    var _saveStats = function (stats) {
        saveJSONStats(this.exportStatsPath, stats, stats.id);
        return stats;
        /*
        var self = this;
        var promise = new Promise(function (fulfill, reject) {
            try {
                saveJSONStats(self.exportStatsPath, stats, stats.id);
                fulfill(stats, null);
            } catch (e) {
                reject(null, e);
            }
        });
        return promise;
        */
    };

    function saveJSONStats(dir, data, id) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        var dir = path.join(dir, id + '.json');   
        var jsonData = JSON.stringify(data, null, 4);
        return fs.writeFileSync(dir, jsonData);
    }
    
    function readStat(exportPath, id) {
        var f = path.join(exportPath, id + '.json');
        var configuration = JSON.parse(fs.readFileSync(f, 'utf-8'));
        return configuration;
    }
    
    function saveJSONConfig(dir, data, name) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        var dir = path.join(dir, name + '.json');
        
        var jsonData = JSON.stringify(data, null, 4);
        return fs.writeFileSync(dir, jsonData);
    }
     
    function readAllConfigs(exportPath) {
        if (!fs.existsSync(exportPath)) {
            fs.mkdirSync(exportPath);
            return [];
        }
        var files = fs.readdirSync(exportPath);
        var configurations = [];
        var idx = 0;
        for (var i = 0; i < files.length; i++) {
            var sprint = files[i].replace('.json', '');
            var f = path.join(exportPath, files[i]);
            configurations.push(JSON.parse(fs.readFileSync(f, 'utf-8')));
            idx += 1; 
        }
        return configurations;
    }
    
    
    
    return {
        getAllConfigurations: _getAll,
        getStatistics: _getStats,
        saveConfiguration: _save,
        saveStatistics: _saveStats,
    }

}());