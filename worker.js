
var Promise = require('promise');
var CardReceiver = require('./lib/services/cardreceiver');
var CardStatistics = require('./lib/services/cardstatistics.js')
var Store = require('./lib/storage/store.js');
var SprintBuilder = require('./lib/model/sprintBuilder');
var Sprint = require('./lib/model/sprint');
var SprintTask = require('./lib/model/sprintTask');
var Logger = require('./lib/logging/logger');

const log = new Logger('trello-burndown-chart');


var Worker = function Worker() {
    this.applicationKey = null;
    this.userToken = null;
    this.boardId = null;
    this.counter = 0;
    this.started = false;
    this.canStart = true;
    this.counter = 0;
    
    this.trelloInfo = global.settings.trelloInfo; 

    if (process.env.SECRET_TRELLO_APP_KEY){
        log.info('process.env.SECRET_TRELLO_APP_KEY found')
        this.trelloInfo.applicationKey = process.env.SECRET_TRELLO_APP_KEY;
    }
    if (process.env.SECRET_TRELLO_USER_TOKEN){
        log.info('process.env.SECRET_TRELLO_USER_TOKEN found')
        this.trelloInfo.userToken = process.env.SECRET_TRELLO_USER_TOKEN;   
    }
    if (process.env.SECRET_TRELLO_BOARD_ID){
        log.info('process.env.SECRET_TRELLO_BOARD_ID found')
        this.trelloInfo.boardId = process.env.SECRET_TRELLO_BOARD_ID;   
    }

    if (!this.trelloInfo.applicationKey || this.trelloInfo.applicationKey == ""){
        this.canStart = false;
        let msg = "APPLICATION KEY IS MISSING. It seems that there is no value in the setttings.json file nor the SECRET_TRELLO_APP_KEY enviroment var";
        log.error(msg)
    }
    if (!this.trelloInfo.userToken || this.trelloInfo.userToken == ""){
        this.canStart = false;
        let msg = "USER TOKEN IS MISSING. It seems that there is no value in the setttings.json file nor the SECRET_TRELLO_USER_TOKEN enviroment var ";
        log.error(msg)
    }
    if (!this.canStart){
        log.info("Worker won't start. APPLICATION_KEY OR USER_TOKEN is missing");
    }
    this.repository = Store.getInstance();
};



module.exports = Worker;


Worker.prototype = (function () {
    
    function wirePromiseLoop() {
        if (this.worker.canStart){
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
            }).catch(e=>{
                log.error(e);
            });
        }
    };
    
    function processConfiguration(config, credentials){
        try{
            var boardId = (config.boardId && config.boardId !== "")? config.boardId: credentials.boardId;
            var cardReceiver = new CardReceiver(credentials.applicationKey, credentials.userToken, boardId);

            var splittedLists = [];
            config.lists.forEach(item =>{ splittedLists.push(item.name); });
            cardReceiver.receive(splittedLists, function (err, cards) {
                if (err) {
                    var message = '[sprint: ' + config.name + ' boardId: ' + config.boardId + '] CardReceiver.receive(...) raised error: ' + err;
                    log.error(message);
                }
                else if (cards) {
                    processCards(config, cards);
                }
            });
        }catch(e){
            log.error(e);
        }
    }


    function doWork() {
        var credentials = {
            'applicationKey' : this.worker.trelloInfo.applicationKey, 
            'userToken' : this.worker.trelloInfo.userToken,
            'boardId' : this.worker.trelloInfo.boardId
        };
        data = this.worker.repository.getAllConfigurations().then((configurations)=>{
            if (configurations == null) configurations = [];
            configurations.forEach(function (config) {
                processConfiguration(config, credentials);
            });
        }).catch(e=>{
            log.error(e);
        });
    };
    
     function processCards(config, cards) {
        let msg = 'processing cards for ' + config.name + '...';
        log.info(msg);
        var builder = new SprintBuilder();
        var sprint = builder.buildFrom(config);
        var cardStatistics = new CardStatistics();
        var tasks = cardStatistics.buildTasksFromCards(cards, config.finishedList);
        sprint.add(tasks);
        //log.debug(JSON.stringify(sprint));
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