/*
 * Trello burndown chart generator
 *
 * Author: Julian Werba <>
 */


var serveStatic = require('serve-static');
var url = require('url');
var qs = require('qs');
var path = require('path');
var utils = require('./services/utils');
var mu = require('mu2-updated');
var Storage = require('./services/storage.js');
var provider = Storage.getInstance().getProvider();
var SprintController = require('./controllers/sprintController') 
var express = require('express');
const app = express()
var controller = new SprintController();

class Server{
    
    constructor(){
        
    }

    listen(port){
        app.use(express.json());
        
        mu.root = settings.templatePath;
        app.use('/node_modules/xcharts/build/xcharts.min.js', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.js'), { 'Cache-Control': 'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : '' }));
        app.use('/node_modules/xcharts/build/xcharts.min.css', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.css'), { 'Cache-Control': 'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : '' }));
        app.use('/static', serveStatic(path.join(settings.root, 'static'), { maxAge: 86400000 * 365 }));
        
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

        app.listen(port);
        console.log('app running on port ', port);
    }
}


module.exports = Server;


