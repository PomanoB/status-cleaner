
var Twitter = require("./twitter");
var cfg = require("./cfg");

var StatusCleaner = require('./cleaner');


cleaner = new StatusCleaner({
	auth: cfg.auth,
	userName: cfg.userName,
	refreshInterval: 10
});

cleaner.start();


//twitterApi = new Twitter(cfg.auth);

//twitterApi.loadUserTimeline({
//	screenName: "romanov4400",
//	trimUser: 1,
//	count: 10,
////	sinceId: '401942133718155265',
//	maxId: '400607086272602113'
//}, function(err, data){
//	console.log(data);
//});
//
//
//twitterApi.makeRequest("POST", "statuses", "destroy/403390053667188737", {
//
//}, function(err, data){
//	console.log("E", err);
//	console.log("D", data);
//});