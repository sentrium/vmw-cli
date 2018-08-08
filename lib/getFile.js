#!/usr/bin/env node
var fs = require('fs');
var request = require('request');
var ProgressBar = require('./node-progress.js');
var FileCookieStore = require('tough-cookie-filestore');
var md5File = require('md5-file');
var Session = require('./utils.js').session;
var myVmw = require('./getIndex.js');
var self = buildFile.prototype;

// constructor
function buildFile(opts) {
	this.cache = {};
	this.dir = __dirname;
}
module.exports = buildFile;

// verify login credentials, session, and download fileName
self.get = async function(productGroup, fileName) {
	if(process.env.VMWUSER && process.env.VMWPASS) {
		var myvmw = new myVmw({
			'username': process.env.VMWUSER,
			'password': process.env.VMWPASS
		});
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

		//data load?
		let index = require(this.dir + '/allGroups.json');
		let fileNode = index[productGroup]['files'][fileName];

		//obtain fileNode
		let url = self.buildUrl(fileNode);
		self.getDownload(url, fileNode.md5sum);
	} else {
		console.log('[ERROR]: environment variables $VMWUSER and $VMWPASS not set! Please configure.');
	}
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
self.getDownload = function(url, md5remote) {
	self.request.get({url}, function (error, response, body) {
		let file = JSON.parse(body);
		self.getFile(file.downloadUrl, file.fileName).then((md5local) => {
			if(md5remote == md5local) {
				console.log('MD5 MATCH: local[ ' + md5local + ' ] remote [ ' + md5remote + ' ]');
			} else {
				console.log('MD5 FAIL!: local[ ' + md5local + ' ] remote [ ' + md5remote + ' ]');
			}
		});
	});
};

// stream file to disk with progress
self.getFile = function(url, file) {
	return new Promise(function(resolve, reject) {
		let options = {
			gzip: true,
			encoding: null, // to prevent toString() error
			url: url
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
		req.on('response', function(data) {
			let totalBytes = parseInt(data.headers['content-length' ]);
			let total = parseInt(totalBytes / 1000 * 100) / 100;
			while(total > 50) {
				label++;
				total = parseInt(total / 1000 * 100) / 100;
			}
			bar = new ProgressBar('[' + file + '] downloading... [:bar] :percent :etas :Kbps KB/s :curr/' + self.pad(total) + ' ' + labels[label], {
				complete: '=',
				head: '>',
				incomplete: ' ',
				width: 50,
				renderThrottle: 500,
				total: totalBytes
			});
		});
		req.on('data', function(chunk) {
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
		.pipe(fs.createWriteStream(file))
		.on('close', function(err) {
			resolve(md5File.sync(file));
		});
	});
};

// pad/truncate zeros to left and right of number
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
