'use strict';

var fs=require('fs');
var path=require('path');

var Types={
	component:{Label:'Component'},
	service:{Label:'Service'},
	guard:{Label:'Guard'},
	directive:{Label:'Directive'}
};

function fail (message) {
	throw new Error(message);
}

function validName (name) {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name || '');
}

function normalize (value) {
	return value.split(path.sep).join('/');
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

function ensureInside (root,target,label) {
	var relative=path.relative(root,target);
	if (relative === '..' || relative.indexOf('..' + path.sep) === 0 || path.isAbsolute(relative))
		fail(label + ' is outside application root: ' + target);
}

function nearestIndex (application,destination) {
	var current=destination;

	while (true) {
		var index=path.join(current,'index.js');
		if (fs.existsSync(index)) return index;
		if (current === application) break;

		var parent=path.dirname(current);
		if (parent === current) break;
		current=parent;
	}

	var root=path.join(application,'index.js');
	if (!fs.existsSync(root)) fail('application graph root not found: ' + root);
	return root;
}

function resolveEntity (application,type,target) {
	var requested=target || '';
	var absolute=path.resolve(application,requested || '.');
	var name=path.basename(absolute);

	if (!requested || requested === '.' || requested === path.sep)
		fail(type + ' destination must include an entity name');
	if (!validName(name)) fail('invalid ' + type + ' name: ' + name);

	if (type === 'component')
		return {
			Name:name,
			Directory:absolute,
			Entry:path.join(absolute,name + '.js')
		};

	return {
		Name:name,
		Directory:path.dirname(absolute),
		Entry:absolute + '.js'
	};
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

function generate (project,type,target,options) {
	options=options || {};
	type=String(type || '').toLowerCase();

	if (!Types[type]) fail('unknown generator type: ' + type + '. Expected component, service, guard or directive');

	var application=path.resolve(project,options.application || 'application');
	if (!fs.existsSync(application)) fail('application directory not found: ' + application);

	var entity=resolveEntity(application,type,target);
	ensureInside(application,entity.Directory,'destination');
	ensureInside(application,entity.Entry,'entity');

	var generated=filesFor(type,entity.Name);
	var fileNames=Object.keys(generated);
	var targets={};
	var i=0;

	while (i < fileNames.length) {
		targets[path.join(entity.Directory,fileNames[i])]=generated[fileNames[i]];
		i++;
	}

	ensureWritable(targets,options.force === true);

	// Ownership is resolved from the destination directory before creating it:
	// an existing local index.js wins, otherwise walk upward to the graph root.
	var owner=nearestIndex(application,entity.Directory);
	var relative=normalize(path.relative(path.dirname(owner),entity.Entry));

	fs.mkdirSync(entity.Directory,{recursive:true});
	var targetNames=Object.keys(targets);
	i=0;
	while (i < targetNames.length) {
		fs.writeFileSync(targetNames[i],targets[targetNames[i]]);
		i++;
	}

	addIndexEntry(owner,relative);
	process.stdout.write('Elemenx Generator: ' + Types[type].Label + ' ' + entity.Name + ' -> ' + normalize(path.relative(application,entity.Entry)) + '\n');
	return {
		Files:targetNames,
		Index:owner,
		Entry:relative
	};
}

module.exports={
	Generate:generate,
	Types:Types,
	NearestIndex:nearestIndex
};