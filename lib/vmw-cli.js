#!/usr/bin/env node
const args = process.argv;
var fs = require('fs');
var xtable = require('./xtable.js');
var getFile = require('./getFile.js');
const myVmw = require('./getIndex.js');
const getRepo = require('./getRepo.js');
const client = new getRepo();

// if called from shell
if(args[1].match(/vmw-cli/g)) {
	switch(args[2]) {
		case 'get':
			get(args[3]);
		break;
		case 'find':
			find(args[3]);
		break;
		case 'index':
			index(args[3]);
		break;
		default:
			console.log('No command specified [index, find, get]');
			// improve help output
	}
}

// find file and download first entry
function get(string) {
	if(string) {
	        filter(string).then((table) => {
			if(node = table.view[0]) { // download first entry only
				let downloader = new getFile({
					//dir: __dirname doesnt work
				});
				downloader.dir = __dirname; // incorporate into opts
				downloader.get(node.productGroup, node.fileName);
			} else {
				console.log('[ERROR] files matching [' + string + '] not found!');
			}
		});
	}
}

// iterate cache and build dataset
function parseData(data, name) {
	let result = [];
	for(let group in data) {
		let productId = data[group]['productId'];
		let productDate = data[group]['productDate'];
		let productType = data[group]['productType'];
		let productName = data[group]['productName'];
		let version = data[group]['version'];
		let solution = data[group]['solution'];
		for(let file in data[group]['files']) {
			let record = Object.assign({
				'productGroup':	group,
				'productId':	productId,
				'productType':	productType,
				'productName':	productName,
				'version':	version,
				'solution':	solution
			}, data[group]['files'][file]);
			result.push(record);
		}
	}
	return result;
}

function load() {
	return new Promise(function(resolve, reject) {
		/*let allGroups = {};
		fs.readdirSync('./index').forEach(function(file, index) {
			let rgxFilter = new RegExp('^group.*json$', 'g');
			if(m = rgxFilter.exec(file)) {
				allGroups = Object.assign(require('./index/' + file), allGroups);
			}
		});*/
		var stateDir = __dirname;
		if(process.env.VMWSTATEDIR) {
			stateDir = process.env.VMWSTATEDIR;
		}
		let dataDir = stateDir + '/allGroups.json';
		if(!fs.existsSync(dataDir)) {
			console.log('Index [allGroups.json] not found - downloading...');
			let url = 'https://raw.githubusercontent.com/apnex/myvmw2/master/index/allGroups.json';
			client.getFile(url).then((response) => {
				fs.writeFileSync(dataDir, response.body);
				resolve(JSON.parse(response.body));
			});
		} else {
			console.log('Index [allGroups.json] found - local load...');
			resolve(require(dataDir));
		}
	});
}

function find(string) {
	// build, filter and output table
	filter(string).then((table) => {
		let cols = [
			'solution',
			'productGroup',
			'productType',
			//'productName',
			'version',
			'fileName',
			'fileDate',
			'fileSize',
			'fileType'
		];
		table.out(cols);
		console.log('[ ' + table.view.length + '/' + table.data.length + ' ] entries - filter [ ' + table.filterString() + ' ]');
		console.log('Terminal size: ' + process.stdout.columns + 'x' + process.stdout.rows);
	});
}

function filter(string) {
	// load index and filter table
	return new Promise(function(resolve, reject) {
		load().then((data) => {
			let table = new xtable({
				data: parseData(data)
			});
			table.filter(buildFilter(string));
			resolve(table);
		});
	});
}

// force re-download index
function index() {
	console.log('Re-syncing index [allGroups.json] - downloading...');
	let url = 'https://raw.githubusercontent.com/apnex/myvmw2/master/index/allGroups.json';
	let dataDir = __dirname + '/allGroups.json';
	client.getFile(url).then((response) => {
		fs.writeFileSync(dataDir, response.body);
	});
}

// parse and construct filter object
function buildFilter(string) {
	let filters = [];
	var rgxFilter = new RegExp('([^,:]+):([^,:]*)', 'g');
	while(m = rgxFilter.exec(string)) {
		let val1 = m[1];
		let val2 = m[2];
		filters.push({
			field: val1,
			value: val2
		});
	}
	if(filters.length == 0) {
		if(!string) string = '';
		filters.push({
			field: 'fileName',
			value: string
		});
	}
	return filters;
}
