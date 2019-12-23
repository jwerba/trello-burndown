var path = require('path');
var mu = require('mu2-updated');
var Storage = require('../services/storage.js');

var SprintTask = require('../model/sprintTask');
var SprintDay = require('../model/sprintDay');

var provider = Storage.getInstance().getProvider();


class SprintController {
	constructor() {
		
	}
	
	renderMain(req, res){
        var configurations = provider.getAllConfigurations();
        var viewModel = buildBasicViewModelFrom(configurations);
        renderTemplate(res, viewModel, settings.homeTemplatePath);
	}

	renderAllSprints(req, res){
        var configurations = provider.getAllConfigurations();
        var viewModel = buildBasicViewModelFrom(configurations);
        renderTemplate(res, viewModel, settings.templatePath + path.sep + 'allsprints.template');
    }
    
    renderSprintsToEdit(req, res){
        var configurations = provider.getAllConfigurations();
        var viewModel = buildBasicViewModelFrom(configurations);
        renderTemplate(res, viewModel, settings.templatePath + path.sep + 'editallsprints.template');
    }

    renderAddNewSprint(req, res){
        var configurations = provider.getAllConfigurations();
        var viewModel = buildBasicViewModelFrom(configurations);
        renderTemplate(res, viewModel, settings.templatePath + path.sep + 'addsprint.template');
    }

    renderEditSprint(req, res){
        var sprintID = req.params.id;
        var configurations = provider.getAllConfigurations();
        var sprintConfiguration = configurations.find(function (x) { return x.id == sprintID });
        var viewModel = buildBasicViewModelFrom(configurations);
        viewModel.config = sprintConfiguration;
        renderTemplate(res, viewModel, settings.templatePath + path.sep + 'editsprint.template');
    }

    renderViewSprint(req, res){
        var sprintID = req.params.id;
        var configurations = provider.getAllConfigurations();
        var sprintConfiguration = configurations.find(function (x) { return x.id == sprintID });
        var viewModel = buildBasicViewModelFrom(configurations);
        viewModel.config = sprintConfiguration;
        renderTemplate(res, viewModel, settings.template);
    }

    //******** API */

    getSprintConfiguration(req, res){
        var sprintID = req.params.id;
        var configurations = provider.getAllConfigurations();
        var sprintConfiguration = configurations.find(function (x) { return x.id == sprintID });
        if (!sprintConfiguration)
            return res.status(404).send({'message': 'No configuration found for springID ' + sprintID});
        else
            return res.json(sprintConfiguration);
    }
    

    postSprintConfiguration(req, res){
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        var configurations = provider.getAllConfigurations();
        req.on('end', function () {
            var config = JSON.parse(body);
            var alreadyExistingConfig = configurations.find(function (x) { return x.name == config.name });

            if (alreadyExistingConfig) {
                res.writeHead(500, "Already existing");
                return res.end();
            }
            else {
                try{
                    provider.saveConfiguration(config);
                    res.writeHead(200, "Done");
                    return res.end();
                }catch(e){
                    console.log(error);
                    res.writeHead(500, "Internal Server Error. Details: " + JSON.stringify(error));
                    return res.end();
                }
            }
        });
    }

    putSprintConfiguration(req, res){
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        var configurations = provider.getAllConfigurations();
        req.on('end', function () {
            var config = JSON.parse(body);
            try{
                provider.saveConfiguration(config);
                    res.writeHead(200, "Done");
                    return res.end();
                }catch(e){
                    console.log(error);
                    res.writeHead(500, "Internal Server Error. Details: " + JSON.stringify(error));
                    return res.end();
                }
            });
    }

    getSprintData(req, res){
        var sprintID = req.params.id;
        try{
            var sprint = provider.getStatistics(sprintID);
            var stats = {
                'burndown': generateBurndown(sprint),
                'sprint': sprint
            };
            return res.json(stats);
        }catch(e){
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
    var configurations = provider.getAllConfigurations();
    configurations.forEach((conf) => {
        viewModel.sprints.push({id: conf.id, name: conf.name})
    });
    viewModel.has_sprints = viewModel.sprints.length > 0;
    return viewModel;
}
function renderTemplate(res, viewModel, templatePath){
    return generateTemplate(viewModel, templatePath, function (err, data) {
        if (err) {
            console.log(err);
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
    sprintData.days.forEach(sprintDay=>{
        remainingIdealEffort = remainingIdealEffort - sprintDay.idealEffort;
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
        var until = new Date(sprintDay.until);
        if (until <= now && stop != true){
            data.data2.push(remaining);
        }else{
            if (stop == false){
                data.data2.push(remaining);
                stop = true;
            }
        }
        
    });
    return data;
}





module.exports = SprintController;