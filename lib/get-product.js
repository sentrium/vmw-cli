#!/usr/bin/env node
var fs = require('fs');
const PQueue = require('p-queue');
const queue = new PQueue({concurrency: 16});
const timer = console.time('timer');
const extract = require('./extract-files.js');
var ef = new extract();
var self = getProduct.prototype;

// base parameters
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
var fileIndex = indexdir + '/fileIndex.json';

// constructor
function getProduct(opts) {
	self.request = opts.request;
	self.main = opts.main;
	self.file = opts.file;
}
module.exports = getProduct;

// main function - build product lists
self.getProduct = async function getProduct(name) {
	let fileData = {};
	if(fs.existsSync(fileIndex)) {
		fileData = require(fileIndex);
	}
	if(product = self.buildProduct(name, this.main)) {
		indexProduct(product, fileData);
		return queue.onIdle();
	} else {
		indexSolution(name, this.main, fileData);
		return queue.onIdle();
	}
}

self.buildProduct = function(name, main) { // turn into xcell dataset and addMap
	let result = [];
	Object.keys(main).forEach((s) => {
		Object.keys(main[s]).forEach((v) => {
			Object.keys(main[s][v]).forEach((p) => {
				if(p == name) {
					result.push({
						name: p,
						id: main[s][v][p]
					});
				}
			});
		});
	});
	if(result[0]) {
		return result[0];
	} else {
		return null;
	}
}

// construct product index
function indexSolution(name, main, fileData = {}) {
	console.log('Resolving files in solution [' + name + ']');
	if(main[name] !== undefined) { // get page
		for(let version in main[name]) { // break out into own function
			for(let group in main[name][version]) {
				let product = {
					name: group,
					id: main[name][version][group]
				}
				if(name == 'vmware-nsx-sd-wan') { // temp hack to fix broken velocloud links
					product['id'] = '673';
				}
				indexProduct(product, fileData, name);
			}
		}
	} else {
		console.log('Solution [' + name + '] not found! Please re-index...');
	}
	return queue.onIdle();
}

// construct product index
function indexProduct(p, fileData = {}, name = p.name) {
	if(fileData[p.name] === undefined) {
		let url = 'https://my.vmware.com/group/vmware/details?downloadGroup=' + p.name + '&productId=' + p.id;
		queue.add(() => {
			console.log('[FETCH]: ' + url);
			return self.request.get({url});
		}).then((data) => {
			fileData[p.name] = ef.getFiles(data);
			if(queue.size === 0 && queue.pending === 0) {
				queueIdle(fileData, name);
			}
		});
	} else {
		console.log('Product group already indexed, skipping... [' + p.name + ']');
	}
}

// merge group.json into fileIndex.json
function queueIdle(data, name) { // rework merge
	fs.writeFileSync(statedir + '/group.' + name + '.json', JSON.stringify(data, null, "\t"), 'utf8');
	console.log('Merging [' + name + '] into [fileIndex.json] ...');
	let indexData = {};
	fs.readdirSync(statedir).forEach(function(file, index) {
		let rgxFilter = new RegExp('^group.*json$', 'g');
		if(m = rgxFilter.exec(file)) {
			indexData = Object.assign(require(statedir + '/' + file), indexData);
		}
	});
	fs.writeFileSync(fileIndex, JSON.stringify(indexData, null, "\t"));
	console.timeEnd('timer');
}
