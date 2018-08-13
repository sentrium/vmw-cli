#!/usr/bin/env node
var fs = require('fs');
var request = require('request');
var ProgressBar = require('./node-progress.js');
var FileCookieStore = require('tough-cookie-filestore');
var md5File = require('md5-file');
var Session = require('./utils.js').session;
var myVmw = require('./getIndex.js');
var self = getFile.prototype;

// constructor
var filesDir;
var stateDir;
function getFile(opts) {
	// override ops Object.assign();
	self.request = request;
	this.cache = {};
	filesDir = __dirname;
	stateDir = __dirname;
	if(process.env.VMWFILESDIR) {
		filesDir = process.env.VMWFILESDIR;
	}
	if(process.env.VMWSTATEDIR) {
		stateDir = process.env.VMWSTATEDIR;
	}
}
module.exports = getFile;

// verify login credentials, session, and download fileName
self.get = async function(productGroup, fileName) {
	if(process.env.VMWUSER && process.env.VMWPASS) {
		var myvmw = new myVmw({
			'username': process.env.VMWUSER,
			'password': process.env.VMWPASS,
			'dir': stateDir
		});
		let indexSession = new Session(stateDir + '/index.json', 600, async function() {
			let file = this.file;
			await myvmw.login();
			let data = await myvmw.index(); // fold login logic into this
			fs.writeFileSync(file, JSON.stringify(data, null, "\t"), 'utf8'); // testing
			return data;
		});
		await indexSession.data();
		self.request = request.defaults({ // set request defaults
			'jar': request.jar(new FileCookieStore(stateDir + '/cookies.json'))
		});

		//data load?
		let index = require(stateDir + '/fileIndex.json');
		let fileNode = index[productGroup]['files'][fileName];

		//obtain fileNode
		let url = self.getUrl(fileNode);
		self.getDownload(url, fileNode.md5sum);
	} else {
		console.log('[ERROR]: environment variables $VMWUSER and $VMWPASS not set! Please configure');
	}
};

// build base and query string
self.buildUrl = function(base, query) {
	let string = base + '?';
	let token = '';
	Object.keys(query).map(function(val) {
		string += token + val + '=' + query[val];
		token = '&';
	});
	return string;
};

// construct download url
self.getUrl = function(fileNode) {
	console.log(JSON.stringify(fileNode, null, "\t"));
	let base = 'https://my.vmware.com/group/vmware/details';
	let dlgUrl = this.buildUrl(base, {
		'p_p_id': 'ProductDetailsPortlet_WAR_itdownloadsportlet',
		'p_p_lifecycle': 2,
		'p_p_resource_id': 'downloadFiles'
	});
	let keyList = [
		//'vmware',
		//'baseStr',
		//'tagId',
		//'productId',
		'downloadGroupCode',
		'downloadFileId',
		'hashKey',
		'uuId'
	];
	keyList.forEach((key, index) => {
		if(fileNode.download[key]) { // key exist and not empty
			dlgUrl += '&' + key + '=' + fileNode.download[key];
		}
	});
	return dlgUrl;
};

// request.GET direct file download url
self.getDownload = function(url, md5remote) {
	self.request.get({url}, function (error, response, body) {
		let file = JSON.parse(body);
		self.getFile(file.downloadUrl, filesDir + '/' + file.fileName).then((md5local) => {
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
		// get totalBytes and build progress bar
		let bar;
		let label = 0;
		let fileName;
		if(file === undefined) {
			file = /([^/]+)$/.exec(url)[1];
			fileName = file;
		} else {
			fileName = /([^/]+)$/.exec(file)[1];
		}
		let labels = [
			'KB',
			'MB',
			'GB'
		];
		self.request.get(url, {
			url: url,
			//gzip: true,
			encoding: null
		})
		.on('response', function(data) { // first response
			let totalBytes = parseInt(data.headers['content-length' ]);
			let total = parseInt(totalBytes / 1000 * 100) / 100;
			while(total > 50) {
				label++;
				total = parseInt(total / 1000 * 100) / 100;
			}
			bar = new ProgressBar('[' + fileName + '] downloading... [:bar] :percent :etas :Kbps KB/s :curr/' + self.pad(total) + ' ' + labels[label], {
				complete: '=',
				head: '>',
				incomplete: ' ',
				width: 50,
				renderThrottle: 500,
				total: totalBytes
			});
		})
		.on('data', function(chunk) { // per chunk
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
		.pipe(
			fs.createWriteStream(file)
			.on('finish', function(err) { // after file write
				//console.error('Performing local MD5 calculation [' + file + '] ...');
				resolve(md5File.sync(file));
			})
		);
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
