
var SprintTask = require('./sprintTask');

class Sprint {
	constructor() {
		this.name = null;
		this.configuration = null;
		this.days = [];
	}
	

	add(tasks){
		var totalEffort = 0;
		tasks.forEach(task => {
			totalEffort+= task.effort;
		});
		var totalDays = this.days.length;
		var idealEffort = totalEffort / totalDays;
		this.days.forEach(day =>{
			day.idealEffort = idealEffort;
			tasks.forEach(task => {
				if (task.isDone){
					if (task.dateDone > day.from && task.dateDone<=day.until){
						day.tasksDone.push(task);
					}
				}
			});
		});
	}
}

module.exports = Sprint;