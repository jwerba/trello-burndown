var path = require('path');
var mu = require('mu2-updated');
var SprintTask = require('../model/sprintTask');
var SprintDay = require('../model/sprintDay');
var Logger = require('../logging/logger');
var Store = require('../storage/store');
const log = new Logger('trello-burndown-chart');
var store = Store.getInstance();

class SprintController {
	constructor() {
		
	}
	
	renderMain(req, res){
        /*res.send("Welcome!");
        res.status(200);
        return;*/
        store.getAllConfigurations().then(configurations=>{
            var viewModel = buildBasicViewModelFrom(configurations);
            renderTemplate(res, viewModel, settings.homeTemplatePath);
        }).catch(e=>{
            log.log(e);
            res.writeHead(500, "Internal Server Error. Details: " + e);
            return res.end();
        });
	}

	renderAllSprints(req, res){
        store.getAllConfigurations().then(configurations=>{
            var viewModel = buildBasicViewModelFrom(configurations);
            renderTemplate(res, viewModel, settings.templatePath + path.sep + 'allsprints.template');
        }).catch(e=>{
            log.log(e);
            res.writeHead(500, "Internal Server Error. Details: " + e);
            return res.end();
        });
    }
    
    renderSprintsToEdit(req, res){
        store.getAllConfigurations().then(configurations=>{
            var viewModel = buildBasicViewModelFrom(configurations);
            renderTemplate(res, viewModel, settings.templatePath + path.sep + 'editallsprints.template');
        }).catch(e=>{
            log.log(e);
            res.writeHead(500, "Internal Server Error. Details: " + e);
            return res.end();
        });
    }

    renderAddNewSprint(req, res){
        store.getAllConfigurations().then(configurations=>{
            var viewModel = buildBasicViewModelFrom(configurations);
            renderTemplate(res, viewModel, settings.templatePath + path.sep + 'addsprint.template');
        }).catch(e=>{
            log.log(e);
            res.writeHead(500, "Internal Server Error. Details: " + e);
            return res.end();
        });
        
    }

    renderEditSprint(req, res){
        var sprintID = req.params.id;
        store.getAllConfigurations().then(configurations=>{
            var sprintConfiguration = configurations.find(function (x) { return x.id == sprintID });
            var viewModel = buildBasicViewModelFrom(configurations);
            viewModel.config = sprintConfiguration;
            renderTemplate(res, viewModel, settings.templatePath + path.sep + 'editsprint.template');
        }).catch(e=>{
            log.log(e);
            res.writeHead(500, "Internal Server Error. Details: " + e);
            return res.end();
        });
    }

    renderViewSprint(req, res){
        var sprintID = req.params.id;
        store.getAllConfigurations().then(configurations=>{
            var sprintConfiguration = configurations.find(function (x) { return x.id == sprintID });
            var viewModel = buildBasicViewModelFrom(configurations);
            viewModel.config = sprintConfiguration;
            renderTemplate(res, viewModel, settings.template);
        }).catch(e=>{
            log.log(e);
            res.writeHead(500, "Internal Server Error. Details: " + e);
            return res.end();
        });
    }

    //******** API */

    getSprintConfiguration(req, res){
        var sprintID = req.params.id;
        store.getAllConfigurations().then(configurations=>{
            var sprintConfiguration = configurations.find(function (x) { return x.id == sprintID });
            if (!sprintConfiguration)
                return res.status(404).send({'message': 'No configuration found for springID ' + sprintID});
            else
                return res.json(sprintConfiguration);
        }).catch(e=>{
            log.log(e);
            res.writeHead(500, "Internal Server Error. Details: " + e);
            return res.end();
        });
    }
    

    postSprintConfiguration(req, res){
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        
        req.on('end', function () {
            store.getAllConfigurations().then(configurations=>{
                var config = JSON.parse(body);
                var alreadyExistingConfig = configurations.find(function (x) { return x.name == config.name });

                if (alreadyExistingConfig) {
                    res.writeHead(500, "Already existing");
                    return res.end();
                }
                else {
                    try{
                        store.saveConfiguration(config);
                        res.writeHead(200, "Done");
                        return res.end();
                    }catch(e){
                        log.log(error);
                        res.writeHead(500, "Internal Server Error. Details: " + JSON.stringify(error));
                        return res.end();
                    }
                }
            });
        });
    }

    putSprintConfiguration(req, res){
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            var config = JSON.parse(body);
            try{
                store.saveConfiguration(config);
                res.writeHead(200, "Done");
                return res.end();
            }catch(e){
                log.error(e);
                res.writeHead(500, "Internal Server Error. Details: " + JSON.stringify(error));
                return res.end();
            }
        });
    }

    getSprintData(req, res){
        var sprintID = req.params.id;
        try{
            var sprint = store.getStatistics(sprintID).then(sprintInfo=>{
                var stats = {
                    'burndown': (sprintInfo != null)? generateBurndown(sprintInfo): null,
                    'sprint': sprintInfo
                };
                return res.json(stats);
            }).catch(e=>{
                log.error(e);
                return res.status(500).send({'message': e});    
            });
        }catch(e){
            log.error(e);
            return res.status(500).send({'message': e});
        }            
    }
}         
//**************************************************/

function buildBasicViewModelFrom(configurations){
    var viewModel = {
        title: "Burndown chart generator",
        sprints:[],
        has_sprints: false
    };
    if (settings && settings.html_title) viewModel.title = settings.html_title
    configurations.forEach((conf) => {
        viewModel.sprints.push({id: conf.id, name: conf.name})
    });
    viewModel.has_sprints = viewModel.sprints.length > 0;
    return viewModel;
}
function renderTemplate(res, viewModel, templatePath){
    return generateTemplate(viewModel, templatePath, function (err, data) {
        if (err) {
            log.error(err);
            return;
        }
        var headers = {
            'Content-Type': 'text/html; charset=UTF-8',
            'Content-Length': Buffer.byteLength(data)
        };
        res.writeHead(200, headers);
        return res.end(data);
    });
}

function generateTemplate(dataForTemplate, templatePath, callback) {
    var templatedData = '';
    var stream = mu.compileAndRender(templatePath, dataForTemplate)
		.on('data', function (data) { templatedData += data.toString(); })
		.on('error', function (error) { callback(error); })
		.on('end', function () { callback(null, templatedData); })
}


//******************************************************* */

function generateBurndown(sprintData) {
    var remainingIdealEffort = sprintData.totalEffort;
    var remainingEffort = sprintData.totalEffort;
    
    var data = {
        data1: [],
        data2: []
    };
    var now = new Date();
    var stop = false;
    var until = null;
    sprintData.days.forEach(sprintDay=>{
        if (sprintData.days.indexOf(sprintDay) > 0){
            remainingIdealEffort = remainingIdealEffort - sprintDay.idealEffort;
        } 
        var idealRemaining = {
            x: sprintDay.label,
            y: parseFloat(remainingIdealEffort)
        };
        var effortDoneThisDay = 0;
		sprintDay.tasksDone.forEach(element => {
			if (element.isDone){
				effortDoneThisDay+= element.effort;
			}
        });
        remainingEffort = remainingEffort - effortDoneThisDay;
        var remaining = {
            x: sprintDay.label,
            y: parseFloat(remainingEffort)
        }
        data.data1.push(idealRemaining);
        until = new Date(sprintDay.until);
        if (until <= now && stop != true){
            data.data2.push(remaining);
        }else{
            if (stop == false){
                data.data2.push(remaining);
                stop = true;
            }
        }
        
    });
    until.setDate(until.getDate() + 1)
    var final = {
        x: "x",
        y: 0
    };
    data.data1.push(final);
    return data;
}





module.exports = SprintController;