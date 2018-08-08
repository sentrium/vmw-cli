#!/usr/bin/env node
var got = require('got');
var fs = require('fs');
var ProgressBar = require('./node-progress.js');
var self = getIndex.prototype;

// constructor
function getIndex(opts) {
	this.cache = {};
	this.dir = __dirname;
}
module.exports = getIndex;

self.getFile = async function(url) {
	let options = {
		encoding: null // to prevent toString() error
	};

	// build progress bar
	let response = await got.head(url, options);
	let label = 0;
	let labels = [
		'KB',
		'MB',
		'GB'
	];
	let totalBytes = response.headers['content-length'] * 1;
	let total = parseInt(totalBytes / 1000 * 100) / 100;
	while(label > 50) {
		label++;
		total = parseInt(total / 1000 * 100) / 100;
	}
	// work out bar format - time?
	let bar = new ProgressBar('[' + url + '] downloading... [:bar] :percent :etas :Kbps KB/s :curr/' + self.pad(total) + ' ' + labels[label], {
		complete: '=',
		head: '>',
		incomplete: ' ',
		width: 50,
		renderThrottle: 500,
		total: totalBytes
	});

	// make and return request promise
	return got(url)
	.on('downloadProgress', progress => {
		let rate = Math.round(bar.curr / ((new Date - bar.start) / 1000) / 1000);
		let chunk = progress.transferred - bar.curr;
		let current = bar.curr + chunk;
		for(let i = 0; i <= label; i++) {
			current = parseInt(current / 1000 * 100) / 100;
		}
		if(chunk) {
			bar.tick(chunk, {
				'Kbps': rate,
				'curr': self.pad(current)
			});
		}
	});
};

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
