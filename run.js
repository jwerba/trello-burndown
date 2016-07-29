/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

var Storage = require('./lib/storage.js');
var path = require('path');

global.settings = require('./settings');
settings.root = __dirname.replace(/\/+$/, "");
settings.templatePath = path.join(settings.root, 'templates');
settings.sprintTemplatePath = path.join(settings.root, 'templates' + path.sep + settings.template);
settings.homeTemplatePath = path.join(settings.root, 'templates' + path.sep + settings.home_template);

var configuration = {
    provider: 'local/fsProvider.js', //'azure/documentDBProvider.js', 
    settings : {}
};

var instance = Storage.getInstance();
instance.configure(configuration);
var provider = instance.getProvider();

if (settings.enableWorkers && settings.enableWorkers == true) {
    var Worker = require('./worker.js');
    worker = new Worker();
    worker.start();
}

if (process.env.PORT)
    settings.port = process.env.PORT;

var server = require('./lib/server');
require('http').createServer(server).listen(settings.port);