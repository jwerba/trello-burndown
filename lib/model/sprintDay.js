var SprintTask = require('./sprintTask');

class SprintDay {
	constructor() {
		this.label = "";
		this.idealEffort = 0;
		this.from = null;
		this.until = null;
		this.tasksDone  = []; 
	}

	getEffortDone(){
		var totalEffort = 0;
		this.tasksDone.forEach(element => {
			if (element.isDone){
				totalEffort+= element.effort;
			}
		});
		return totalEffort;
	}
}

module.exports = SprintDay;