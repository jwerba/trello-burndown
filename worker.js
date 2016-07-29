
var Promise = require('promise');
var CardReceiver = require('./lib/cardreceiver');
var CardStatistics = require('./lib/cardstatistics.js')

var Storage = require('./lib/storage.js');



var Worker = function Worker() {
    this.applicationKey = null;
    this.userToken = null;
    this.boardId = null;
    this.counter = 0;
    this.started = false;
    
    this.counter = 0;
    
    this.trelloInfo = global.settings.trelloInfo; 
    this.repository = Storage.getInstance().getProvider();
};



module.exports = Worker;


Worker.prototype = (function () {
    
    function wirePromiseLoop() {
        this.promise = new Promise(function (fulfill, reject) {
            doWork();
            fulfill();
        });
        
        this.promise.then(function () {
            if (this.worker.started) {
                setTimeout(function () {
                    wirePromiseLoop();
                }, 5000);
            }
        });
        
        this.promise.catch(function (error) {
            console.error(error);
        });
    };
    
    function doWork() {
        var self = this.worker;
        var promiseGetConfiguration = self.repository.getAllConfigurations();
        promiseGetConfiguration.then(function (data) {
            try {
                data.forEach(function (config) {
                    var boardId = (config.boardId && config.boardId !== "")? config.boardId: self.trelloInfo.boardId;
                    var cardReceiver = new CardReceiver(self.trelloInfo.applicationKey, self.trelloInfo.userToken, boardId);
                    var splittedLists = config.lists.split(',');
                    splittedLists.concat(config.finishedLists);
                    cardReceiver.receive(splittedLists, function (err, cards) {
                        if (err) {
                            var message = '[sprint: ' + config.name + ' boardId: ' + config.boardId + '] CardReceiver.receive(...) raised error: ' + err;
                            console.error(message);
                        }
                        else if (cards) {
                            processCards(config, cards);
                        }
                    });
                });
            } catch (e) {
                console.error(e);
            }
        });
        return promiseGetConfiguration;
    };
    
     function processCards(config, cards) {
        console.log('processing cards for ' + config.name + '...');
        var cardStatistics = new CardStatistics();
        var data = cardStatistics.generate(cards, config.finishedList, config.standupTime);
        printStatistics(config.name, data);
        var stats = cardStatistics.export(data, config.resources, config.days, config.name);
        Storage.getInstance().ensureID(stats);
        this.worker.repository.saveStatistics(stats);
    };
    
    function printStatistics (sprintName, data) {
        console.log("");
        console.log("Statistics for " + sprintName);
        console.log("----------");
        console.log("Cards (total):    " + (data.cardsopen + data.cardsfinished));
        console.log("Cards (open):     " + data.cardsopen);
        console.log("Cards (finished): " + data.cardsfinished);
        console.log("");
        console.log("Estimate (total): " + data.estimate);
        console.log("Estimate (open):  " + (data.estimate - data.estimatedone));
        console.log("Estimate (done):  " + data.estimatedone);
        console.log("Effort (total):   " + data.efforttotal);
        console.log("Diff estimate:    " + (data.estimatedone - data.efforttotal));
        console.log("----------");
        console.log("");
    };
    
    
    return {
        start : function () {
            this.started = true;
            wirePromiseLoop();
        },
        stop : function () {
            this.started = false;
        },
    }

}());