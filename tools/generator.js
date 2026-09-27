'use strict';

var fs=require('fs');
var path=require('path');

var Types={
	component:{Directory:'components',Label:'Component'},
	service:{Directory:'services',Label:'Service'},
	guard:{Directory:'guards',Label:'Guard'},
	directive:{Directory:'directives',Label:'Directive'}
};

function fail (message) {
	throw new Error(message);
}

function validName (name) {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name || '');
}

function readIndex (file) {
	var source;
	var value;

	if (!fs.existsSync(file)) return [];
	source=fs.readFileSync(file,'utf8').replace(/;\s*$/,'');

	try {
		value=Function('return (' + source + ');')();
	}
	catch (error) {
		fail('invalid index ' + file + ': ' + error.message);
	}

	if (!Array.isArray(value)) fail('index must return an Array: ' + file);
	return value;
}

function writeIndex (file,entries) {
	var lines=['['];
	var i=0;

	while (i < entries.length) {
		lines.push('\t' + JSON.stringify(entries[i]).replace(/"/g,"'") + (i + 1 < entries.length ? ',' : ''));
		i++;
	}

	lines.push(']');
	fs.mkdirSync(path.dirname(file),{recursive:true});
	fs.writeFileSync(file,lines.join('\n'));
}

function addIndexEntry (file,entry) {
	var entries=readIndex(file);
	var i=0;

	while (i < entries.length) {
		if (entries[i] === entry) return false;
		i++;
	}

	entries.push(entry);
	writeIndex(file,entries);
	return true;
}

function componentFiles (name) {
	return {
		[name + '.js']:"Elemenx.Component('" + name + "', {\n\tTemplateURL: '" + name + ".html'\n});",
		[name + '.html']:'<div class="' + name + '"></div>'
	};
}

function serviceFiles (name) {
	return {
		[name + '.js']:"Elemenx.Service('" + name + "', {\n});"
	};
}

function guardFiles (name) {
	return {
		[name + '.js']:"Elemenx.Guard('" + name + "', function () {\n\treturn true;\n});"
	};
}

function directiveFiles (name) {
	return {
		[name + '.js']:"Elemenx.Directive('" + name + "', {\n\tElemenxOnCreate: function (context) {\n\t},\n\n\tElemenxOnUpdate: function (context) {\n\t},\n\n\tElemenxOnDestroy: function (context) {\n\t}\n});"
	};
}

function filesFor (type,name) {
	if (type === 'component') return componentFiles(name);
	if (type === 'service') return serviceFiles(name);
	if (type === 'guard') return guardFiles(name);
	if (type === 'directive') return directiveFiles(name);
	fail('unknown generator type: ' + type);
}

function ensureWritable (targets,force) {
	var names=Object.keys(targets);
	var i=0;

	if (force) return;

	while (i < names.length) {
		if (fs.existsSync(names[i])) fail('file already exists: ' + names[i] + ' (use --force to overwrite)');
		i++;
	}
}

function generate (project,type,name,options) {
	options=options || {};
	type=String(type || '').toLowerCase();

	if (!Types[type]) fail('unknown generator type: ' + type + '. Expected component, service, guard or directive');
	if (!validName(name)) fail('invalid ' + type + ' name: ' + (name || ''));

	var applicationName=options.application || 'application';
	var application=path.join(project,applicationName);
	var definition=Types[type];
	var typeDirectory=path.join(application,definition.Directory);
	var relative;
	var directory;
	var generated=filesFor(type,name);
	var fileNames=Object.keys(generated);
	var targets={};
	var i=0;

	if (!fs.existsSync(application)) fail('application directory not found: ' + application);

	if (type === 'component') {
		directory=path.join(typeDirectory,name);
		relative=name + '/' + name + '.js';
	}
	else {
		directory=typeDirectory;
		relative=name + '.js';
	}

	while (i < fileNames.length) {
		targets[path.join(directory,fileNames[i])]=generated[fileNames[i]];
		i++;
	}

	ensureWritable(targets,options.force === true);
	fs.mkdirSync(directory,{recursive:true});

	var targetNames=Object.keys(targets);
	i=0;
	while (i < targetNames.length) {
		fs.writeFileSync(targetNames[i],targets[targetNames[i]]);
		i++;
	}

	addIndexEntry(path.join(typeDirectory,'index.js'),relative);
	addIndexEntry(path.join(application,'index.js'),definition.Directory);

	process.stdout.write('Elemenx Generator: ' + definition.Label + ' ' + name + '\n');
	return targetNames;
}

module.exports={
	Generate:generate,
	Types:Types
};