# Enhanced Trello Burndown Chart 

Generate a burndown chart from trello cards.


## This project is inspired in [devtyr/trello-burndown](https://github.com/devtyr/trello-burndown "devtyr/trello-burndown") 

## How i came across the original project

Our team needed to display information radiators about how the sprint was going on. we wanted to show the burndown automatically in a big TV. We use real cards and board to keep the Sprint Board but we algo keep a digital version in Trello only with the Stories. One simple board with 2 lists: Pending and Done.
Because the original project had no activity for the past 2 years and had some bugs and missing features i started to redesign and refator the code.
The primary goal was to make it refresh automatically (ajax) and to refactor the design to be able to host it in the cloud. The original persisted all state (configuration and stats) in files localy in the filesystem; this was a issue to host it for example as an Azure Website (because they can reset your VM and you lose your changes) or as a docker container. 

### Why i decided to create a new repository and not to fork the original project?

I 've created a new repository because the original project had no activiy for the past 2 years. It seemed no good to fork it because there was no chance to merge it or make a pull request to the original apart from the fact that i had to refactor and redesign almost everything

## New Features

* Separation of rendering logic from Trello query and stats building (WebWorker aproach) - automatically checks Trello for the status of the boards
* Charts automatically refreshes (refresh operation as an AJAX call)
* Decoupled the persistanse logic - FactoryContainer and a kind of plugin design - Multiple providers (implemented local files and Azure DocumentDB) - You can code your own provider 
* Now cards moved out of the "Done" list become "unfinished" again

## Features inherited from the original project

* Generate burndown charts from Trello cards
* Support of multiple sprints
* Add sprints via website
* Edit sprints via website
* List of all sprints
* Templating


## How it works

If you use [Trello](http://trello.com "Trello") to manage your sprint cards, you might want to generate your burndown chart automatically instead of doing it manually.

### Preconditions

As a precondition you have to encode some information into the card's title. This looks like that:

	[p|est-e] title

If you are using the Chrome extension [Scrum for Trello](https://chrome.google.com/webstore/detail/scrum-for-trello/jdbcdblgjdpmfninkoogcfpnkjmndgje "Scrum for Trello") you can use the following notations:

	(est) title
	[e] (est) title

The first notation can be created using the extension and it is for estimates. They will be summarized. It is possible to omit the effort. The second case is with defined effective efforts. They will also be sumamrized by Scrum for Trello.

It is up to you to include the priority (sorting) into the title or not (if you are using the Scrum for Trello pattern). It is not needed by trello-burndown.

Here are some examples that are parsed exactly the same way and generating the same values:

    "   [1]   (2) title"
    "(2)[1]title"
    "   [ 1 ]   ( 2.0 ) title"

**Huh?**

* **p**: the priority/order of the task (to be "visible" if a task is moved to another list)
* **est**: the estimate of the task, defined within the sprint planning
* **e**: the real effort (to reflect this against the estimate)

# Setup the app

## Install dependencies

- [install node.js](http://nodejs.org/)
- install npm (if you're running node.js [v0.6.3](https://github.com/joyent/node/commit/b159c6) or newer it's already installed!)
- go to the sources directory
- run `npm install` (in package directory, no arguments): Install the dependencies in the local node_modules folder. By default, npm install will install all modules listed as dependencies in package.json.

## Configure settings.json

This file contains all the settings you need to setup for the app to access your trello boards 

The structure of the file is: 

```JSON
{
    "trelloInfo": {
        "applicationKey": "[YOUR_APP_KEY]",
        "userToken": "[YOUR_USER_TOKEN]",
        "boardId": "[YOUR_BOARD_ID]"
    },
    "port": 80,
    "template": "default_ajax.template",
    "home_template": "home.template",
    "html_title": "Burndown chart generator",
    "html_header": "Burndown for sprint ",
    "enableWorkers": true,
    "storage": {
        "provider": "local/fsProvider.js",
        "settings": { }
    }
}
```

For a basic setup the only thing you have to do is to obtain from Trello your

-applicationKey
-userToken
-and boardId

the other settings are optionals (you can leave the defaults): 

- "port": is the default port in which node.js will host the app
- "template": is the name of the template file for viewing the burndown graphs (will be searched in `templates` subfolder)
- "home_template": is the name of the template file for the main page
- "html_title": the html title of of the generated page
- "html_header": the html header of the generated page (H1)
- "enableWorkers": [true/false] whether or not to start the web-worker that connects to Trello to get the sprints information and create the statistics. If you do not start this you will not see any info.  You can disable it if you have another instance running only the worker separately from the web app.
- "storage": the storage provider implementation to use and the required settings for the provider. Right now you have 2 flavors available: local/fsProvider.js (persists everything locally in the filesystem) and azure/documentDBProvider.js (persists everything in Azure documentDB non-SQL storage). For more details on creating new providers or configuration of the existing ones, please take a look at the wiki documentation.

## Obtain a Trello info (applicationKey, userToken and boardId)

- First, log in to Trello and open [Generate API Keys](https://trello.com/app-key "Generate API Keys"). You will receive an key (the applicationKey) to use in the next step.
- Second, click the "Connect" button and follow the instructions OR make a call to 
https://trello.com/1/authorize?key=[YOUR_APP_KEY]&name=trello-burndown&expiration=never&response_type=token to grant access for this application. Be sure to replace `[YOUR_APP_KEY]` with the key received in the first step.
- Third, get the board ID of the board you want to use (this is the default board, you can then specify a different board ID when you create a new sprint if you want to use another one). If youd dont know your board ID you can get it from executing info.js or from the [Trello API Sandbox](https://developers.trello.com/sandbox) pressing the "Get Boards" button of the examples

> For further information visit: [Getting a Token from a User](https://trello.com/docs/gettingstarted/index.html#getting-a-token-from-a-user "Getting a Token from a User")

Store the key from the first action in the `applicationKey` setting of `settings.json`, token received from the second step in `userToken` and the board ID of the default board in `boardId`.

## Start the application !!

- start the web server use the command `node run.js`
- open a browser to `http://<server>:<port>` where `<server>` is your server's url or IP address, and `<port>` is the port you have configured in settings.json

### Sample

Here is a screenshot of a generated burndown chart (for a very bad sprint):

![Home Screen](http://i.imgur.com/kXLFm6Z.png "Home screen")

![Sample burndown chart](http://i.imgur.com/r0NPHaC.png "Sample burndown chart")

![Edit sprint](http://i.imgur.com/7Yi9jHG.png "Edit sprint")

### What if you do not like the existing templates (customization of the views)

The generated output can be customized by overriding the `default.template` or (even better) by creating and configuring a new template. Use [mustache 5](http://mustache.github.com/mustache.5.html "mustache 5") syntax for your templates.

This is what you will have available in your templates:

	{
		title: 'Trello burndown chart generator',
		header: 'Burndown for sprint ',
		sprint: '47',
		burndown: {
			data1: [
				{ x: 0, y: 20 }
			],
			data2: [
				{ x: 0, y: 20 }
			]
		},
		effortDaily: {
			data1: [
				{ x: 0, y: 20 }
			],
			data2: [
				{ x: 0, y: 20 }
			]
		},
		effortTotal: {
			data1: [
				{ x: 0, y: 20 }
			],
			data2: [
				{ x: 0, y: 20 }
			]
		},
		generationTime: Change date of sprint data file
	}


## Contributors

* [Julian Werba](https://github.com/jwerba "Julian Werba")

I'd like to mention the contributors from the original project (devtyr/trello-burndown):

* [Juri Strumpflohner](https://github.com/juristr "Juri Strumpflohner")
* [Alessio Basso](https://github.com/alexdown "Alessio Basso")
* [David Banham](https://github.com/davidbanham "David Banham")
* [Bart Kiers](https://github.com/bkiers "Bart Kiers")
* [Jeff Nuss](https://github.com/jeffnuss "Jeff Nuss")

