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
		return value + 2;
	}
);
cell.addFilter({
	'field': 'name',
	'value': 'e'
});

let newdata = cell.run();
let table = new xtable({
	data: newdata
});
table.out();
