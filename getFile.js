#!/usr/bin/env node
var fs = require('fs');
var request = require('request');
var ProgressBar = require('./node-progress.js');
var FileCookieStore = require('tough-cookie-filestore');
var md5File = require('md5-file');
var Session = require('./utils.js').session;
var myVmw = require('./vmwIndex.js');
var self = vmwFile.prototype;

// global parameters
//console.log('The value of USER is: ' + process.env.VMWUSER);
//console.log('The value of PASS is: ' + process.env.VMWPASS);
let myvmw = new myVmw({
	'username': process.env.VMWUSER,
	'password': process.env.VMWPASS
});

// constructor
function vmwFile($opts) {
	this.cache = {};
	this.dir = __dirname;
}
module.exports = vmwFile;

self.get = async function(productGroup, fileName) {
	let indexSession = new Session(this.dir + '/index.json', 600, async function() {
		let file = this.file;
		await myvmw.login();
		let data = await myvmw.index(); // fold login logic into this
		fs.writeFileSync(file, JSON.stringify(data, null, "\t"), 'utf8'); // testing
		return data;
	});
	await indexSession.data();
	self.request = request.defaults({ // set request defaults
		'jar': request.jar(new FileCookieStore(this.dir + '/cookies.json'))
	});

	let index = require(this.dir + '/allGroups.json');
	let fileNode = index[productGroup]['files'][fileName];
	let url = self.buildUrl(fileNode);
	self.getDownload(url, fileNode.md5sum);
};

// construct download url
self.buildUrl = function(fileNode) {
	console.log(JSON.stringify(fileNode, null, "\t"));

	// build download url
	// adjust to params
	let baseHost = 'https://my.vmware.com';
	let baseUrl = baseHost + '/group/vmware/details?p_p_id=ProductDetailsPortlet_WAR_itdownloadsportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=downloadFiles&p_p_cacheability=cacheLevelPage&p_p_col_id=column-6&p_p_col_count=1';
	let dlgUrl = baseUrl;
	for(let key of Object.keys(fileNode.download)) {
		if(!fileNode.download[key]) {
			//console.log('SKIP blank key: ' + key);
		} else {
			dlgUrl += '&' + key + '=' + fileNode.download[key];
		}
	}
	//console.log(dlgUrl);
	return dlgUrl;
};

// request.GET direct file download url
self.getDownload = function(url, md5sum) {
	self.request.get({url}, function (error, response, body) {
		self.getFile(JSON.parse(body), md5sum);
	});
};

self.FormatNumberLength = function(num, length) {
	var r = "" + num;
	while(r.length < length) {
		r = "0" + r;
	}
	return r;
};

self.getFile = function(file, md5sum) {
	let options = {
		gzip: true,
		encoding: null, // to prevent toString() error
		url: file.downloadUrl
	};
	let req = self.request.get(options, function (error, response, body) {
		// error handling?
	});

	// get totalBytes and build progress bar
	let bar;
	let label = 0;
	let labels = [
		'KB',
		'MB',
		'GB'
	]
	req.on('response', function (data) {
		let totalBytes = parseInt(data.headers['content-length' ]);
		let total = parseInt(totalBytes / 1000 * 100) / 100;
		while(total > 50) {
			label++;
			total = parseInt(total / 1000 * 100) / 100;
		}
		bar = new ProgressBar('[' + file.fileName + '] downloading... [:bar] :percent :etas :Kbps KB/s :curr/' + self.pad(total) + ' ' + labels[label], {
			complete: '=',
			head: '>',
			incomplete: ' ',
			width: 50,
			renderThrottle: 500,
			total: totalBytes
		});
	});
	req.on('data', function (chunk) {
		let rate = Math.round(bar.curr / ((new Date - bar.start) / 1000) / 1000);
		let current = bar.curr + chunk.length;
		for(let i = 0; i <= label; i++) {
			current = parseInt(current / 1000 * 100) / 100;
		}
		bar.tick(chunk.length, {
			'Kbps': rate,
			'curr': self.pad(current)
		});
	})
	.pipe(fs.createWriteStream(file.fileName))
	.on('close', function (err) {
		const local = md5File.sync(file.fileName)
		if(local == md5sum) {
			console.log('MD5 MATCH: local[ ' + local + ' ] remote [ ' + md5sum + ' ]');
		} else {
			console.log('MD5 FAIL!: local[ ' + local + ' ] remote [ ' + md5sum + ' ]');
		}
	});
};

self.pad = function(num) {
	let rgx = /^([^.]+)\.([^.]+)/g
	if(m = rgx.exec(num.toFixed(2).toString())) {
		let left = m[1];
		if(left.length < 2) {
			left = ('00' + left).slice(-2);
		}
		return left + '.' + m[2];
	}
};

self.clean = function(string) { // remove unnecessary spaces/newlines
	string = string.replace(/[\s]+/g, " ");
	string = string.replace(/>[ ]</g, "><");
	return string;
};
