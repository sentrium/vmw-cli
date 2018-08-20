#!/usr/bin/env node
var self = xcell.prototype;

// constructor
function xcell(opts) { // Object.assign?
	this.view = [];
	this.data = opts.data;
	this.maps = [];
}
module.exports = xcell;

// add map
self.addMap = function(field, mapper) {
	this.maps.push({
		'field': field,
		'mapper': mapper
	});
	return this;
};

// add filter
self.addFilter = function(filter) {
	this.addMap(
		filter.field,
		(value) => {
			if(value && value.match(new RegExp(filter.value, 'i'))) {
				return value;
			} else {
				return null;
			}
		}
	);
	return this;
};

// filter and transform current view
self.run = function(data = this.data) {
	this.view = data.filter((item) => {
		let filter = 1;
		this.maps.map((mapper) => {
			if(typeof(mapper.mapper) === 'function') {
				if(value = mapper.mapper(item[mapper.field])) {
					item[mapper.field] = value;
				} else {
					filter = 0;
				}
			} else {
				item[mapper.field] = mapper.mapper;
			}
		});
		if(filter) {
			return item;
		} else {
			return null;
		}
	});
	return this.view;
}
