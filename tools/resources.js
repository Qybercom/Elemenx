/*
 * The resources of the system Libraries read from their folders, for Node, where no page loads them: what
 * Elemenx.Resources gives in a page. Each Library has them as its $Resources names them in elemenx.js: the group
 * Blueprints in its folder blueprints, Data in resources, each file named by the Library and its path without .json
 * (ElemenxGraphics/water of libraries/ElemenxGraphics/blueprints/water.json).
 *
 * Reader(root) returns resources(group), the names of a group sorted, and resources(group, name), a copy of the data of
 * one or null, as Elemenx.Resources; root is the folder of the Libraries (libraries beside this one by default).
 * Define(Elemenx, root) gives an Elemenx of Node every resource of the system Libraries.
 */
var fs = require('fs');
var path = require('path');

var Folders = {Blueprints: 'blueprints', Data: 'resources'};

/* Every .json file under a folder, by its path from it with / and without .json. */
function files (directory, prefix, found) {
	if (!fs.existsSync(directory)) return found;

	fs.readdirSync(directory).forEach(function (name) {
		var file = path.join(directory, name);

		if (fs.statSync(file).isDirectory()) files(file, prefix + name + '/', found);
		else if (/\.json$/i.test(name)) found[prefix + name.replace(/\.json$/i, '')] = file;
	});

	return found;
}

function Reader (root) {
	var base = root || path.resolve(__dirname, '..', 'libraries');
	var groups = {};

	Object.keys(Folders).forEach(function (group) {
		groups[group] = {};

		fs.readdirSync(base).forEach(function (library) {
			var found = files(path.join(base, library, Folders[group]), library + '/', {});

			Object.keys(found).forEach(function (name) {
				groups[group][name] = found[name];
			});
		});
	});

	return function (group, name) {
		var entries = groups[group] || {};

		if (arguments.length === 1)
			return Object.keys(entries).sort();

		return Object.prototype.hasOwnProperty.call(entries, name) ? JSON.parse(fs.readFileSync(entries[name], 'utf8')) : null;
	};
}

function Define (elemenx, root) {
	var read = Reader(root);

	Object.keys(Folders).forEach(function (group) {
		read(group).forEach(function (name) {
			elemenx.Resources(group, name, read(group, name));
		});
	});
}

module.exports = {
	Folders: Folders,
	Reader: Reader,
	Define: Define
};
