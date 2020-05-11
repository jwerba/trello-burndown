
class ConsoleLogger {
  constructor(name) {
      this.name = name;
      return this;
    }

    info(msg, tags = {}){
      console.info(`${msg}`);
    }
    warn(msg, tags = {}){
      console.warn(`${msg}`);
    }
    error(msg, tags = {}){
      console.error(`${msg}`);
    }
    debug(msg, tags = {}){
      console.debug(`${msg}`);
    }
}

module.exports = ConsoleLogger;