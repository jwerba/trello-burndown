
var Promise = require('promise');
var CardReceiver = require('./lib/services/cardreceiver');
var CardStatistics = require('./lib/services/cardstatistics.js')
var Storage = require('./lib/services/storage.js');
var SprintBuilder = require('./lib/model/sprintBuilder');
var Sprint = require('./lib/model/sprint');
var SprintTask = require('./lib/model/sprintTask');


var Worker = function Worker() {
    this.applicationKey = null;
    this.userToken = null;
    this.boardId = null;
    this.counter = 0;
    this.started = false;
    
    this.counter = 0;
    
    this.trelloInfo = global.settings.trelloInfo; 
    if (process.env.TRELLO_APP_KEY){
        this.trelloInfo.applicationKey = process.env.TRELLO_APP_KEY;
    }
    if (process.env.TRELLO_USER_TOKEN){
        this.trelloInfo.userToken = process.env.TRELLO_USER_TOKEN;   
    }
    if (process.env.TRELLO_BOARD_ID){
        this.trelloInfo.boardId = process.env.TRELLO_BOARD_ID;   
    }

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
        data = self.repository.getAllConfigurations();
        data.forEach(function (config) {
            try{
                var boardId = (config.boardId && config.boardId !== "")? config.boardId: self.trelloInfo.boardId;
                var cardReceiver = new CardReceiver(self.trelloInfo.applicationKey, self.trelloInfo.userToken, boardId);

                var splittedLists = [];
                config.lists.forEach(item =>{ splittedLists.push(item.name); });
                cardReceiver.receive(splittedLists, function (err, cards) {
                    if (err) {
                        var message = '[sprint: ' + config.name + ' boardId: ' + config.boardId + '] CardReceiver.receive(...) raised error: ' + err;
                        console.error(message);
                    }
                    else if (cards) {
                        processCards(config, cards);
                    }
                });
            }catch(e){
            console.error(e);
        }
        });
    };
    
     function processCards(config, cards) {
        console.log('processing cards for ' + config.name + '...');
        var builder = new SprintBuilder();
        var sprint = builder.buildFrom(config);
        var cardStatistics = new CardStatistics();
        var tasks = cardStatistics.buildTasksFromCards(cards, config.finishedList);
        sprint.add(tasks);
        console.log(sprint);
        Storage.getInstance().ensureID(sprint);
        this.worker.repository.saveStatistics(sprint);
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