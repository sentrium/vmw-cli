#!/usr/bin/env node
var xtable = require('../xtable.js');
var xcell = require('../xcell.js');
const data = require('./data.json');

const cell = new xcell({data});
cell.addMap(
	'name',
	(value) => {
		return value + '-son';
	}
);
cell.addMap(
	'age',
	(value) => {
		return value + 4;
	}
);
cell.addMap(
	'age',
	(value) => {
		if(value > 30) {
			return ++value;
		} else {
			return null;
		}
	}
);

let table = new xtable({
	data: cell.run()
});
table.out();
