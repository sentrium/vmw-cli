#!/usr/bin/env node
var self = xtable.prototype;

// constructor
function xtable(opts) {
	this.cache = {};
	this.view = [];
	this.data = opts.data;
	this.header = opts.header;
	this.filters = [];
	this.mappers = {};
}
module.exports = xtable;

// stringify this.filters[];
self.filterString = function() {
	let string = '';
	let comma = '';
	for(let filter of this.filters) {
		string += comma + filter.field + ':' + filter.value;
		comma = ',';
	}
	return string;
};

// stringify this.filters[];
self.addMap = function(field, mapper) {
	this.mappers[field] = mapper;
};

self.out = function(cols) {
	if(this.data) {
		if(!this.header) {
			// learn cols from first data record if no header defined
			this.header = [];
			for(let item in this.data[0]) {
				this.header.push(item);
			}
		}
		if(!cols) {
			cols = this.header;
		}
		var col = {};
		for(let item of cols) {
			col[item] = item;
		}
		this.runColWidth(col);

		// scan widths data
		if(this.filters.length == 0) {
			this.view = this.data;
		}
		for(let item of this.view) { // map?
			this.runColWidth(item);
		}

		// build string header
		let headString = '';
		let dashString = '';
		let spacer = ' ';
		//for(let item of this.header) {
		for(let item of cols) {
			headString += item + spacer.repeat(this.cache[item] - item.length + 2); // remove 2 space at end?
			dashString += '-'.repeat(this.cache[item]) + spacer.repeat(2);
		}
		console.log(headString);
		console.log(dashString);

		//need to work out how to handle terminal width
		//console.log('Terminal size: ' + process.stdout.columns + 'x' + process.stdout.rows);

		// build string data
		for(let item of this.view) {
			let dataString = '';
			for(let col of cols) {
				if(item[col]) {
					dataString += item[col] + spacer.repeat(this.cache[col] - item[col].length + 2);
				} else {
					dataString += spacer.repeat(this.cache[col] + 2);
				}
			}
			console.log(dataString);
		}
	}
}

// determine maximum string length for column
self.runColWidth = function(item) {
	for(let key in item) {
		if(item[key]) {
			if(!this.cache[key] || this.cache[key] < item[key].length) {
				this.cache[key] = item[key].length;
			}
		}
        }
}

// mapilter current view
self.loop = function(item) {
	Object.keys(this.mappers).forEach((field) => {
		if(typeof(item[field]) !== 'undefined') {
			item[field] = this.mappers[field](item[field]);
		}
	});
	return item;
}

// filter current view
self.filter = function(filters, data = this.data) {
	if(filters) {
		this.filters = filters;
	}
	for(let filter of filters) {
		this.view = [];
		for(let item of data) {
			item = this.loop(item);
			if(item[filter.field] && item[filter.field].match(new RegExp(filter.value, 'i'))) {
				this.view.push(item);
			}
		}
		data = this.view;
	}
}
