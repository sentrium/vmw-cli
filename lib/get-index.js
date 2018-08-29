#!/usr/bin/env node
var fs = require('fs');
var FileCookieStore = require('tough-cookie-filestore');
var Session = require('./utils.js').session;
var rq = require('request');
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
	self.request = rq.defaults({
		'jar': rq.jar(new FileCookieStore(self.cookie))
	});
}
module.exports = myVmw;

// login to my.vmware.com and generate cookies.txt
self.login = function() {
	return new Promise(function(resolve, reject) {
		let url = 'https://my.vmware.com';
		console.log('Synching delicious cookies from [' + url + ']');
		self.request.get({url}, (err, resp, data) => {
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
			self.request.post(options, (err, resp, data) => {
				resolve();
			});
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
			self.request.get({url}, (err, resp, data) => {
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
