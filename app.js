
var Twitter = require("./twitter");
var cfg = require("./cfg");

twitterApi = new Twitter(cfg.auth);

twitterApi.makeRequest("GET", "statuses", "user_timeline", {
	screen_name: "romanov4400"
}, function(err, data){
	console.log(data);
});
