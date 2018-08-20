#!/usr/bin/env node
var xtable = require('../xtable.js');
var xcell = require('../xcell.js');
let data = require('./data.json');

let cell = new xcell({data});
cell.addMap(
	'name',
	(value) => { // return table object?;
		return value + '-son';
	}
);
cell.addMap(
	'age',
	(value) => { // return table object?;
		return value + 10;
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
