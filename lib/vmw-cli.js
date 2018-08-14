#!/usr/bin/env node
const args = process.argv;
var fs = require('fs');
var xtable = require('./xtable.js'); // view
var getFile = require('./getFile.js'); // download
const products = require('./getProduct.js'); // index
const client = new getFile();

// global dir settings
var filesDir = process.cwd();
var indexDir = __dirname;
var stateDir = __dirname;
if(process.env.VMWFILESDIR) {
	filesDir = process.env.VMWFILESDIR;
}
if(process.env.VMWINDEXDIR) {
	indexDir = process.env.VMWINDEXDIR;
}
if(process.env.VMWSTATEDIR) {
	stateDir = process.env.VMWSTATEDIR;
}

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
		case 'list':
			list(args[3]);
		break;
		default:
			console.log('No command specified [list, index, find, get]');
			// improve help output
	}
}

// list available solutions
function list(string) {
	loadMain().then((data) => {
		for(let item of Object.keys(data)) {
		        console.log(item);
		}
	});
}

// find file and download first entry
function get(string) {
	if(string) {
	        filter(string).then((table) => {
			if(node = table.view[0]) { // download first entry only
				let downloader = new getFile();
				downloader.dir = __dirname; // incorporate into opts
				downloader.get(node.productGroup, node.fileName);
			} else {
				console.log('[ERROR]: files matching [' + string + '] not found!');
			}
		});
	}
}

// iterate cache and build dataset
function parseGroup(solProd, solName, product) {
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

// load mainIndex.json
function loadMain() {
	return new Promise(function(resolve, reject) {
		if(fs.existsSync(indexDir + '/mainIndex.json')) {
			resolve(require(indexDir + '/mainIndex.json'));
		} else {
			let url = 'https://raw.githubusercontent.com/apnex/vmw-cli/master/mainIndex.json';
			client.getFile(url, indexDir + '/mainIndex.json').then((md5) => {
				resolve(require(indexDir + '/mainIndex.json'));
			});
		}
	});
}

// load fileIndex.json
function loadFile() {
	return new Promise(function(resolve, reject) {
		let result = [];
		if(fs.existsSync(indexDir + '/fileIndex.json')) {
			// load group and merge with solution name
			let fileIndex = require(indexDir + '/fileIndex.json');
			loadMain().then((main) => {
				console.log('Loading available solutions in [fileIndex.json] ...');
				for(let solName in main) {
					for(let solVer in main[solName]) {
						for(let solProd in main[solName][solVer]) {
							let product = parseGroup(solProd, solName, fileIndex[solProd]);
							result = result.concat(product);
						}
					}
				}
				fs.writeFileSync(stateDir + '/finalIndex.json', JSON.stringify(result, null, "\t"), 'utf8');
				resolve(result);
			});
		} else {
			console.log('[ERROR]: [fileIndex.json] not found, please perform "vmw-cli index" for a solution');
			resolve(result);
		}
	});
}

// build, filter and output table to stdout
function find(string) {
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
	// load files and filter table
	return new Promise(function(resolve, reject) {
		loadFile().then((data) => {
			let table = new xtable({
				data: data
			});
			table.filter(buildFilter(string));
			resolve(table);
		});
	});
}

// force re-download index
function index(string) {
	console.log('Updating [fileIndex.json] for all permitted downloads from [' + string + '] ...');
	products.getProduct(string).then(() => {
		//console.log('mooo finished');
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
