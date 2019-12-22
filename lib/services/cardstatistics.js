/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

 var SprintTask = require('../model/sprintTask');


var CardStatistics = function() { }

CardStatistics.prototype.buildTasksFromCards = function (cards, finishLists) {
    var reg = /^\[(\d+)\|(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\]\s*(.*)$/;
    
    // ^                           # start of the input
    // (?=                         # start lookahead 1
    //     [^\[]*                  #     zero or more chars other than '['
    //     \[                      #     literal '['
    //     \s*(\d+(?:\.\d+)?)\s*   #     a number, added to match group 1
    //     ]                       #     literal ']'
    // )                           # end lookahead 1
    // (?=                         # start lookahead 2
    //     [^(]*                   #     zero or more chars other than '('
    //     \(                      #     literal '('
    //     \s*(\d+(?:\.\d+)?)\s*   #     a number, added to match group 2 
    //     \)                      #     literal ')'
    // )                           # end lookahead 2
    var reg_trelloscrum = /^(?=[^\[]*\[\s*(\d+(?:\.\d+)?)\s*])(?=[^(]*\(\s*(\d+(?:\.\d+)?)\s*\))(.*)$/;
    
    // (?=                         # start lookahead 1
    //     [^(]*                   #     zero or more chars other than '('
    //     \(                      #     literal '('
    //     \s*(\d+(?:\.\d+)?)\s*   #     a number, added to match group 1
    //     \)                      #     literal ')'
    // )                           # end lookahead 1
    var reg_trelloscrum_noEffort = /^(?=[^(]*\(\s*(\d+(?:\.\d+)?)\s*\))(.*)$/;
	//console.log(JSON.stringify(cards));
	
	var sprintTasks = [];

    for (var i = 0; i < cards.length; i++) {

        var card = cards[i];
        
        var title = card.name;
        var isTrelloScrumMatch = false;
        var isTrelloScrumNoEffortMatch = false;
        var matches = reg.exec(title);
        
        if (!matches) {
            matches = reg_trelloscrum.exec(title);
            if (matches) {
                isTrelloScrumMatch = true;
            }
        }
        
        if (!matches) {
            matches = reg_trelloscrum_noEffort.exec(title);
            if (matches) {
                isTrelloScrumNoEffortMatch = true;
            }
        }
		
		var estimate = 0;
        var effort = 0;
		var isCardFinished = false;
		var dateDone = null;

        if (matches && matches.length > 1) {

            if (isTrelloScrumMatch) {
                effort = parseFloat(matches[1]);
                estimate = parseFloat(matches[2]);
            } else if (isTrelloScrumNoEffortMatch) {
                estimate = parseFloat(matches[1]);
                effort = 0;
            } else {
                estimate = parseFloat(matches[2]);
                effort = parseFloat(matches[3]);
            }
			dateDone = getDateDone(card, finishLists);
			isCardFinished = dateDone != null;
		} else {
			console.log("Card '" + card.name + "' doesn't have a correct estimate specification.");
		}
		var task = new SprintTask(); 
		task.name = title;
		task.effort = estimate;
		task.isDone = isCardFinished;
		task.dateDone = dateDone;
		task.shortUrl = card.shortUrl;
		sprintTasks.push(task);
	}
	return sprintTasks;
}


CardStatistics.prototype.generate = function (cards, finishLists, dailyMeeting) {
    var data = {
        "estimate": 0,
        "estimatedone": 0,
        "efforttotal": 0,
        "cardsopen": 0,
        "cardsfinished": 0,
        "effort": [],
        "unfinishedItems": [],
        "finishedItems": []
	};
	
    var reg = /^\[(\d+)\|(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\]\s*(.*)$/;
    
    
    // ^                           # start of the input
    // (?=                         # start lookahead 1
    //     [^\[]*                  #     zero or more chars other than '['
    //     \[                      #     literal '['
    //     \s*(\d+(?:\.\d+)?)\s*   #     a number, added to match group 1
    //     ]                       #     literal ']'
    // )                           # end lookahead 1
    // (?=                         # start lookahead 2
    //     [^(]*                   #     zero or more chars other than '('
    //     \(                      #     literal '('
    //     \s*(\d+(?:\.\d+)?)\s*   #     a number, added to match group 2 
    //     \)                      #     literal ')'
    // )                           # end lookahead 2
    var reg_trelloscrum = /^(?=[^\[]*\[\s*(\d+(?:\.\d+)?)\s*])(?=[^(]*\(\s*(\d+(?:\.\d+)?)\s*\))(.*)$/;
    
    // (?=                         # start lookahead 1
    //     [^(]*                   #     zero or more chars other than '('
    //     \(                      #     literal '('
    //     \s*(\d+(?:\.\d+)?)\s*   #     a number, added to match group 1
    //     \)                      #     literal ')'
    // )                           # end lookahead 1
    var reg_trelloscrum_noEffort = /^(?=[^(]*\(\s*(\d+(?:\.\d+)?)\s*\))(.*)$/;
	//console.log(JSON.stringify(cards));
	
	var sprintTasks = [];

    for (var i = 0; i < cards.length; i++) {

        var card = cards[i];
        
        var title = card.name;
        var isTrelloScrumMatch = false;
        var isTrelloScrumNoEffortMatch = false;
        var matches = reg.exec(title);
        
        if (!matches) {
            matches = reg_trelloscrum.exec(title);
            if (matches) {
                isTrelloScrumMatch = true;
            }
        }
        
        if (!matches) {
            matches = reg_trelloscrum_noEffort.exec(title);
            if (matches) {
                isTrelloScrumNoEffortMatch = true;
            }
        }
		
		var estimate = 0;
        var effort = 0;
		var isCardFinished = false;
		var dateDone = null;

        if (matches && matches.length > 1) {

            if (isTrelloScrumMatch) {
                effort = parseFloat(matches[1]);
                estimate = parseFloat(matches[2]);
            } else if (isTrelloScrumNoEffortMatch) {
                estimate = parseFloat(matches[1]);
                effort = 0;
            } else {
                estimate = parseFloat(matches[2]);
                effort = parseFloat(matches[3]);
            }
			dateDone = getDateDone(card, finishLists);
			isCardFinished = dateDone != null;
			if (isCardFinished){
				var standup = !dailyMeeting ? dailyMeeting : new Date("1970-01-01T" + dailyMeeting);
				if (standup) {
					standup = new Date(0, 0, 0, standup.getHours(), standup.getMinutes(), 0);
				}
				var cleanDate = getRelatingDay(dateDone, standup);
				if (!data.effort.length) {
					data.effort[0] = { date: cleanDate, estimate: estimate, effort: effort };
				} else {
					var found = false;
					for (var idxEffort = 0; idxEffort < data.effort.length; idxEffort++) {
						if (Date.parse(data.effort[idxEffort].date) === Date.parse(cleanDate)) {
							data.effort[idxEffort].estimate += estimate;
							data.effort[idxEffort].effort += effort;
							found = true;
						}
					}
					if (!found) {
						data.effort[data.effort.length] = { date: cleanDate, estimate: estimate, effort: effort };
					}
				}
				data.efforttotal += effort;
				data.estimatedone += estimate;
			}
			
			if (isCardFinished) {
                data.cardsfinished += 1;
                console.log("FINISHED " + title + " estimate " + estimate + " effort " + effort);
                data.finishedItems.push(card);
			} else {
				data.cardsopen += 1;
				console.log("OPEN     " + title);

				data.unfinishedItems.push({ name: title, url: card.shortUrl });
			}

			data.estimate += estimate;
		} else {
			console.log("Card '" + card.name + "' doesn't have a correct estimate specification.");
		}
		var task = new SprintTask(); 
		task.name = title;
		task.effort = estimate;
		task.isDone = isCardFinished;
		task.dateDone = dateDone;
		task.shortUrl = card.shortUrl;
		sprintTasks.push(task);
	}
	return data;
}

function getDateDone(card, finishLists){
	var dateDone = null;
	if (card.actions) {
		//var actions = card.actions;
		var actions = [];
		for (var idxActions = 0; idxActions < card.actions.length; idxActions++) {
			if (card.actions[idxActions].data.listAfter && card.actions[idxActions].data.listBefore && card.actions[idxActions].data.old.idList && card.actions[idxActions].type == "updateCard") {
				actions.push(card.actions[idxActions]);
			}
		}
		if (actions.length > 0) {
			actions.sort(function (x, y) {
				xTicks = Date.parse(x.date);
				yTicks = Date.parse(y.date);
				if (xTicks < yTicks) return 1;
				else if (xTicks > yTicks) return -1;
				else if (xTicks === yTicks) return 0;
			});
			actions = [actions[0]];
		}
		for (var idxActions = 0; idxActions < actions.length; idxActions++) {
			if (actions[idxActions]) {
				movedToFinishList = actions[idxActions].data.listAfter 
					&& actions[idxActions].data.listBefore 
					&& (actions[idxActions].data.listBefore.name !== actions[idxActions].data.listAfter.name) 
					&& ((!finishLists.length && finishLists === actions[idxActions].data.listAfter.name) || finishLists.indexOf(actions[idxActions].data.listAfter.name) > -1);

				if (movedToFinishList) {
					dateDone = new Date(Date.parse(card.actions[idxActions].date));
					break;
				}
			}
		}
	}
	return dateDone;
}

function getRelatingDay(date, dailyMeeting) {
	if (dailyMeeting) {
		var standup = new Date(date.getFullYear(), date.getMonth(), date.getDate(), dailyMeeting.getHours(), dailyMeeting.getMinutes(), 0);

		if (Date.parse(date) <= Date.parse(standup)) {
			var returnDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
			returnDate = new Date(returnDate.setDate(returnDate.getDate() - 1));

			return returnDate;
		}
	}
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

CardStatistics.prototype.export = function(data, resources, days, name) {
	var statsData = [];
	var plannedDays = 10;//getPlannedDays(resources);
	
	var averageDayEffort = data.estimate / plannedDays;

	var plannedDaysCount = 0;
	var openEstimate = data.estimate;
	var totalEffort = 0;

	// find days with data for no work days
	var untrackedDays = getDateDataUntracked(days, data.effort);

	for (var i = 0; i < untrackedDays.length; i++) {
		var nearestDate = findNearestDate(untrackedDays[i].date, days);
		setDataDate(untrackedDays[i].date, data.effort, nearestDate);
	}

	// iterate regular days
	for (var date = 0; date < days.length; date++) {
		var dateToReceive = new Date (days[date]+ ' 00:00:00 GMT-0300'); //new Date(Date.parse(days[date])); FIX: How to parse string date into locale timezone
		var effortContent = getDateData(dateToReceive, data.effort);
		plannedDaysCount += Math.floor(resources[date]);

		if (!effortContent.length) {
			statsData[date] = { day: date, date: dateToReceive, totalEstimate: data.estimate, idealEstimate: data.estimate - (averageDayEffort * plannedDaysCount), openEstimate: openEstimate, doneEstimate: 0, effort: 0, totalEffort: totalEffort };
		}

		for (var effortItemIdx = 0; effortItemIdx < effortContent.length; effortItemIdx++) {
			totalEffort += effortContent[effortItemIdx].effort;
			openEstimate = openEstimate - effortContent[effortItemIdx].estimate;
			statsData[date] = { day: date, date: dateToReceive, totalEstimate: data.estimate, idealEstimate: data.estimate - (averageDayEffort * plannedDaysCount), openEstimate: openEstimate, doneEstimate: effortContent[effortItemIdx].estimate, effort: effortContent[effortItemIdx].effort, totalEffort: totalEffort };
		}
	}

	var extendedStatistics = {};
	extendedStatistics.unfinishedItems = data.unfinishedItems;
	extendedStatistics.statisticsSummary = {
		totalEstimate: data.estimate,
		openEstimate: data.estimate - data.estimatedone,
		effort: data.efforttotal
	};

	//var statsExportResult = saveJSON(statsData, name);
	//var statsExExportResult = saveJSONExtended(extendedStatistics, name);
    var stats = {
        name: name,
        statistics : statsData,
        extended : extendedStatistics,
    };

    return stats
}

function saveJSONExtended(data, name) {
    var obj = data;
    if (Object.prototype.toString.call(data) === '[object Array]') {
        var obj = {
            'id': name,
            'content': data
        };
    } else {
        obj.id = name;
    }
    extendedDao.addOrUpdateItem(obj, function () { console.log(' extendedDao addOrUpdateItem updated!! ' + name );});
}


CardStatistics.prototype.loadStatistics = function (callback) {
    console.log("CardStatistics.prototype.loadStatistics...");
    var statistics = {};
    if (!callback) return;
    console.log("calling exportsDao.getAll");
    exportsDao.getAll(function (exports, error) {
        if (error) {
            console.log("callback with errors. Details:" + error);
            callback(null, error);
        }
        statistics.exports = exports;
        console.log("calling extendedDao.getAll");
        extendedDao.getAll(function (extended, error) {
            if (error) {
                console.log("callback with errors. Details:" + error);
                callback(null, error);
            }
            statistics.extended = extended;
            console.log("CardStatistics.prototype.loadStatistics executed succesfully. Calling callback...");
            callback(statistics);
        });
    });
}



function saveJSON(data, name) {
    var obj = data;
    if (Object.prototype.toString.call(data) === '[object Array]') {
        var obj = {
            'id': name,
            'content': data
        };
    } else { 
        obj.id = name;
    }
    exportsDao.addOrUpdateItem(obj, function () { console.log('exportsDao addOrUpdateItem updated!! ' + name ); });
}

function getPlannedDays(resourceArray) {
	var plannedDays = 0;
	for (var i = 0; i < resourceArray.length; i++) {
		plannedDays += Math.floor(resourceArray[i]);
	}
	return plannedDays;
}

function getDateData(date, stats) {
	var result = [];

	var compareDate = Date.parse(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
	for (var i = 0; i < stats.length; i++) {
		var statsDate = Date.parse(new Date(stats[i].date.getFullYear(), stats[i].date.getMonth(), stats[i].date.getDate()));
		if (statsDate === compareDate) {
			result.push(stats[i]);
		}
	}
	return result;
}

function setDataDate(oldDate, stats, newDate) {
	var compareDate = Date.parse(new Date(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate()));
	for (var i = 0; i < stats.length; i++) {
		var statsDate = Date.parse(new Date(stats[i].date.getFullYear(), stats[i].date.getMonth(), stats[i].date.getDate()));
		if (statsDate === compareDate) {
			stats[i].date = newDate;
		}
	}
}

function getDateDataUntracked(days, stats) {
	var result = [];
	for (var i = 0; i < stats.length; i++) {
		var statsDate = Date.parse(new Date(stats[i].date.getFullYear(), stats[i].date.getMonth(), stats[i].date.getDate()));
		var found = false;
		for (var day = 0; day < days.length; day++) {
			var compareDate = new Date(Date.parse(days[day]));
			compareDate = Date.parse(new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate()));
			if (compareDate === statsDate)
			{
				found = true;
				break;
			}
		}
		if (!found)
			result.push(stats[i]);
	}
	return result;
}

function findNearestDate(date, days) {
	var orgDate = new Date(Date.parse(date));

	for (var day = 0; day < days.length; day++) {
		var compareDate = new Date(Date.parse(days[day]));
		compareDate = Date.parse(new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate()));

		orgNextDate = orgDate;
		orgNextDate.setDate(orgNextDate.getDate()+1);

		if (compareDate === compareDate)
			return orgNextDate;

		orgNextDate.setDate(orgNextDate.getDate()+1);

		if (compareDate === compareDate)
			return orgNextDate;

		orgNextDate.setDate(orgNextDate.getDate()-3);

		if (compareDate === compareDate)
			return orgNextDate;

		orgNextDate.setDate(orgNextDate.getDate()-1);

		if (compareDate === compareDate)
			return orgNextDate;
	}
	return null;
}

function getDateDataInternal(compareDate, stats) {
	for (var i = 0; i < stats.length; i++) {
		var statsDate = Date.parse(new Date(stats[i].date.getFullYear(), stats[i].date.getMonth(), stats[i].date.getDate()));
		if (statsDate === compareDate) {
			return stats[i];
		}
	}
	return null;
}

module.exports = CardStatistics;