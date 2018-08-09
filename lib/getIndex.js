#!/usr/bin/env node
var fs = require('fs');
var FileCookieStore = require('tough-cookie-filestore');
var Session = require('./utils.js').session;
var rq = require('request');
var rp = require('request-promise');

/* set up client
var myvmw = new myVmw({
	'username': 'username',
	'password': 'password'
});
async function main() {
	let indexSession = new Session(dir + 'index.json', 600, async function() {
		let file = dir + 'index.json';
		if(fs.existsSync(file)) {
			fs.unlinkSync(file);
		}
		await myvmw.login();
		let data = await myvmw.index();
		fs.writeFileSync(file, JSON.stringify(data, null, "\t"), 'utf8'); // testing
		return data;
	});
	let test = await indexSession.data();
	// do something else
}
main();
*/

// myvmw constructor
function myVmw(opt) {
	let username = opt.username;
	let password = opt.password;
	let dir = opt.dir;
	this.login = async function() {
		if(fs.existsSync(dir + '/cookies.json')) {
			fs.unlinkSync(dir + '/cookies.json');
		}
		fs.writeFileSync(dir + '/cookies.json', '');
		var jar = rq.jar(new FileCookieStore(dir + '/cookies.json'));
		request = rp.defaults({
			'jar': jar
		});
		let url = 'https://my.vmware.com';
		console.log('Synching delicious cookies from [' + url + ']');
		return request.get({url}).then(function(data) { // add error handling?
			let url = 'https://my.vmware.com/oam/server/auth_cred_submit';
			console.log('Offering up afforementioned snacks as a sacrifice to [' + url + ']');
			let options = {
				url,
				followAllRedirects: true,
				headers: {
					'content-type': 'application/x-www-form-urlencoded'
				},
				form: {
					username: username,
					password: password,
					vmware: 'login'
				}
			};
			return request.post(options, function (data) {
				//console.log(JSON.stringify(this, null, "\t"));
			});
		})
	};
	this.index = async function() {
		var jar = rq.jar(new FileCookieStore(dir + '/cookies.json'));
		request = rp.defaults({
			'jar': jar
		});
		let base = 'https://my.vmware.com/group/vmware/downloads';
		var url = this.buildUrl(base, {
			'p_p_id': 'ProductIndexPortlet_WAR_itdownloadsportlet',
			'p_p_lifecycle': 2,
			'p_p_resource_id': 'productsAtoZ'
		});
		console.log('Pulling landing index.json [' + base + ']');
		// change to a promise that resolves to index
		return request.get({url}).then(function(data) {
			return JSON.parse(data);
		});
	};
	this.buildUrl = function(base, query) {
		let string = base + '?';
		let token = '';
		Object.keys(query).map(function(val) {
			string += token + val + '=' + query[val];
			token = '&';
		});
		return string;
	};
}

// assemble and export
module.exports = myVmw;
