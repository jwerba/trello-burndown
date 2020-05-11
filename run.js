process.env.SCOPE_TYPE = 'development';
if (process.env.SCOPE && process.env.SCOPE.toLowerCase().endsWith('-test')){
    process.env.SCOPE_TYPE = 'test';
}else{
    process.env.SCOPE_TYPE = 'production';
}
var Logger = require('./lib/logging/logger');
const log = new Logger('trello-burndown-chart');
log.info('SCOPE_TYPE = ' + process.env.SCOPE_TYPE);

var serveStatic = require('serve-static');
var url = require('url');
var qs = require('qs');
var path = require('path');
var mu = require('mu2-updated');
var express = require('express');
var bodyParser = require('body-parser')


global.settings = require('./settings');
settings.root = __dirname.replace(/\/+$/, "");
settings.templatePath = path.join(settings.root, 'templates');
settings.sprintTemplatePath = path.join(settings.root, 'templates' + path.sep + settings.template);
settings.homeTemplatePath = path.join(settings.root, 'templates' + path.sep + settings.home_template);

var Store = require('./lib/storage/store');
process.env.LOG_LEVEL = 'info';
if (process.env.ENVIRONMENT != 'test'){
    var configuration = settings.storage;
    Store.configure(configuration);
}




var SprintController = require('./lib/controllers/sprintController') 
var utils = require('./lib/utils');


if (process.env.NODE_ENV === 'production') {
    /* istanbul ignore next */
    require('newrelic');
  }
  
const app = express()

log.info('Applications is initializing...');



/*
 for example:
var configuration = {
    strategy: 'inMemory',
    settings : {}
};
 */

if (settings.enableWorkers == undefined || (settings.enableWorkers && settings.enableWorkers == true)) {
    log.info('Launching backgound worker process...');

    var Worker = require('./worker.js');
    worker = new Worker();
    worker.start();
    log.info('Backgound worker process started');
}
if (!settings.hostWebsite || (settings.hostWebsite && settings.hostWebsite == true)) {   
    log.info('Configuring website...');
    if (process.env.PORT) settings.port = process.env.PORT;
        var controller = new SprintController();
        app.use(express.json());
        
        //app.use(bodyParser.raw({
        //    type: '*/*',
        //    limit: '10000kb'
        //  }));
          
        mu.root = settings.templatePath;
        app.use('/node_modules/xcharts/build/xcharts.min.js', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.js'), { 'Cache-Control': 'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : '' }));
        app.use('/node_modules/xcharts/build/xcharts.min.css', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.css'), { 'Cache-Control': 'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : '' }));
        app.use('/static', serveStatic(path.join(settings.root, 'static'), { maxAge: 86400000 * 365 }));
        
        app.get('/ping', function (req, res) {
            res.send('pong');
          });

        //main
        app.get('/', (req, res) => {
            return controller.renderMain(req, res); 
        });

        //list all sprints
        app.get('/sprints', (req, res) => {
            return controller.renderAllSprints(req, res); 
        });

        //new sprint
        app.get('/sprints/add', (req, res) => {
            return controller.renderAddNewSprint(req, res); 
        });
        
        //list sprints to edit
        app.get('/sprints/edit', (req, res) => {
            return controller.renderSprintsToEdit(req, res);
        });

        //edit sprint
        app.get('/sprints/:id/edit', (req, res) => {
            return controller.renderEditSprint(req, res);
        });

        //view sprint burndown
        app.get('/sprints/:id', (req, res) => {
            return controller.renderViewSprint(req, res);
        });

        app.post('/api/sprints/configurations', (req, res) => {
            return controller.postSprintConfiguration(req, res); 
        });

        app.get('/api/sprints/:id/configuration', (req, res) => {
            var sprintID = req.params.id;
            return controller.getSprintConfiguration(req, res);
        });

        app.put('/api/sprints/:id/configuration', (req, res) => {
            var sprintID = req.params.id;
            return controller.putSprintConfiguration(req, res);
        });

        app.get('/api/sprints/:id/burndown', (req, res) => {
            var sprintID = req.params.id;
            return controller.getSprintData(req, res);
        });



        app.post('/storage/:id', function (req, res) {	
            let id = req.params.id;	
            Store.getInstance().save(id, req.headers['content-type'], req.body).then(function (result) {	
              const resultContentType = result.headers['content-type']	
              if (resultContentType) {	
                res.setHeader('content-type', result.headers['content-type'])	
              }	
              res.status(result.status)	
              result.data.pipe(res)	
           }).catch(err => {	
              console.log(err)	
              res.status(500).send('There was a problem putting the resource')	
           });	
          });	

          app.get('/storage/:id', function (req, res) {	
            let id = req.params.id;	
            Store.getInstance().get(id).then(function (result) {	
              res.status(result.status);	
              result.data.pipe(res);	
            }).catch(err => {	
              console.log(err);	
              res.status(500).send('There was a problem getting the resource');	
           });	
          });	

          app.get('/storage', function (req, res){	
            Store.getInstance().list().then(function (result) {	
                res.status(result.status)	
                result.data.pipe(res)	
            }).catch(err => {	
                console.log(err)	
                res.status(500).send('There was a problem listing files')	
            })	
          });          


        var server = app.listen(settings.port);
        //console.log('app running on port ', settings.port);
        log.info('app running on port ' + settings.port);
}
module.exports = app;
/*
module.exports ={
    'app': app,
    'server': server
};*/ 