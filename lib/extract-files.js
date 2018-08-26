#!/usr/bin/env node
const cheerio = require('cheerio')
var self = extractFiles.prototype;

// constructor
function extractFiles(opts) {
	//this.options =  Object.assign({}, opts);
}
module.exports = extractFiles;

// remove unnecessary spaces/newlines/non-ascii
self.clean = function(string) {
	string = string.replace(/[\s]+/g, " ");
	string = string.replace(/>[ ]</g, "><");
	string = string.replace(/\&amp\;/g, "&");
	string = string.replace(/[^\x00-\x7F]/g, "");
	return string;
}

// construct product index
self.getFiles = function(body) {
	let node = self.findVersion(self.clean(body));
	return {
		'version': node.version,
		'productId': node.productId,
		'productDate': node.productDate,
		'productType': node.productType,
		'productName': node.productName,
		'files': self.findFiles(self.clean(body))
	};
}

// html string entered, versions returned
self.findVersion = function(string) {
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

// loop through file entries on current page
self.findFiles = function(body) {
	const $ = cheerio.load(body, {
		normalizeWhitespace: true,
		xmlMode: true
	});
	let newCache = {};
	$('table').children('tbody').children('tr').children('.filename').each(function(i, elem) {
		let string = $(this).html();
		let file = self.extractFile(string);
		if(file.md5sum) { // include only if md5sum detected
			newCache[file.fileName] = file;
		}
	});
	return newCache;
}

// build file parameters into consolidated data entry
self.extractFile = function(string) {
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
		download:	self.getDownload(string)
	};
	return file;
}

// determine and extract file download information
self.getDownload = function(string) {
	let file;
	var rgx = new RegExp('onclick="checkEulaAndPerform\\(([^\)]+)', 'g');
	if($result = rgx.exec(string)) {
		let test = $result[1].replace(/&apos;/g, "'");
		let fields = test.split(',');
		let $out = fields.map((item) => {
			item = item.replace(/^'/, "");
			item = item.replace(/'$/, "");
			return item;
		});
		file = {
			downloadGroupCode:	$out[0],
			downloadFileId:		$out[1],
			vmware:			'downloadBinary',
			baseStr:		$out[2],
			hashKey:		$out[3],
			tagId:			$out[4],
			productId:		$out[5],
			uuId:			$out[6]
		};
	}
	var rgx = new RegExp('onclick="getDownload\\(([^\)]+)', 'g');
	if($result = rgx.exec(string)) {
		let test = $result[1].replace(/&apos;/g, "'");
		let fields = test.split(',');
		let $out = fields.map((item) => {
			item = item.replace(/^'/, "");
			item = item.replace(/'$/, "");
			return item;
		});
		file = {
			downloadGroupCode:	$out[0],
			downloadFileId:		$out[1],
			vmware:			'downloadBinary',
			baseStr:		$out[2],
			hashKey:		$out[3],
			tagId:			$out[5],
			productId:		$out[6],
			uuId:			$out[7]
		};
	}
	if(file) {
		return file;
	} else {
		return 0;
	}
}
