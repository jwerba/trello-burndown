
var SprintTask = require('./sprintTask');

class Sprint {
	constructor() {
		this.id = '';
		this.name = null;
		this.configuration = null;
		this.days = [];
		this.totalEffort = 0;
		this.lastUpdated = new Date();
		this.tasksDone = [];
		this.tasksRemaining = [];
	}
	
	add(tasks){
		var totalEffort = 0;
		tasks.forEach(task => {
			totalEffort+= task.effort;
			if (task.isDone){
				this.tasksDone.push(task);
			}else{
				this.tasksRemaining.push(task);
			}
		});
		this.totalEffort = totalEffort;
		var totalDays = this.days.length;
		var idealEffort = totalEffort / totalDays;
		this.days.forEach(day =>{
			day.idealEffort = idealEffort;
			this.tasksDone.forEach(task => {
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