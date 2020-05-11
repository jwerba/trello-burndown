var Promise = require('promise');
var fs = require('fs');
var path = require('path');

var Logger = require('../logging/logger');
const log = new Logger('trello-burndown-chart');

class EmptyStorageStrategy {
	constructor(settings) {
        this.settings = settings;
        if (!this.settings.exportPath) {
            this.settings.exportPath = path.join(global.settings.root, 'data');
        }
        if (!fs.existsSync(this.settings.exportPath)){
            fs.mkdirSync(this.settings.exportPath);
        }
	}

    _getDocumentAsycAsArray(documentId) {
        return new Promise((resolve, reject) => {
          resolve([]);
        });
      }
      
      _getDocumentAsycAsObject(documentId) {
        return new Promise((resolve, reject) => {
          resolve(null);
        });
      }

      getAllConfigurations() {
        var promise =  this._getDocumentAsycAsArray('configurations');
        return promise;
    }
      
    saveConfiguration(configuration) {
        if (!configuration.id){
            configuration.id = configuration.name;
        }
    }
   
    getStatistics(id) {
        var promise = this._getDocumentAsycAsObject(id);
        return promise;
    }
    
    
    saveStatistics(stats) {
        return stats;
    }

}

module.exports = EmptyStorageStrategy;