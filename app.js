
var Twitter = require("./twitter");
var cfg = require("./cfg");

var StatusCleaner = require('./cleaner');

cleaner = new StatusCleaner({
	auth: cfg.auth,
	userName: cfg.userName,
	refreshInterval: 30,
	processCount: 100,
	deleteWords: cfg.deleteWord
});

cleaner.start();
