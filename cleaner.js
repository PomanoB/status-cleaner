
var async = require('async');
var log4js = require('log4js');

var logger = log4js.getLogger();

var Twitter = require("./twitter");

function StatusCleaner(options)
{
	options = options || {};
	var defOptions = {
		refreshInterval: 60,
		deleteWords: []
	};

	this.twitterApi_ = new Twitter(options.auth);

	this.userName = options.userName;
	this.processCount = options.processCount || 50;
	this.refreshInterval = options.refreshInterval || defOptions.refreshInterval;
	this.deleteWords = options.deleteWords || defOptions.deleteWords;

	this.timeoutId_ = 0;
	this.maxId_ = null;
	this.firstSinceId_ = null;
	this.sinceId_ = null;

	this.loadAndDeleteStatusesDelegate_ = this.loadAndDeleteStatuses.bind(this);
	this.processStatusesDelegate_ = this.processStatuses.bind(this);
}

StatusCleaner.prototype.setDeleteWords = function(words){
	this.deleteWords = words;
};

StatusCleaner.prototype.setInterval = function(interval){
	this.refreshInterval = interval;
};

StatusCleaner.prototype.start = function(){
	this.loadAndDeleteStatuses();
	this.timeoutId_ = setTimeout(this.loadAndDeleteStatusesDelegate_, this.refreshInterval * 1000);
};

StatusCleaner.prototype.loadAndDeleteStatuses = function(){

	logger.info("Start loading statuses");
	var queryParams = {
		screenName: this.userName,
		trimUser: 1,
		count: this.processCount
	};
	if (this.sinceId_ != null)
		queryParams.sinceId = this.sinceId_;
	else
	if (this.maxId_ != null)
		queryParams.maxId = this.maxId_;

	this.twitterApi_.loadUserTimeline(queryParams, this.processStatusesDelegate_);
};

StatusCleaner.prototype.processStatuses = function(err, data){
	if (!err)
	{
		if (data.length == 0 && this.maxId_ !== null && this.sinceId_ === null)
			this.sinceId_ = this.firstSinceId_;
		else
		{
			if (this.maxId_ === null)
				this.firstSinceId_ = data[0].id_str;

			var that = this;
			async.forEach(data, function(status, callback){
				that.maxId_ = status.id_str;
				that.processStatus(status, callback);
			}, function(err){
				if (err)
					logger.error("Error processing statuses!", err);
				else
					logger.info("Done processing statuses");
				setTimeout(this.loadAndDeleteStatusesDelegate_, this.refreshInterval);
			});
		}
	}
	else
	{
		logger.error("Error loading statuses!", err);
		setTimeout(this.loadAndDeleteStatusesDelegate_, this.refreshInterval);
	}
};

StatusCleaner.prototype.processStatus = function(status, callback){
	logger.info("Start processing status", status.id_str);
	if (this.deleteWords.some(function(){
		return Math.random() * 2 | 0;
	}))
	{
		logger.info("Status contain bad words", status.id_str);
	}
	callback(null);
};

module.exports = StatusCleaner;
