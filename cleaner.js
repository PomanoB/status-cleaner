
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
	this.refreshInterval = ((options.refreshInterval | 0) || defOptions.refreshInterval) * 1000;
	this.deleteWords = options.deleteWords || defOptions.deleteWords;

	this.timeoutId_ = 0;
	this.maxId_ = null;
	this.firstSinceId_ = null;
	this.sinceId_ = null;

	this.stopped = true;

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
	logger.info("System start");
	this.stopped = false;
	this.loadAndDeleteStatuses();
	this.timeoutId_ = setTimeout(this.loadAndDeleteStatusesDelegate_, this.refreshInterval * 1000);
};

StatusCleaner.prototype.stop = function(){
	logger.info("System stop");
	this.stopped = true;
	clearTimeout(this.timeoutId_);
};

StatusCleaner.prototype.loadAndDeleteStatuses = function(){
	if (this.stopped)
		return;
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
	if (this.stopped)
		return;
	if (!err)
	{
		logger.info("Loaded statuses count", data.length);
		if (data.length === 0 || (data.length === 1 && this.maxId_ == data[0].id_str))
		{
			logger.info("Reach end timeline, wait new statuses");
			if (this.firstSinceId_ !== null && this.sinceId_ === null)
				this.sinceId_ = this.firstSinceId_;

			this.timeoutId_ = setTimeout(this.loadAndDeleteStatusesDelegate_, this.refreshInterval);
		}
		else
		{
			if (this.firstSinceId_ === null)
				this.firstSinceId_ = data[0].id_str;
			else if (this.sinceId_ !== null)
				this.sinceId_ = data[0].id_str;
			var that = this;
			async.eachSeries(data, function(status, callback){
				if (that.maxId_ == status.id_str)
					return callback(null);
				that.maxId_ = status.id_str;
				that.processStatus(status, callback);
			}, function(err){
				if (err)
					logger.error("Error processing statuses!", err);
				else
					logger.info("Done processing statuses");

				this.timeoutId_ = setTimeout(that.loadAndDeleteStatusesDelegate_, that.refreshInterval);
			});
		}
	}
	else
	{
		logger.error("Error loading statuses!", err);
		this.timeoutId_ = setTimeout(this.loadAndDeleteStatusesDelegate_, this.refreshInterval);
	}
};

StatusCleaner.prototype.processStatus = function(status, callback){
	logger.info("Start processing status", status.id_str, status.text);
	if (this.deleteWords.some(function(word){
		return status.text.indexOf(word) !== -1;
	}))
	{
		logger.info("Status contain bad words, deleting", status.id_str);
		this.twitterApi_.destroyStatus(status.id_str, function(err){
			if (err)
				logger.error("Error deleting status", status.id_str, err);
			else
				logger.info("Status deleted!", status.id_str);
			callback(err);
		});
//		callback(null);
	}
	else
	{
		logger.info("Status clean", status.id_str);
		callback(null);
	}
};

module.exports = StatusCleaner;
