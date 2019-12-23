/*
 * Trello burndown chart generator
 *
 * Author: Julian Werba <julian.werba@gmail.com>
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

module.exports = CardStatistics;
