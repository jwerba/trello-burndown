var path = require('path');
var fs = require('fs');

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

var Storage = (function () {
    // Instance stores a reference to the Singleton
    var instance;
    function init() {         // Singleton
        // Private methods and variables
        function privateMethod() {
            console.log("I am private");
        }
        
        var privateVariable = "Im also private";
        var Provider;
        var configuration;
        
        
        
        function ensureIdExists(obj) {
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
        
        return {
            // Public methods and variables
            getProvider: function () {
                //console.log("The public can see me!");
                try {
                    return new this.Provider(this.configuration.settings);
                } catch (e) {
                    throw e;
                }
            },
            configure: function (configuration) {
                if (!configuration) throw 'configuration cannot be empty';
                if (!configuration.provider) throw 'configuration object should include provider value';
                //todo: check interface implementation
                this.configuration = configuration;
                this.Provider = require('../providers/' + this.configuration.provider);
            },
            ensureID : function (obj) {
                return ensureIdExists(obj)
            },
        };

    }; // end of init()
    
    return {
        // Get the Singleton instance if one exists or create one if it doesn't
        getInstance: function () {
            if (!instance) instance = init();
            return instance;
        }
    };
})();



module.exports = Storage;