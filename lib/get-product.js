#!/usr/bin/env node
var fs = require('fs');
var FileCookieStore = require('tough-cookie-filestore');
var Session = require('./utils.js').session;
//var myVmw = require('./get-index.js');
const getFile = require('./get-file.js');
const PQueue = require('p-queue');
const queue = new PQueue({concurrency: 16});
const timer = console.time('timer');
var self = getProduct.prototype;

// base parameters
let dir = __dirname
let baseVmw = "https://my.vmware.com/group/vmware";
let globalCache = {};
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
var final;

// constructor
function getProduct(opts) {
	//this.options =  Object.assign({}, opts);
	self.request = opts.request;
}
module.exports = getProduct;

// main function - build product lists
self.getProduct = async function getProduct(solution) {
	final = require(mainIndex); // move to a promise/session?
	return(startProduct(solution));
}

// construct product index
function startProduct(name) {
	let fileData = {};
	if(fs.existsSync(fileIndex)) {
		fileData = require(fileIndex);
	}
	console.log('Resolving files in solution [' + name + ']');
	if(final[name] !== undefined) { // get page
		for(let version in final[name]) { // break out into own function
			for(let group in final[name][version]) {
				if(fileData[group] === undefined)  {
					let productId = final[name][version][group];
					if(name == 'vmware-nsx-sd-wan') { // temp hack to fix broken velocloud links
						productId = '673';
					}
					let url = 'https://my.vmware.com/group/vmware/details?downloadGroup=' + group + '&productId=' + productId;
					queue.add(() => { // switch to got module maybe?
						console.log('[FETCH]: ' + url);
						return self.request.get({url});
					}).then((data) => {
						//fs.writeFileSync(dir + '/page.' + group + '.html', data, 'utf8');
						let node = findVersion(clean(data));
						if(fileData[group] === undefined) {
							fileData[group] = {
								'version': node.version,
								'productId': node.productId,
								'productDate': node.productDate,
								'productType': node.productType,
								'productName': node.productName,
								'files': findFiles(clean(data))
							};
						}
						if(queue.size === 0 && queue.pending === 0) {
							queueIdle(fileData, name);
						}
					});
				} else {
					console.log('Product group already indexed, skipping... [' + group + ']');
				}
			}
		}
	} else {
		console.log('Solution [' + name + '] not found! Please re-index...');
	}
	return queue.onIdle();
}

function queueIdle(data, name) {
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

function findGroups(body) {
	var rgx = new RegExp('downloadGroup=([-\.\_0-9a-zA-Z]+)(?:&productId=([0-9]+))?', 'g');
	let cache = {};
	while (m = rgx.exec(body)) {
		cache[m[1]] = m[2];
	}
	return cache;
}

// remove unnecessary spaces/newlines/non-ascii
function clean(string) {
	string = string.replace(/[\s]+/g, " ");
	string = string.replace(/>[ ]</g, "><");
	string = string.replace(/\&amp\;/g, "&");
	string = string.replace(/[^\x00-\x7F]/g, "");
	return string;
}

// html string entered, versions returned
function findVersion(string) {
	// attempt to find version in selected radio button
	var rgx = new RegExp('option value="([^"]+)" tagid="([0-9]+)" downloadGroupId="([-\.\_0-9a-zA-Z]+)" productId="([0-9]+)" selected="selected"', 'g');
	let version;
	if(m = rgx.exec(string)) {
		version = m[1];
	}

	// if radio button, find all versions, if not, get directly from table
	var cache = {};
	if(version) {
		var rgx = new RegExp('option value="([^"]+)" tagid="([0-9]+)" downloadGroupId="([-\.\_0-9a-zA-Z]+)" productId="([0-9]+)"', 'g');
		while(m = rgx.exec(string)) {
			cache[m[3]] = {
				"version": m[1],
				"product": m[4]
			};
		}
	} else {
		var rgx = new RegExp('<th>Version</th>.*?<td>([- \.0-9a-zA-Z]+)</td>', 'g');
		if(m = rgx.exec(string)) {
			version = m[1];
		}
	}

	// get product productName
	let productName;
	var rgx = new RegExp('<td class="productHeading" colspan=2>([- ()\.\_0-9a-zA-Z]+)</td>', 'g');
	if(m = rgx.exec(string)) {
		productName = m[1];
		productName = productName.replace(/^[ ]+/, "");
		productName = productName.replace(/[ ]+$/, "");
	}

	// get product productDate
	let productDate;
	var rgx = new RegExp('<th>Release Date</th>.*?([0-9]{4}-[0-9]{2}-[0-9]{2})', 'g');
	if(m = rgx.exec(string)) {
		productDate = m[1];
	}

	// get product productType
	let productType;
	var rgx = new RegExp('<th>Type</th>.*?<td>([ &\.A-Za-z0-9]+)</td>', 'g');
	if(m = rgx.exec(string)) {
		productType = m[1];
		productType = productType.replace(/^[ ]+/, "");
		productType = productType.replace(/[ ]+$/, "");
	}

	// get current productId
	let productId;
	var rgx = new RegExp('input type="hidden" id="productId" value="([0-9]+)"', 'g');
	if(m = rgx.exec(string)) {
		productId = m[1];
	}

	return {
		"version": version,
		"productId": productId,
		"productDate": productDate,
		"productType": productType,
		"productName": productName,
		"others": cache
	};
}

function findFiles(body) {
	const cheerio = require('cheerio')
	const $ = cheerio.load(body, {
		normalizeWhitespace: true,
		xmlMode: true
	});

	// loop through files on current page
	let newCache = {};
	$('table').children('tbody').children('tr').children('.filename').each(function(i, elem) {
		let string = $(this).html();
		let file = extractFile(string);
		if(file.md5sum) {
			newCache[file.fileName] = file;
		}
	});
	return newCache;
}

function extractFile(string) {
	// get fileName, fileSize, fileType
	let $name;
	let $fileSize;
	let $fileType;
	var rgxName = new RegExp('<div class="infoDownload"><strong>(.*?)<\/strong>', 'g');
	if($newName = rgxName.exec(string)) {
		$name = $newName[1];
	}
	var rgxSize = new RegExp('<span class="fileSize label">File size<\/span>: ([^<]+)<br', 'g');
	if($newSize = rgxSize.exec(string)) {
		$fileSize = $newSize[1];
	}
	var rgxType = new RegExp('<span class="fileType label">File type<\/span>: ([^<]+)<br', 'g');
	if($newType = rgxType.exec(string)) {
		$fileType = $newType[1];
	}

	// get fileName, releaseDate, buildNumber
	let $fileName;
	let $fileDate;
	let $buildNum;
	var rgx = new RegExp('<span class="fileNameHolder">[ ]*([^ ]+)[ ]*<\/span>', 'g');
	if($result = rgx.exec(string)) {
		$fileName = $result[1];
		if(!$fileType) {
			$fileType = $fileName.match(/([a-zA-Z]+)$/)[1];
		}
		$fileType = $fileType.replace(/^\./, "");
		$fileType = $fileType.toLowerCase();
	}
	var rgx = new RegExp('<span class="releaseDate label">Release Date<\/span>: ([^<]+)<br', 'g');
	if($result = rgx.exec(string)) {
		$fileDate = $result[1];
	}
	var rgx = new RegExp('<span class="build label">Build Number<\/span>: ([0-9]+)', 'g');
	if($result = rgx.exec(string)) {
		$buildNum = $result[1];
	}

	// get descr, md5sum, sha1sum, sha256sum
	let $descr;
	let $md5sum;
	let $sha1sum;
	let $sha256sum;
	var rgx = new RegExp('<div class="col2"><p>.*?<br>(.*)?<\/br><\/p>', 'g');
	if($result = rgx.exec(string)) {
		$descr = $result[1];
	}
	var rgx = new RegExp('<span class="MD5SUM label">MD5SUM.*?([0-9a-f]{32})', 'g');
	if($result = rgx.exec(string)) {
		$md5sum = $result[1];
	}
	var rgx = new RegExp('<span class="checksum1 label">SHA1SUM.*?([0-9a-f]{40})', 'g');
	if($result = rgx.exec(string)) {
		$sha1sum = $result[1];
	}
	var rgx = new RegExp('<span class="MD5SUM label">SHA256SUM.*?([0-9a-f]{64})', 'g');
	if($result = rgx.exec(string)) {
		$sha256sum = $result[1];
	}

	// add a check to filter out invalid files
	let file = {
		name:		$name,
		fileName:	$fileName,
		fileDate:	$fileDate,
		fileSize:	$fileSize,
		fileType:	$fileType,
		buildNum:	$buildNum,
		descr:		$descr,
		md5sum:		$md5sum,
		sha1sum:	$sha1sum,
		sha256sum:	$sha256sum,
		download:	getDownload(string)
	};
	return file;
}

function getDownload(string) {
	let file;
	var rgx = new RegExp('onclick="checkEulaAndPerform\\(([^\)]+)', 'g');
	if($result = rgx.exec(string)) {
		let test = $result[1].replace(/&apos;/g, "'");
		let fields = test.split(',');
		let newtest;
		let $out = [];
		for(let item of fields) {
			item = item.replace(/^'/, "");
			item = item.replace(/'$/, "");
			$out.push(item);
		}
		let $download = {
			downloadGroupCode:	$out[0],
			downloadFileId:		$out[1],
			vmware:			'downloadBinary',
			baseStr:		$out[2],
			hashKey:		$out[3],
			tagId:			$out[4],
			productId:		$out[5],
			uuId:			$out[6]
		};
		file = $download;
	}
	var rgx = new RegExp('onclick="getDownload\\(([^\)]+)', 'g');
	if($result = rgx.exec(string)) {
		let test = $result[1].replace(/&apos;/g, "'");
		let fields = test.split(',');
		let newtest;
		let $out = [];
		for(let item of fields) {
			item = item.replace(/^'/, "");
			item = item.replace(/'$/, "");
			$out.push(item);
		}
		let $download = {
			downloadGroupCode:	$out[0],
			downloadFileId:		$out[1],
			vmware:			'downloadBinary',
			baseStr:		$out[2],
			hashKey:		$out[3],
			tagId:			$out[5],
			productId:		$out[6],
			uuId:			$out[7]
		};
		file = $download;
	}
	if(file) {
		return file;
	} else {
		return 0;
	}
}
