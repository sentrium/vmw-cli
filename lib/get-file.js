#!/usr/bin/env node
var fs = require('fs');
var ProgressBar = require('progress');
var md5File = require('md5-file');
var self = getFile.prototype;

function getFile(opts) {
	self.request = opts.request;
}
module.exports = getFile;

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
			.on('finish', function(err) { // after file write - return local md5
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
