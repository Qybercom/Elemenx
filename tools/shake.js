'use strict';

/*
 * Leaves out of elemenx.js the sections a build does not use. A section of the framework starts with its header line
 * (a tab, then /* Name *\/) and ends at the next one or at the end of the framework (a line out of its
 * function); a group of sections goes when nothing of the code of the build (the Application, its templates and the
 * Library entities it takes) names it, and nothing it keeps needs it. The sections that use the ones of a group check
 * that they are there (see Owner resources). An Application that starts a worker keeps every section: the scripts of
 * its workers are files of their own, which a build does not read.
 */
var Groups = [
	{Name: 'Router', Sections: ['Router'], Uses: [/\$Router\b/, /\bElemenx\.Router\b/]},
	{Name: 'Network', Sections: ['Network'], Uses: [/\$Network\b/, /\bElemenx\.Network\b/]},
	{Name: 'Storage', Sections: ['Storage'], Uses: [/\$Storage\b/, /\bElemenx\.Storage\b/]},
	{Name: 'Events', Sections: ['Events'], Uses: [/\$Events\b/, /\$OnEvent\b/, /\bElemenx\.(Events|Pipe)\b/]},
	{Name: 'Messaging', Sections: ['Messaging'], Uses: [/\$Messaging\b/, /\$OnMessage\b/, /\bElemenx\.Messaging\b/], Needs: ['Events']},
	{Name: 'WebWorker', Sections: ['WebWorker'], Uses: [/\$WebWorker\b/, /\bElemenx\.WebWorker\b/], Needs: ['Messaging'], All: true},
	{Name: 'ServiceWorker', Sections: ['ServiceWorker', 'ServiceWorker bootstrap'], Uses: [/\$ServiceWorker\b/, /\bElemenx\.ServiceWorker\b/], Needs: ['WebWorker'], All: true}
];

function find (name) {
	var i = 0;

	while (i < Groups.length) {
		if (Groups[i].Name === name) return Groups[i];

		i++;
	}

	return null;
}

/* The groups the code uses, with the ones they need. */
function used (code) {
	var result = {};
	var changed = true;

	Groups.forEach(function (group) {
		if (group.Uses.some(function (pattern) {
			return pattern.test(code);
		}))
			result[group.Name] = true;
	});

	if (Groups.some(function (group) {
		return group.All && result[group.Name];
	})) {
		Groups.forEach(function (group) {
			result[group.Name] = true;
		});

		return result;
	}

	while (changed) {
		changed = false;

		Object.keys(result).forEach(function (name) {
			(find(name).Needs || []).forEach(function (need) {
				if (!result[need]) {
					result[need] = true;
					changed = true;
				}
			});
		});
	}

	return result;
}

/*
 * The framework without the sections of the groups code does not use: {Source, Removed} (the names of the groups
 * left out, in their order).
 */
function Shake (source, code) {
	var keep = used(String(code || ''));
	var drop = {};
	var removed = [];
	var lines = String(source).split('\n');
	var output = [];
	var skipping = false;

	Groups.forEach(function (group) {
		if (keep[group.Name]) return;

		removed.push(group.Name);

		group.Sections.forEach(function (section) {
			drop[section] = true;
		});
	});

	lines.forEach(function (line) {
		var header = /^\t\/\* ([A-Za-z][A-Za-z ]*) \*\/\r?$/.exec(line);

		if (header) skipping = !!drop[header[1]];
		else if (line && line.charAt(0) !== '\t') skipping = false;

		if (!skipping)
			output.push(line);
	});

	return {Source: output.join('\n'), Removed: removed};
}

module.exports = {
	Groups: Groups,
	Used: used,
	Shake: Shake
};
