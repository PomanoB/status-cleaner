
var crypto = require('crypto');

var request = require('request');
var qs = require('querystring')

function Twitter()
{
	this.apiUrl = "https://api.twitter.com/";
	this.apiVersion = "1.1";

	this.consumerKey = "";
	this.consumerSecret = "";
	this.oAuthToken = "";
	this.oAuthTokenSecret = "";
}

Twitter.prototype.getOAuthParams = function(){
	return {
		oauth_consumer_key: this.consumerKey,
		oauth_nonce: Math.random().toString(16).slice(2),
		oauth_signature_method: 'HMAC-SHA1',
		oauth_timestamp: (Date.now()/1000 | 0),
		oauth_token: this.oAuthToken,
		oauth_version: '1.0'
	};
};

Twitter.prototype.makeSignature = function(method, url, oAuthParams, queryParams){
	var keys = [];
	var values = {};
	Object.keys(oAuthParams).forEach(function(el){
		var key = Twitter.escape(el);
		keys.push(key);
		values[key] = oAuthParams[el];
	});
	if (queryParams !== undefined)
	{
		Object.keys(queryParams).forEach(function(el){
			var key = Twitter.escape(el);
			keys.push(key);
			values[key] = queryParams[el];
		});
	}
	keys.sort();

	var paramsString = keys.map(function(key){
		return key + '=' + Twitter.escape(values[key]);
	}).join('&');

	var result = method.toUpperCase() + '&' + Twitter.escape(url) + '&' + Twitter.escape(paramsString);
	var key = Twitter.escape(this.consumerSecret) + '&' + Twitter.escape(this.oAuthTokenSecret);

	var hmac = crypto.createHmac('sha1', key);
	hmac.update(result);

	return hmac.digest("base64");
};

Twitter.prototype.makeAuthorizationHeader = function(oAuthParams){

	var result = "OAuth " + Object.keys(oAuthParams).map(function(key){
		return Twitter.escape(key) + '="' + Twitter.escape(oAuthParams[key]) + '"';
	}).join(', ');
	return result;
};

/**
 *
 * @param {string} type
 * @param {string} resource
 * @param {string} method
 * @param {Object=} params
 * @param {function=} callback
 */
Twitter.prototype.makeRequest = function(type, resource, method, params, callback)
{
	if (callback === undefined && typeof params === "function")
	{
		callback = params;
		params = undefined;
	}

	var options = {
		url: this.apiUrl + this.apiVersion + "/" + resource + "/" + method + ".json",
		method: type,
		json: true
	};
	if (params !== undefined)
		options.qs = params;

	var oAuthParams = this.getOAuthParams();
	var signature = this.makeSignature(type, options.url, oAuthParams, params);
	oAuthParams['oauth_signature'] = signature;
	var authorizationHeader = this.makeAuthorizationHeader(oAuthParams);
	options.headers = {
		Authorization: authorizationHeader
	};
	request(options, function(err, res, data){
		if (callback)
			callback(err, data);
	});
};

Twitter.escape = function(str){
	return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
		replace(/\)/g, '%29').replace(/\*/g, '%2A');
};

module.exports = Twitter;