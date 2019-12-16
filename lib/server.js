/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

var connect = require('connect');
var serveStatic = require('serve-static');
var url = require('url');
var qs = require('qs');
var path = require('path');
var main = connect();
var utils = require('./utils');
var mu = require('mu2-updated');
var Storage = require('./storage.js');

var provider = Storage.getInstance().getProvider();

mu.root = settings.templatePath;
main.use('/node_modules/xcharts/build/xcharts.min.js', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.js'), { 'Cache-Control': 'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : '' }));
main.use('/node_modules/xcharts/build/xcharts.min.css', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.css'), { 'Cache-Control': 'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : '' }));
main.use('/static', serveStatic(path.join(settings.root, 'static'), { maxAge: 86400000 * 365 }));




main.use('/', function (req, res, next) {
    provider.getAllConfigurations().then(function (data) {
        req.sprints = data;
        console.log("configuration is with me, calling next() ... ");
        next();
    }).catch(function (error) {
        console.log("Error: " + error);
        res.writeHead(500);
        return res.end();
    });
});

// parse queryString
main.use('/', function (req, res, next) {
    req.origUrl = req.url
    var parsed = url.parse(req.url);
    
    if (req.method === 'GET' && (/.+\/+$/).test(parsed.pathname)) {
        parsed.pathname = parsed.pathname.replace(/\/+$/, '');
        res.writeHead(301, {
            'Location': url.format(parsed)
        });
        return res.end();
    }
    
    req.query = qs.parse(parsed.query);
    
    return next();
});


//render view sprint
main.use('/', function (req, res, next) {
    console.log('render view sprint ' + req.url);
    if (req._parsedUrl.pathname === '/' && req.query && req.query.sprint) {
        var sprint = req.query.sprint;
        var configurations = req.sprints;
        
        provider.getStatistics(sprint).then(function (stats) {
            var sprintData = {
                basic: stats.statistics,
                extended: stats.extended
            };
            generateOutput(configurations, sprint, sprintData, function (err, data) {
                if (err) {
                    console.log(err);
                    return;
                }
                var headers = { 'Content-Type': 'text/html; charset=UTF-8', 'Content-Length': Buffer.byteLength(data) };
                res.writeHead(200, headers);
                return res.end(data);
            });

        }).catch(function (error) {
            console.log(error);
        });
    }
    else next();
});




//render main page
main.use('/', function (req, res, next) {
    console.log('render main page ' + req.url);
    if (!req.query.sprint && req.originalUrl === '/') {
        var configurations = req.sprints;
        var dataForTemplate = generateSprintInformation(configurations);
        generateTemplate(dataForTemplate, settings.homeTemplatePath, function (err, data) {
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
            
            next();
        });
    }
    else next();
});


function generateTemplate(dataForTemplate, templatePath, callback) {
    var templatedData = '';
    var stream = mu.compileAndRender(templatePath, dataForTemplate)
		.on('data', function (data) { templatedData += data.toString(); })
		.on('error', function (error) { callback(error); })
		.on('end', function () { callback(null, templatedData); })
}


main.use('/all', function (req, res, next) {
    console.log(req.originalUrl);
    var configurations = req.sprints;
    var templateData = generateSprintInformation(configurations);
    generateTemplate(templateData, settings.templatePath + path.sep + 'allsprints.template', function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end();
        }
        var headers = {
            'Content-Type': 'text/html; charset=UTF-8',
            'Content-Length': Buffer.byteLength(data)
        };
        
        res.writeHead(200, headers);
        return res.end(data);
    });
});

main.use('/manage/add', function (req, res, next) {
    if (req.method === "GET") {
        var configurations = req.sprints;
        var templateData = generateSprintInformation(configurations);
        generateTemplate(templateData, settings.templatePath + path.sep + 'addsprint.template', function (err, data) {
            if (err) {
                console.log(err);
                res.writeHead(500);
                return res.end();
            }
            var headers = {
                'Content-Type': 'text/html; charset=UTF-8',
                'Content-Length': Buffer.byteLength(data)
            };
            
            res.writeHead(200, headers);
            return res.end(data);
        });
    }
    next();
});

main.use('/manage/edit', function (req, res, next) {
    if (req.method === "GET" && !req.query.sprint) {
        var configurations = req.sprints;
        var templateData = generateSprintInformation(configurations);
        generateTemplate(templateData, settings.templatePath + path.sep + 'editallsprints.template', function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end();
            }
            var headers = {
                'Content-Type': 'text/html; charset=UTF-8',
                'Content-Length': Buffer.byteLength(data)
            };
            
            res.writeHead(200, headers);
            return res.end(data);
        });
    }
    
    next();
});

main.use('/manage/edit', function (req, res, next) {
    if (req.method === "GET" && req.query.sprint) {
        var configurations = req.sprints;
        var templateData = generateSprintInformation(configurations);
        generateTemplate(templateData, settings.templatePath + path.sep + 'editsprint.template', function (err, data) {
            if (err) {
                res.writeHead(500);
                res.end();
            }
            else {
                var headers = {
                    'Content-Type': 'text/html; charset=UTF-8',
                    'Content-Length': Buffer.byteLength(data)
                };
                
                res.writeHead(200, headers);
                res.end(data);
            }
        });
    }
    else {
        next();
    }
});


main.use('/api/sprint', function (req, res, next) {
    console.log(req.originalUrl);
    if (req.method === "GET" && req.query.sprint) {
        var configurations = req.sprints;
        
        var springConfig = configurations.find(function (x) { return x.name == req.query.sprint});
        var result = {
            finishedList: springConfig.finishedList,
            standupMeeting: springConfig.standupTime,
            boardId: springConfig.boardId,
            name: springConfig.name,
            dates: [],
            lists: []
        };
        
        var listsSplitted = springConfig.lists.split(',');
        for (var i = 0; i < listsSplitted.length; i++) {
            result.lists.push({ name: listsSplitted[i] });
        }
        
        for (var i = 0; i < springConfig.days.length; i++) {
            result.dates.push({ day: springConfig.days[i], isWorkDay: springConfig.resources[i] === '1' ? true : false, include: true });
        }
        
        res.writeHead(200);
        return res.end(JSON.stringify(result, null, 4));
    } else {
        res.writeHead(404);
        return res.end();
    }
})

main.use('/api/stats', function (req, res, next) {
    if (req.method === "GET" && req.query.sprint) {
        var sprint = req.query.sprint;
        provider.getStatistics(sprint).then(function (stats) {
            var sprintData = {
                basic: stats.statistics,
                extended: stats.extended,
                name: sprint
            };
            data = getStatsData(sprintData);
            
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify(data));

            res.end();

        }).catch(function (error) {
            console.log(error);
            res.writeHead(202);
            return res.end();
        });
      
    } else {
        res.writeHead(404);
        return res.end();
    }
})

main.use('/api/stats2', function (req, res, next) {
    if (req.method === "GET" && req.query.sprint) {
        var sprint = req.query.sprint;
        provider.getStatistics(sprint).then(function (stats) {
            var sprintData = {
                basic: stats.statistics,
                extended: stats.extended,
                name: sprint
            };
            data = getStatsData(sprintData);
            
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify(data));

            res.end();

        }).catch(function (error) {
            console.log(error);
            res.writeHead(202);
            return res.end();
        });
      
    } else {
        res.writeHead(404);
        return res.end();
    }
})


main.use('/manage/edit', function (req, res, next) {
    if (req.method == "PUT") {
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            var POST = JSON.parse(body);
            var config = getConfigFromJson(POST);
            Storage.getInstance().ensureID(config);
            provider.saveConfiguration(config).then(function () {
                res.writeHead(200);
                return res.end();
            }).catch(function (error) {
                console.log(error);
                res.writeHead(500, "Internal Server Error. Details: " + JSON.stringify(error));
                return res.end();
            });
        })
    }
});




main.use('/manage/add', function (req, res, next) {
    if (req.method === "POST") {
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            var POST = JSON.parse(body);
            var config = getConfigFromJson(POST);
            
            var configurations = req.sprints;
            var alreadyExistingConfig = configurations.find(function (x) { return x.name == req.query.sprint });

            if (alreadyExistingConfig) {
                res.writeHead(500, "Already existing");
                return res.end();
            }
            else {
                provider.saveConfiguration(config).then(function () {
                    res.writeHead(200, "Done");
                    return res.end();
                }).catch(function (error) {
                    console.log(error);
                    res.writeHead(500, "Internal Server Error. Details: " + JSON.stringify(error));
                    return res.end();
                });
            }
        });
    }
});

function getConfigFromJson(POST) {
    var config = {
        lists: '',
        days: [],
        resources: [],
        finishedList: POST.finishedList,
        standupTime: POST.standupMeeting,
        boardId: POST.boardId,
        name: POST.name
    };
    
    var dayIndex = 0;
    for (var i = 0; i < POST.dates.length; i++) {
        if (POST.dates[i].include) {
            config.days[dayIndex] = POST.dates[i].day;
            config.resources[dayIndex] = POST.dates[i].isWorkDay ? '1' : '0';
            dayIndex++;
        }
    }
    
    for (var i = 0; i < POST.lists.length; i++) {
        config.lists += POST.lists[i].name;
        if (i < (POST.lists.length - 1))
            config.lists += ',';
    }
    
    return config;
}

function generateSprintInformation(configurations) {
    var sprintInformation = {
        sprints : [],
        all_sprints : [],
        sprintConfigs : []
    };
    configurations.forEach(function (sprintConfig) {
        sprintInformation.sprints.push({ name: sprintConfig.id });
        sprintInformation.all_sprints.push({ name: sprintConfig.id });
        sprintInformation.sprintConfigs.push({ name: sprintConfig.id });
    });
    sprintInformation.title = settings.html_title;
    sprintInformation.has_sprints = sprintInformation.all_sprints.length > 0;
    return sprintInformation;
}

function getSprintConfig(configurations, sprintName){
    var sprintConfig = null;
    configurations.forEach(function (config) {
        if (config.name == sprintName){
            sprintConfig = config;
        }
    });
    return sprintConfig;
}


function generateOutput(configurations, sprintName, sprintData, callback) {
    var sprintConfig = getSprintConfig(configurations, sprintName);
    
    var dataForTemplate = {
        title: settings.html_title,
        header: settings.html_header,
        sprint: sprintName,
        burndown: generateBurndown(sprintData.basic),
        effortDaily: generateEffortDaily(sprintData.basic),
        effortTotal: generateEffortTotal(sprintData.basic),
        generationTime: sprintData.basic.date,  //todo: revisar que no toma este formato de fecha... antes tuilizaba el stat de read del file
        unfinishedItems: sprintData.extended.unfinishedItems,
        statisticsSummary: sprintData.extended.statisticsSummary
    };
    var dataForTemplate2 = {
        title: settings.html_title,
        //header: settings.html_header,
        sprint: sprintName,
        //burndown: generateBurndown(sprintData.basic),
        //effortDaily: generateEffortDaily(sprintData.basic),
        //effortTotal: generateEffortTotal(sprintData.basic),
        generationTime: sprintData.basic.date,  //todo: revisar que no toma este formato de fecha... antes tuilizaba el stat de read del file
        unfinishedItems: sprintData.extended.unfinishedItems,
        statisticsSummary: sprintData.extended.statisticsSummary
    };
    //var sprintInformation = generateSprintInformation(configurations);
    //dataForTemplate.sprints = sprintInformation.sprints;
    //dataForTemplate.sprintConfigs = sprintInformation.sprintConfigs;
    //dataForTemplate.has_sprints = sprintInformation.has_sprints;
    
    var templatedData = '';
    var stream = mu.compileAndRender(settings.sprintTemplatePath, dataForTemplate2)
		.on('data', function (data) { templatedData += data.toString(); })
		.on('error', function (error) { callback(error); })
		.on('end', function () {
        callback(null, templatedData);
    });
}


function getStatsData(sprintData) {
    var dataForTemplate = {
        sprint: sprintData.name,
        burndown: generateBurndown(sprintData.basic),
        effortDaily: generateEffortDaily(sprintData.basic),
        effortTotal: generateEffortTotal(sprintData.basic),
        generationTime: sprintData.basic.date,  //todo: revisar que no toma este formato de fecha... antes tuilizaba el stat de read del file
        unfinishedItems: sprintData.extended.unfinishedItems,
        statisticsSummary: sprintData.extended.statisticsSummary
    };
    return dataForTemplate;
}

function generateBurndown(sprintData) {
    var data = {
        data1: [],
        data2: []
    };
    for (var line = 0; line < sprintData.length; line++) {
        var lineData = sprintData[line];
        var idealRemaining = {
            x: parseInt(lineData.day),
            y: parseFloat(lineData.idealEstimate)
        };
        var remaining = {
            x: parseInt(lineData.day),
            y: parseFloat(lineData.openEstimate)
        }
        data.data1[line] = idealRemaining;
        var today = new Date();
        //if (new Date(lineData.date) <= today +1) {
            data.data2[line] = remaining;
        //}
    }
    return data;
}

function generateEffortDaily(sprintData) {
    var data = {
        data1: [],
        data2: []
    };
    for (var line = 0; line < sprintData.length; line++) {
        var lineData = sprintData[line];
        var newData1 = {
            x: parseInt(lineData.day),
            y: parseFloat(lineData.doneEstimate)
        };
        var newData2 = {
            x: parseInt(lineData.day),
            y: parseFloat(lineData.effort)
        };
        data.data1[line] = newData1;
        data.data2[line] = newData2;
    }
    return data;
}

function generateEffortTotal(sprintData) {
    var data = {
        data1: [],
        data2: []
    };
    for (var line = 0; line < sprintData.length; line++) {
        var lineData = sprintData[line];
        var newData1 = {
            x: parseInt(lineData.day),
            y: parseFloat((lineData.totalEstimate - lineData.openEstimate))
        };
        var newData2 = {
            x: parseInt(lineData.day),
            y: parseFloat(lineData.totalEffort)
        };
        data.data1[line] = newData1;
        data.data2[line] = newData2;
    }
    return data;
}

module.exports = main;


