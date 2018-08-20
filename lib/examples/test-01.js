#!/usr/bin/env node
var xtable = require('../xtable.js');
var xcell = require('../xcell.js');
let data = require('./data.json');

let cell = new xcell({data});
cell.addMap(
	'name',
	function(value) { // return table object?;
		return value + '-son';
	}
);
cell.addMap(
	'age',
	function(value) { // return table object?;
		return value + 18;
	}
);
cell.addMap(
	'age',
	function(value) { // return table object?;
		if(value > 10) {
			return ++value;
		} else {
			return 99;
		}
	}
);

let newdata = cell.run();
let table = new xtable({
	data: newdata
});
table.out();

/*
if(item[filter.field] && item[filter.field].match(new RegExp(filter.value, 'i'))) {
	this.view.push(item);
}
*/
