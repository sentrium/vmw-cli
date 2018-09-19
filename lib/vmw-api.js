#!/usr/bin/env node
const args = process.argv;
const getFile = require('./get-file.js');
const getProduct = require('./get-product.js');
const getIndex = require('./get-index.js');
const Session = require('./utils.js').session;
const fs = require('fs');

// global ENV settings
var username = process.env.VMWUSER;
var password = process.env.VMWPASS;
var filesdir = process.cwd();
var indexdir = __dirname;
var statedir = __dirname;
if(process.env.VMWFILESDIR) {
	filesdir = process.env.VMWFILESDIR;
}
if(process.env.VMWINDEXDIR) {
	indexdir = process.env.VMWINDEXDIR;
}
if(process.env.VMWSTATEDIR) {
	statedir = process.env.VMWSTATEDIR;
}
var mainIndex = indexdir + '/mainIndex.json';
var fileIndex = indexdir + '/fileIndex.json';
var finalIndex = statedir + '/finalIndex.json';
var cookieFile = statedir + '/cookies.json';
var myvmw = new getIndex({
	'username': username,
	'password': password,
	'dir': statedir
});

// constructor
function vmwApi(opts) {
	this.options =  Object.assign({}, opts);
}
module.exports = vmwApi;
var self = vmwApi.prototype;

// load mainIndex.json
self.loadMain = function() { // merge with session?
	return new Promise(function(resolve, reject) {
		if(fs.existsSync(mainIndex)) {
			resolve(require(mainIndex));
		} else {
			const request = require('request'); // see if this can be moved to get-file
			let client = new getFile({request});
			//let client = new getFile();
			let url = 'https://raw.githubusercontent.com/apnex/vmw-cli/master/mainIndex.json';
			client.getFile(url, mainIndex).then((md5) => {
				resolve(require(mainIndex));
			});
		}
        });
}

// load fileIndex.json and build finalIndex.json
self.loadFile = function() {
	return new Promise(function(resolve, reject) {
		let result = [];
		if(fs.existsSync(fileIndex)) {
			let files = require(fileIndex);
			self.loadMain().then((main) => {
				console.error('Loading available solutions in [fileIndex.json] ...');
				for(let solName in main) {
					let cache = {};
					for(let solVer in main[solName]) {
						for(let solProd in main[solName][solVer]) {
							cache[solProd] = 1; // dedupe entries per solution/product pair
						}
					}
					for(let solProd in cache) {
						result = result.concat(self.parseGroup(solProd, solName, files[solProd]));
					}
				}
				fs.writeFileSync(finalIndex, JSON.stringify(result, null, "\t"), 'utf8');
				resolve(result);
			});
		} else {
			console.log('[ERROR]: [fileIndex.json] not found, please perform "vmw-cli index" for a solution');
			resolve(result);
		}
	});
}

// iterate cache and build dataset
self.parseGroup = function(solProd, solName, product) {
	let result = [];
	if(product) {
		//console.log('SUCCESS group[' + solProd + '][' + solName + ']');
		let productId = product['productId'];
		let productDate = product['productDate'];
		let productType = product['productType'];
		let productName = product['productName'];
		let version = product['version'];
		let solution = solName;
		for(let file in product['files']) {
			let record = Object.assign({
				'productGroup':	solProd,
				'productId':	productId,
				'productType':	productType,
				'productName':	productName,
				'version':	version,
				'solution':	solution
			}, product['files'][file]);
			result.push(record);
		}
	} else {
		//console.log('FAIL group[' + solProd + '][' + solName + ']');
	}
	return result;
}

// build product index
self.getProduct = async function(string) {
	if(username && password) {
		self.loadMain().then((main) => { // wasting (main) load - pass into getProduct
			return self.login({
				username: username,
				password: password
			}).then(function(request) {
				let client = new getProduct({
					request,
					main
				});
				return client.getProduct(string);
			});
		});
	} else {
		console.log('[ERROR]: environment variables $VMWUSER and $VMWPASS not set! Please configure');
		return;
	}
}

// verify login credentials, session, and download fileName
self.login = async function(opts) {
	if(opts.username && opts.password) {
		let index = statedir + '/index.json';
		let indexSession = new Session(index, 600, async function() {
			let data = await myvmw.index();
			fs.writeFileSync(this.file, JSON.stringify(data, null, "\t"), 'utf8'); // testing
			return data;
		});
		await indexSession.data();
		self.request = myvmw.request;
		return myvmw.request;
		//return;
	} else {
		console.log('[ERROR]: environment variables $VMWUSER and $VMWPASS not set! Please configure');
		return;
	}
};

// verify login credentials, session, and download fileName
self.get = function(productGroup, fileName) {
	if(username && password) {
		self.login({username, password}).then(() => {
			let index = require(fileIndex);
			let fileNode = index[productGroup]['files'][fileName];
			if(fileNode.download) {
				let url = self.getUrl(fileNode);
				self.getDownload(url, fileNode.md5sum);
			} else {
				console.log('[ERROR]: Cannot download file [' + fileNode.fileName + '] insufficient permissions in account...');
			}
		});
	} else {
		console.log('[ERROR]: environment variables $VMWUSER and $VMWPASS not set! Please configure');
	}
};

// request GET direct file download url
self.getDownload = function(url, md5remote) {
	self.request.get({url}, function (error, response, body) {
		let file = JSON.parse(body);
		let client = new getFile({
			request: self.request
		});
		client.getFile(file.downloadUrl, filesdir + '/' + file.fileName).then((md5local) => {
			if(md5remote == md5local) {
				console.log('MD5 MATCH: local[ ' + md5local + ' ] remote [ ' + md5remote + ' ]');
			} else {
				console.log('MD5 FAIL!: local[ ' + md5local + ' ] remote [ ' + md5remote + ' ]');
			}
		});
	});
};

// construct download url
self.getUrl = function(fileNode) {
	console.log(JSON.stringify(fileNode, null, "\t"));
	let params = {};
	let keyList = [
		//'vmware',
		//'baseStr',
		//'tagId',
		//'productId',
		//'hashKey',
		'downloadGroupCode',
		'downloadFileId',
		'uuId'
	];
	keyList.forEach((key, index) => {
		if(fileNode.download[key]) { // key exist and not empty
			params[key] = fileNode.download[key];
		}
	});

	// testing
	params['hashKey'] = 1;

	let base = 'https://my.vmware.com/group/vmware/details';
	let dlgUrl = this.buildUrl(base, Object.assign({
		'p_p_id': 'ProductDetailsPortlet_WAR_itdownloadsportlet',
		'p_p_lifecycle': 2,
		'p_p_resource_id': 'downloadFiles'
	}, params));
	return dlgUrl;
};

// build base and query string
self.buildUrl = function(base, query) {
	let string = base + '?';
	let token = '';
	Object.keys(query).map(function(key) {
		string += token + key + '=' + query[key];
		token = '&';
	});
	return string;
};
