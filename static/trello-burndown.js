function Sprint() {
	this.id = '';
	this.name = ko.observable('');
	this.boardId = ko.observable('');
	this.days = ko.observableArray([]);
	this.finishedList = ko.observable('');
	this.lists = ko.observableArray([]);
	this.dailyMeeting = ko.observable();

	this.clear = function() {
		this.name('');
		this.boardId('');
		this.days([]);
		this.finishedList('');
		this.lists([]);
		this.dailyMeeting();		
	}

	this.resetIncludes = function() {
		for (var i = 0; i < this.days().length; i++) {
			this.days()[i].include(false);
		}
	}
};

function SprintDayDefinition(data) {
	var self = this;
	self.day = ko.observable(data.day);
	self.isWorkDay = ko.observable(data.isWorkDay);
	self.includePlain = ko.observable(data.include);
	self.include = ko.computed({
		read: function() {
			return self.includePlain();
		},
		write: function(value) {
			self.includePlain(value);
			if (!value)
				self.isWorkDay(value);
		},
		scope: self
	});
}

function SprintViewModel() {
	// Data
	var self = this;
	self.sprint = new Sprint();
	self.currentList = ko.observable('');
	self.boardId = ko.observable('');
	self.message = ko.observable('');
	self.isErrorMessageVisible = ko.observable(false);
	self.isInfoMessageVisible = ko.observable(false);
	self.dateRangePlain = ko.observable('');
	self.dateRange = ko.computed({
		read: function() {
			return self.dateRangePlain();
		},
		write: function(value) {
			var splitted = value.split(' - ');
			var startDate = new Date(Date.parse(splitted[0]));
			var endDate = new Date(Date.parse(splitted[1]));

			if (startDate && endDate) {
				self.clearDays();

				var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
				var diffDays = Math.round(Math.abs((startDate.getTime() - endDate.getTime())/(oneDay))) + 1;

				var dateItems = '';
				for (var i = 0; i < diffDays; i++) {
					var currentDate = new Date(startDate);
					currentDate.setDate(startDate.getDate() + i);

					var isWorkDay = false;
					var include = false;
					if (i > 0 && i < (diffDays - 1) && currentDate.getDay() > 0 && currentDate.getDay() < 6) {
						isWorkDay = true;
					}
					if (currentDate.getDay() > 0 && currentDate.getDay() < 6) {
						include = true;
					}

					self.addSprintDay(currentDate.toString("yyyy-MM-dd"), isWorkDay, include);
				}
			}
		},
		owner: this
	});

	//bind for error message hide/show
	$(function(){
	    $("[data-hide]").on("click", function(){
	        //$(this).closest("." + $(this).attr("data-hide")).hide();
	        self.isErrorMessageVisible(false);
	    });
	});

	// Operations
	self.addSprint = function() {
		var dataToSend = ko.toJSON(self.sprint);
		dataToSend.dailyMeeting += ":00Z";
		$.ajax({
		  type: "POST",
		  url: "/api/sprints/configurations",
		  data: dataToSend,
		}).done(function( msg ) {
		  self.sprint.clear();
		  self.message('Added successfully.');
		  self.isInfoMessageVisible(true);
		}).fail(function(jqXHR, textStatus) {
			self.message(textStatus);
			self.isErrorMessageVisible(true);
		});
	};

	self.updateSprint = function() {		
		var dataToSend = ko.toJSON(self.sprint);
		console.log(self.sprint);
		dataToSend.dailyMeeting += ":00Z";
		$.ajax({
			type: "PUT",
			url: "/api/sprints/" + self.sprint.id + "/configuration",
			data: dataToSend,
		}).done(function(msg) {
			self.message("Updated successfully");
			self.isInfoMessageVisible(true);
		}).fail(function(jqXHR, textStatus) {
			self.message(textStatus);
			self.isErrorMessageVisible(true);
		});
	};

	self.getDateRange = function(data) {
		var retVal = '';
		if (data) {
			retVal = {
				startDate: new Date(Date.parse(data.days[0].day)),
				endDate: new Date(Date.parse(data.days[data.days.length - 1].day))
			};
		} else if (self.sprint && self.sprint.days().length) {
			retVal = {
				startDate: new Date(Date.parse(self.sprint.days()[0].day())),
				endDate: new Date(Date.parse(self.sprint.days()[self.sprint.days().length - 1].day()))
			};
		}
		return retVal;
	}

	self.loadSprint = function(id, callback) {
		$.ajax({
			type: "GET",
			url: "/api/sprints/" + id + "/configuration"
		}).done(function(msg) {
			var data = msg;
			callback(self.getDateRange(data));
			self.sprint.resetIncludes();
			self.sprint.name(data.name);
			self.sprint.boardId(data.boardId);
			self.sprint.finishedList(data.finishedList);
			self.sprint.id = data.id;
			if (data.dailyMeeting)
				self.sprint.dailyMeeting(data.dailyMeeting.substring(0,5));
			for (var i = 0; i < data.days.length; i++) {
				self.updateSprintDay(data.days[i].day, data.days[i].isWorkDay, data.days[i].include);
			}
			//call addSpringList during load only if there are lists to show
			if (data.lists.length>0 && data.lists[0].name != "") {
				for (var i = 0; i < data.lists.length; i++) {
					self.currentList(data.lists[i].name);
					self.addSprintList();
				}
			}

		}).fail(function(jqXHR, textStatus) {
			self.message("Sprint could not be loaded");
			self.isErrorMessageVisible(true);
		});
	};

	self.addSprintDay = function(date, isWorkDay, include) {
		if (!include) {
			isWorkDay = false;
		}
		self.sprint.days.push(new SprintDayDefinition({ day: date, isWorkDay: isWorkDay, include: include }));
	};

	self.updateSprintDay = function(date, isWorkDay, include) {
		if (!include) {
			isWorkDay = false;
		}
		for (var i = 0; i < self.sprint.days().length; i++) {
			if (self.sprint.days()[i].day() == date) {
				self.sprint.days()[i].isWorkDay(isWorkDay);
				self.sprint.days()[i].include(include);
			}
		}
	}

	self.clearDays = function() {
		self.sprint.days.removeAll();
	};

	self.addSprintList = function() {
		if (self.currentList() === undefined || self.currentList() == "") {
			self.isErrorMessageVisible(true);
			self.message("List name can't be empty!");
			return;
		}
		self.sprint.lists.push({ name: self.currentList() });
		self.currentList("");
	};

	self.removeSprintList = function(sprintList) {
		self.sprint.lists.remove(sprintList);
	};
};

var sprintViewModel = new SprintViewModel();
ko.applyBindings(sprintViewModel);
