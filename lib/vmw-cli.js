#!/usr/bin/env node
const args = process.argv;
const xtable = require('./xtable.js'); // view
const vmwApi = require('./vmw-api.js'); // login, getFiles, build downloadURL, indexing
let client = new vmwApi();

/* Module Purpose
To provide a cli interface for the vmw-api module.
To parse stdin input from user, structure syntac and execute api calls in valid format.
To cleanly display output to user via stdout
To perform any view specific data transforms
*/

// called from shell
if(args[1].match(/vmw-cli/g)) {
	switch(args[2]) {
		case 'get':
			get(args[3]);
		break;
		case 'find':
			find(args[3]);
		break;
		case 'json':
			json(args[3]);
		break;
		case 'index':
			index(args[3]);
		break;
		case 'list':
			list(args[3]);
		break;
		default:
			console.log('No command specified [list, index, find, get, json]');
			// improve help output
	}
}

// list available solutions
function list(string) {
	client.loadMain().then((data) => {
		for(let item of Object.keys(data)) {
		        console.log(item);
		}
	});
}

// find file and download first entry only
function get(string) {
	if(string) {
		filter(string).then((table) => {
			if(node = table.view[0]) {
				client.get(node.productGroup, node.fileName);
			} else {
				console.log('[ERROR]: files matching [' + string + '] not found!');
			}
		});
	}
}

// find file and output json
function json(string) {
	if(string) {
		filter(string).then((table) => {
			if(node = table.view[0]) {
				console.log(JSON.stringify(node, null, "\t"));
			} else {
				console.log('[ERROR]: files matching [' + string + '] not found!');
			}
		});
	}
}

// build, filter and output table to stdout
function find(string) {
	filter(string).then((table) => {
		table.out([
			'solution',
			'productGroup',
			'productType',
			//'productName',
			'version',
			'fileName',
			'fileDate',
			'fileSize',
			'fileType',
			'download'
		]);
		console.log('[ ' + table.view.length + '/' + table.data.length + ' ] entries - filter [ ' + table.filterString() + ' ]');
		//console.log('Terminal size: ' + process.stdout.columns + 'x' + process.stdout.rows);
	});
}

// load files and filter table
function filter(string) {
	return new Promise(function(resolve, reject) {
		client.loadFile().then((data) => {
			let table = new xtable({data});
			table.addMap('download', function(item) {
				if(typeof(item) === 'object') {
					return 'yes';
				} else {
					return 'no';
				}
			});
			table.filter(buildFilter(string));
			resolve(table);
		});
	});
}

// force re-download index
function index(string) {
	if(string) {
		console.log('Updating [fileIndex.json] for all permitted downloads in [' + string + '] ...');
		client.getProduct(string).then(() => {
			//console.log('mooo finished');
		});
	} else {
		console.log('[ERROR]: [solution] not specified, please perform "vmw-cli list" to display available solutions');
	}
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
