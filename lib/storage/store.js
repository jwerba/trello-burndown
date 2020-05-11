var path = require('path');
var fs = require('fs');
var Logger = require('../logging/logger');

const log = new Logger('trello-burndown-chart');

var UUID = (function () {
    var self = {};
    var lut = []; for (var i = 0; i < 256; i++) { lut[i] = (i < 16?'0':'') + (i).toString(16); }
    self.generate = function () {
        var d0 = Math.random() * 0xffffffff | 0;
        var d1 = Math.random() * 0xffffffff | 0;
        var d2 = Math.random() * 0xffffffff | 0;
        var d3 = Math.random() * 0xffffffff | 0;
        return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
      lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
      lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
      lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
    }
    return self;
})();

var Store = (function () {
    
    function createInstance(config) {
        var ProviderClass = require('./' + config.strategy + 'StorageStrategy.js');
        var object = new ProviderClass(config.settings);
        return object;
    }
    var declaration = {
        instance : null,
        config: null,

        getInstance: function () {
            if (!this.instance) {
                this.instance = createInstance(this.config);
            }
            return this.instance;
        },
        configure: function(configuration){
            if (!configuration) throw 'configuration cannot be empty';
            if (!configuration.strategy) throw 'configuration object should include strategy value';
            //todo: check interface implementation
            this.config = configuration;
            log.info('configured strategy for storage: ' + this.config.strategy);
        },
         buildUID: function(obj) {
            if (!obj.name) {
                obj.name = UUID.generate();
            }
            obj.name = obj.name.replace(/\s+/g, '-').toLowerCase();
            if (!obj.id) {
                if (Object.prototype.toString.call(obj) === '[object Array]') {
                    var obj = {
                        'id': obj.name,
                        'content': obj
                    };
                } else {
                    obj.id = obj.name;
                }
            }
            return obj;
        }
    };
    
    return declaration;
})();



module.exports = Store;