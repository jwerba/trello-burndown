
var Storage = require('./lib/services/storage.js');
var path = require('path');
global.settings = require('./settings');
settings.root = __dirname.replace(/\/+$/, "");
settings.templatePath = path.join(settings.root, 'templates');
settings.sprintTemplatePath = path.join(settings.root, 'templates' + path.sep + settings.template);
settings.homeTemplatePath = path.join(settings.root, 'templates' + path.sep + settings.home_template);


/*
 for example:
var configuration = {
    provider: 'local/fsProvider.js', //'azure/documentDBProvider.js', 
    settings : {}
};
 */
var configuration = settings.storage;


var instance = Storage.getInstance();
instance.configure(configuration);
var provider = instance.getProvider();

if (!settings.enableWorkers || (settings.enableWorkers && settings.enableWorkers == true)) {
    var Worker = require('./worker.js');
    worker = new Worker();
    worker.start();
}
if (!settings.hostWebsite || (settings.hostWebsite && settings.hostWebsite == true)) {   
    if (process.env.PORT)
        settings.port = process.env.PORT;
        var Server = require('./lib/server.js');

        var server = new Server();
        server.listen(settings.port);
}