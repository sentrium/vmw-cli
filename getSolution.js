#!/usr/bin/env node
var fs = require('fs');
var FileCookieStore = require('tough-cookie-filestore');
var rq = require('request');
var request = require('request-promise');
var Session = require('./utils.js').session;
var myVmw = require('./getIndex.js');
const PQueue = require('p-queue');
const got = require('got');
const queue = new PQueue({concurrency: 16});
const timer = console.time('timer');

// set up client
let dir = __dirname;

// base parameters
// rework to neaten globals - i.e remove need
var baseVmw = "https://my.vmware.com/group/vmware";
let urlCache = {};
let resultCache = {};
let slugIndex = {};
let slugCache = {};
let groupCache = {};
let slugSession;
let groupSession;
let indexSession;
let baseName;

var filesDir = __dirname;
var stateDir = __dirname;
if(process.env.VMWFILESDIR) {
	filesDir = process.env.VMWFILESDIR;
}
if(process.env.VMWSTATEDIR) {
	stateDir = process.env.VMWSTATEDIR;
}
let solutions = [
	//'VMware vSphere',
	//'VMware vSAN',
	//'VMware vRealize Network Insight',
	//'VMware NSX Cloud',
	//'VMware NSX Data Center for vSphere',
	//'VMware NSX-T Data Center',
	//'VMware Pivotal Container Service',
	//'VMware vSphere Integrated Containers',
	//'VMware Integrated OpenStack',
	'VMware Workspace ONE',
	'VMware Workspace',
	'VMware vSphere Hypervisor (ESXi)'
];
main();

// main function - build solutions
async function main() {
        if(process.env.VMWUSER && process.env.VMWPASS) {
                var myvmw = new myVmw({
                        'username': process.env.VMWUSER,
                        'password': process.env.VMWPASS,
                        'dir': stateDir
                });
		indexSession = new Session(stateDir + '/index.json', 600, async function() {
			let file = this.file;
			await myvmw.login();
			let data = await myvmw.index();
			fs.writeFileSync(file, JSON.stringify(data, null, "\t"), 'utf8'); // testing
			return data;
		});

		// get data
		slugIndex = await indexSession.data();
		//solutions = buildSolutions();

		// execute logic
		let jar = rq.jar(new FileCookieStore(stateDir + '/cookies.json'));
		request = request.defaults({
			'jar': jar
		});
		startSol(solutions.pop());
	} else {
		console.log('[ERROR]: environment variables $VMWUSER and $VMWPASS not set! Please configure');
	}
}

// construct solutions
function buildSolutions() {
	let result = [];
	for(let item of slugIndex['productCategoryList'][0]['proList']) {
		result.push(item.name);
	}
	console.log(JSON.stringify(result, null, "\t"));
	return result;
}

// construct slug index
function buildSlug() {
	let result = {};
	for(let item of slugIndex['productCategoryList'][0]['proList']) {
		for(let node of item.actions) {
			if(node.linkname == 'View Download Components') {
				result[item.name] = node.target.replace(/^(\.)/, '');
			}
		}
	}
	return result;
}

// construct product index
function buildFinal(name, cache) {
	fs.writeFileSync(stateDir + '/slug.' + name + '.json', JSON.stringify(cache, null, "\t"));
	console.log('finished: ' + name);
	startSol(solutions.pop());
	if(solutions.length == 0) {
		console.log('Solutions finished - writing [mainIndex.json]');
		let final = {};
		var files = fs.readdirSync(stateDir);
		files.forEach(function(file, index) {
			let rgxFilter = new RegExp('^slug.*json$', 'g');
			if(m = rgxFilter.exec(file)) {
				final = Object.assign(require(stateDir + '/' + file), final);
			}
		});
		fs.writeFileSync(stateDir + '/mainIndex.json', JSON.stringify(final, null, "\t"));
	}
}

function startSol(name) {
	slugCache = {};
	groupCache = {};
	if(link = buildSlug()[name]) {
		console.log('Reversing shield polarity for: "' + name + '"');
		var rgx = new RegExp('([^/]+)/[^/]+$', 'g');
		if(m = rgx.exec(link)) {
			baseName = m[1].replace(/[_]/g, "-");
			console.log(baseName);
		}
		if(slugCache[baseName] === undefined) {
			slugCache[baseName] = {};
		}
		getPage([link]);
	}
}

// recursively fetch - queue with concurrency - rework as generic url runner
function getPage(linkList, solutions)  {
	let newList = [];
	for(let link of linkList) {
		queue.add(() => { // switch to got module
			let url = baseVmw + link;
			console.log('FETCH: ' + url);
			urlCache[link] = 1;
			return request.get({url});
		}).then((data) => {
			// find all links, versions and groups
			let versions = findVersions(link, data);
			let groups = findGroups(data);
			for(let item in versions) {
				if(!urlCache[item]) { // Cache MISS
					newList.push(item);
				}
			}

			// add to resultCache & groupCache
			if(resultCache[versions[link]] === undefined) {
				slugCache[baseName][versions[link]] = {}
			}
			for(let key in groups) {
				slugCache[baseName][versions[link]][key] = groups[key]
				if(groupCache[key] === undefined) {
					groupCache[key] = {};
				}
				groupCache[key][groups[key]] = 1;
			}
			console.log('Completed: ' + link);
			getPage(newList);
			if(queue.size === 0 && queue.pending === 0) {
				buildFinal(baseName, slugCache);
			}
		});
	}
}

// extract versions from page
function findVersions(url, body) {
	// extract the base slug URL
	var rgx = new RegExp('^\.?(/.*/)(.*)', 'g');
	let baseSlug;
	if (m = rgx.exec(url)) {
		baseSlug = m[1];
	}

        // attempt to find version in selected radio button
	let cache = {};
	var rgx = new RegExp('option value="/web/vmware' + baseSlug + '([-_0-9a-zA-Z]+)" selected="selected""?>([ \.0-9a-zA-Z]+)</option>', 'g');
        if(m = rgx.exec(body)) {
		cache[baseSlug + m[1]] = m[2];
        }

	// if radio button, find all versions, if not, get directly from table
	if(cache[url]) {
		var rgx = new RegExp('<option value="/web/vmware' + baseSlug + '([-_0-9a-zA-Z]+)" (?:selected="selected")?"?>([ \.0-9a-zA-Z]+)</option>', 'g');
                while(m = rgx.exec(body)) {
			cache[baseSlug + m[1]] = m[2];
                }
        } else {
		var rgx = new RegExp('<div class="versionList">([^<]+)', 'g');
		if(m = rgx.exec(clean(body))) { // move clean??
			cache[url] = m[1].replace(/^[ ]+/, "").replace(/[ ]+$/, "");
		}
        }

	return cache;
}

// remove unnecessary spaces/newlines
function clean(string) {
	string = string.replace(/[\s]+/g, " ");
	string = string.replace(/>[ ]</g, "><");
	return string;
}

function findGroups(body) {
	var rgx = new RegExp('downloadGroup=([-\.\_0-9a-zA-Z]+)(?:&productId=([0-9]+))?', 'g');
	let cache = {};
	while (m = rgx.exec(body)) {
		cache[m[1]] = m[2];
	}
	return cache;
}
