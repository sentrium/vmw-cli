#!/usr/bin/env node
const args = process.argv;
var fs = require('fs');
var xtable = require('./xtable.js');
var vmwFile = require('./getFile.js');
const myVmw = require('./vmwIndex.js');
const getNew = require('./getNew.js');
const client = new getNew();

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
			load(args[3]);
		break;
		default:
			console.log('No command specified [index, find, get]');
	}
}

// find file and download
function get(string) {
	if(string) {
		load().then((allGroups) => {
			let table = new xtable({
				data: parseData(allGroups)
			});
			table.filter(buildFilter(string));
			if(node = table.view[0]) { // download first entry only
				let downloader = new vmwFile();
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
			let node = data[group]['files'][file];
			let record = Object.assign({
				'productGroup':	group,
				'productId':	productId,
				'productType':	productType,
				'productName':	productName,
				'version':	version,
				'solution':	solution
			}, node);
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
		let dataDir = __dirname + '/allGroups.json';
		if(!fs.existsSync(dataDir)) {
			console.log('Index [allGroups.json] not found - downloading...');
			let url = 'https://raw.githubusercontent.com/apnex/myvmw2/master/index/allGroups.json';
			client.getFile(url).then((response) => {
				fs.writeFileSync(dataDir, response.body);
				resolve(JSON.parse(response.body));
			});
		} else {
			console.log('Index [allGroups.json] found - local load...');
			let allGroups = require(dataDir);
			resolve(allGroups);
		}
	});
}

function find(string) {
	// build, filter and output table
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

	//let allGroups = load();
	load().then((allGroups) => {
		let table = new xtable({
			data: parseData(allGroups),
			header: cols
		});
		table.filter(buildFilter(string));
		table.out(cols);
		let filterString = '';
		let comma = '';
		for(let filter of table.filters) {
			filterString += comma + filter.field + ':' + filter.value;
			comma = ',';
		}
		console.log('[ ' + table.view.length + '/' + table.data.length + ' ] entries - filter [ ' + filterString + ' ]');
		console.log('Terminal size: ' + process.stdout.columns + 'x' + process.stdout.rows);
	});
}

function index() {
	//use got to download allFiles
	// build, filter and output table
	let cols = [
		'solution',
		'productGroup',
		'productType'
	];
}

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
