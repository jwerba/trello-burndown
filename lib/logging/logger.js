const LoggerImpl = require('./console-logger.js');

class Logger{
    constructor(name){
        this.log = new LoggerImpl(name);
    }
    info(msg, tags = {}){
        this.log.info(msg, tags);     
    }
    warn(msg, tags = {}){
        this.log.warn(msg, tags); 
    }
    error(msg, tags = {}){
        this.log.error(msg, tags); 
    }
    debug(msg, tags = {}){
        this.log.debug(msg, tags); 
    }
}

module.exports = Logger;