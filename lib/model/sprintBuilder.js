var Sprint = require('./sprint');
var SprintDay = require('./sprintDay');
var SprintTask = require('./sprintTask');


class SprintBuilder {
	constructor() {
	}

	buildFrom(config){
		var sprint = new Sprint();
		sprint.name = config.name;
		sprint.id = config.id;
		sprint.configuration = config;
		var last = null;
		var timezone = this.getGMTString();
		sprint.configuration.days.forEach(element => {	
			if (element.include){
				var sprintDay = new SprintDay();
				sprintDay.label = element.day;
				sprintDay.idealEffort = 0;
				var isFirstDay = (last == null);
				if (isFirstDay){
					var stringDate = element.day + " 00:00 GMT" + timezone;
					sprintDay.from = new Date(stringDate);
					sprintDay.until = new Date(stringDate);
				}
				else{
					sprintDay.from = last;
					sprintDay.until = new Date(element.day + " " + sprint.configuration.dailyMeeting + " GMT" + timezone);
				}
				last = sprintDay.until;
				sprint.days.push(sprintDay);
			}
		});
		return sprint;
	}

	getGMTString(){
		var now = new Date();
		var offset = now.getTimezoneOffset();
		var hours = String(Math.floor(offset/60)).padStart(2,"0");		
		var minutes = String(offset%60).padStart(2,"0");
		var s = hours + minutes;
		var m = "+";
		if (offset > 0){
			m = "-";
		}
		return m + s;
	}
}

module.exports = SprintBuilder;