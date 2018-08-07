#!/usr/bin/env node
var fs = require('fs');

// session constructor
function Session(file, duration, callback) {
	this.file = file;
	this.sessionFile = file + '.session';
	this.duration = duration || 600;
	this.payload = {};
	this.reset = function() {
		if(fs.existsSync(this.sessionFile)) {
			fs.unlinkSync(this.sessionFile);
		}
		if(fs.existsSync(this.file)) {
			fs.unlinkSync(this.file);
		}
		fs.writeFileSync(this.sessionFile, '1', 'utf8');
	};
	this.expire = callback || function() {
		this.payload = {};
		return this.payload;
	};
	this.data = async function() {
		if(fs.existsSync(this.sessionFile)) {
			let seconds = Math.round((new Date().getTime() - fs.statSync(this.sessionFile).mtime) / 1000);
			if(seconds > this.duration) {
				console.log('Session file[' + file + '] [' + seconds + '] older than [' + this.duration + '] seconds...');
				this.reset();
				return this.expire(this);
			} else {
				if(fs.existsSync(this.file)) {
					console.log('Session file[' + this.file + '] [' + seconds + '] younger than [' + this.duration + '] seconds...');
					this.payload = require(this.file);
					return this.payload;
				} else {
					console.log('file[' + this.file + '] does not exist...');
					this.reset();
					return this.expire(this);
				}
			}
		} else {
			console.log('file[' + this.sessionFile + '] does not exist, writing...');
			this.reset();
			return this.expire(this);
		}
	}
	this.close = function() {
		console.log('writing file: [' + this.file + ']');
		//console.log(JSON.stringify(this.payload, null, "\t"));
		fs.writeFileSync(this.file, JSON.stringify(this.payload, null, "\t"), 'utf8');
	};
}

// assemble and export
var utils = {
	'session': Session
};
module.exports = utils;
