
var Twitter = require("./twitter");
var cfg = require("./cfg");

t = new Twitter();
// t.consumerKey = "qOiElBhJjyaAVihzuZ5Rhw";
// t.consumerSecret = "snJiuHL9Goip3t5Bomy19MZYprqqrOci08oD4A1ew";
// t.oAuthToken = "410058219-9QkchF8SRPQQjlRTeOD6pv7mucr08qbKYdupZbJa";
// t.oAuthTokenSecret = "ZVM41ZVnbPnxUcoYVUWddSqpeQgIWcGGR8m7803affjvP";

t.makeRequest("GET", "statuses", "user_timeline", {
	screen_name: "romanov4400"
}, function(err, data){
	console.log(data);
});
