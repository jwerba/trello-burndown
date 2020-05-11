var Promise = require('promise');
var fs = require('fs');
var path = require('path');

var Logger = require('../logging/logger');
const log = new Logger('trello-burndown-chart');

class InMemoryStorageStrategy {
  
	constructor(settings) {
        this.settings = settings;
        this.documents =[];
	}

  

    _getDocumentAsycAsArray(documentId) {
        return new Promise((resolve, reject) => {
          var document = this.documents[documentId];
          if (!document || document == null){
            document = [];
          }
          resolve(document);
        });
      }
      
      _getDocumentAsycAsObject(documentId) {
        return new Promise((resolve, reject) => {
          var document = this.documents[documentId];
          if (!document || document == null){
            document = null;
          }
          resolve(document);
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
      let id = configuration.id;
      let configurations = this.getAllConfigurations().then(configurations =>{
          var existingConfig = configurations.find((x)=> { return x.id ==  id});
          if (!existingConfig || existingConfig == null){
              configurations.push(configuration);
          }else{
              var index = configurations.indexOf(existingConfig);
              if (index !== -1) {
                  configurations[index] = configuration;
              }
          }
          this.documents["configurations"] = configurations;
      });
  }
   
    getStatistics(id) {
        var promise = this._getDocumentAsycAsObject(id);
        return promise;
    }
    
    
    saveStatistics(stats) {
        return stats;
    }

}

module.exports = InMemoryStorageStrategy;