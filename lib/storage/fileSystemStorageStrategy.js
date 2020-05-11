var Promise = require('promise');
var fs = require('fs');
var path = require('path');

var Logger = require('../logging/logger');
const log = new Logger('trello-burndown-chart');

class FileSystemStorageStrategy {
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
          var document = [];
          var f = path.join(this.settings.exportPath, documentId + '.json');
          if (fs.existsSync(f)){
              let str = fs.readFileSync(f, 'utf-8');
              document = JSON.parse(str);
              document = eval(document);
          }
          if (document == null){
              document = [];
            }
            resolve(document);
        });
      }
      
      _getDocumentAsycAsObject(documentId) {
        return new Promise((resolve, reject) => {
          var document = null;
          var f = path.join(this.settings.exportPath, documentId + '.json');
          if (fs.existsSync(f)){
              document = JSON.parse(fs.readFileSync(f, 'utf-8'));
              document = eval(document);
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
            let data = JSON.stringify(configurations, null, 4);
             let dir = this.settings.exportPath;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            var f = path.join(dir, 'configurations.json');   
            var jsonData = JSON.stringify(data, null, 4);
            return fs.writeFileSync(f, jsonData);
        });
    }
   
    getStatistics(id) {
        var promise = this._getDocumentAsycAsObject(id);
        return promise;
    }
    
    
    saveStatistics(stats) {
        let id = stats.id;
        let data = JSON.stringify(stats, null, 4);
        let dir = this.settings.exportPath;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        var f = path.join(dir, id + '.json');   
        fs.writeFileSync(f, data);
        return stats;
    }

}

module.exports = FileSystemStorageStrategy;