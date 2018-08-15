#!/usr/bin/env node
var fs = require('fs');
var FileCookieStore = require('tough-cookie-filestore');
var Session = require('./utils.js').session;
var rq = require('request');
var rp = require('request-promise');
var self = myVmw.prototype;

// myvmw constructor
function myVmw(opt) {
	self.username = opt.username;
	self.password = opt.password;
	self.dir = opt.dir;
	self.cookie = opt.dir + '/cookies.json';
	if(!fs.existsSync(self.cookie)) {
		fs.writeFileSync(self.cookie, '');
	}
	self.request = rp.defaults({
		'jar': rq.jar(new FileCookieStore(self.cookie))
	});
}
module.exports = myVmw;

// login to my.vmware.com and generate cookies.txt
self.login = async function() {
	let url = 'https://my.vmware.com';
	console.log('Synching delicious cookies from [' + url + ']');
	return self.request.get({url}).then(function(data) { // add error handling?
		let url = 'https://my.vmware.com/oam/server/auth_cred_submit';
		console.log('Offering up afforementioned snacks as a sacrifice to [' + url + ']');
		let options = {
			url,
			followAllRedirects: true,
			headers: {
				'content-type': 'application/x-www-form-urlencoded'
			},
			form: {
				username: self.username,
				password: self.password,
				vmware: 'login'
			}
		};
		return self.request.post(options, function (data) {
			//console.log(JSON.stringify(this, null, "\t"));
		});
	});
};

// login and construct index;
self.index = function() { // compare promise vs async
	return new Promise(function(resolve, reject) {
		self.login().then(function() {
			let base = 'https://my.vmware.com/group/vmware/downloads';
			var url = self.buildUrl(base, {
				'p_p_id': 'ProductIndexPortlet_WAR_itdownloadsportlet',
				'p_p_lifecycle': 2,
				'p_p_resource_id': 'productsAtoZ'
			});
			console.log('Pulling landing index.json [' + base + ']');
			self.request.get({url}).then(function(data) {
				resolve(JSON.parse(data))
			});
		});
	});
};

// handle url query strings - move to utils?
self.buildUrl = function(base, query) {
	let string = base + '?';
	let token = '';
	Object.keys(query).map(function(key) {
		string += token + key + '=' + query[key];
		token = '&';
	});
	return string;
};
