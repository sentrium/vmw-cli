#!/usr/bin/env node
var xtable = require('../xtable.js');
let data = require('./data.json');

let table = new xtable({data});
table.addMap(
	'name',
	function(value) { // return table object?;
		return value + '-son';
	}
)
table.addMap(
	'age',
	function(value) { // return table object?;
		return value + 10;
	}
);
table.addMap(
	'age',
	function(value) { // return table object?;
		if(value > 10) {
			return ++value;
		} else {
			return null;
		}
	}
);
table.run();
table.out();
