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
	{Name: 'ServiceWorker', Sections: ['ServiceWorker', 'ServiceWorker bootstrap'], Uses: [/\$ServiceWorker\b/, /\bElemenx\.ServiceWorker\b/], Needs: ['WebWorker'], All: true},
	/* The page as a PWA and its splash: what a build puts in its page names them (its worker, its #elemenx-splash). */
	{Name: 'Install', Sections: ['Install'], Uses: [/\bElemenx\.Install\b/, /\belemenx-pwa-worker\b/]},
	{Name: 'Splash', Sections: ['Splash'], Uses: [/\bElemenx\.Splash\b/, /\belemenx-splash\b/]}
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
	/* A checkout that turned the lines of elemenx.js into CRLF (Git on Windows) keeps its sections found. */
	var lines = String(source).replace(/\r\n/g, '\n').split('\n');
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

	/* An Application that starts a worker keeps every part too: the scripts of its workers may use any. */
	if (!Groups.some(function (group) {
		return group.All && keep[group.Name];
	})) {
		Parts.forEach(function (rule) {
			output = shakeParts(output, rule, String(code || ''), removed);
		});
	}

	return {Source: output.join('\n'), Removed: removed};
}

/*
 * The sections whose parts (their sub-headers, "/* Network: WebRTC") a build takes one by one: a part that puts a
 * transport into Registry goes when the code names that transport nowhere (Network.WebRTC, $Network().Transfer) and
 * no part that stays calls a function or reads a variable it declares; a part with no transport stays when one that
 * stays needs it. A part that does more than declare (a statement of its own at the level of the section) stays.
 */
var Parts = [
	{Section: 'Network', Registry: 'NetworkFactories'}
];

function shakeParts (lines, rule, code, removed) {
	var header = '\t/* ' + rule.Section + ' */';
	var start = lines.indexOf(header);
	var marks = [];
	var parts = [];
	var end = -1;
	var i;
	var changed = true;
	var registry = new RegExp('^\\t\\t' + rule.Registry + '\\.(\\w+) = ');
	var drop = {};

	if (start === -1) return lines;

	for (i = start + 1; i < lines.length; i++) {
		if (/^\t\}\)\(/.test(lines[i])) {
			end = i;

			break;
		}

		if (lines[i].indexOf('\t\t/* ' + rule.Section + ': ') === 0)
			marks.push(i);
	}

	if (end === -1 || !marks.length) return lines;

	marks.forEach(function (mark, index) {
		var to = index + 1 < marks.length ? marks[index + 1] : end;
		var part = {Name: /^\t\t\/\* ([^*]+?) \*\/$/.exec(lines[mark])[1], From: mark, To: to, Declared: [], Factories: [], Fixed: index === marks.length - 1, Text: lines.slice(mark, to).join('\n')};

		lines.slice(mark, to).forEach(function (line) {
			var declared = /^\t\t(?:function|var) ([A-Za-z_$][\w$]*)/.exec(line);
			var factory = registry.exec(line);

			if (declared) part.Declared.push(declared[1]);
			else if (factory) part.Factories.push(factory[1]);
			else if (/^\t\t[^\t\s}\])\/*]/.test(line)) part.Fixed = true;
		});

		parts.push(part);
	});

	function wanted (part) {
		return part.Fixed || part.Factories.some(function (name) {
			return new RegExp('\\b' + name + '\\b').test(code);
		});
	}

	parts.forEach(function (part) {
		part.Kept = wanted(part);
	});

	/* What the parts that stay call or read, until it holds: a part stays when one that stays names what it declares. */
	while (changed) {
		changed = false;

		(function () {
			var text = lines.slice(start, marks[0]).join('\n') + '\n' + parts.filter(function (part) {
				return part.Kept;
			}).map(function (part) {
				return part.Text;
			}).join('\n');

			parts.forEach(function (part) {
				if (part.Kept) return;

				if (part.Declared.some(function (name) {
					return new RegExp('(^|[^\\w$.])' + name.replace(/\$/g, '\\$') + '(?![\\w$])').test(text);
				})) {
					part.Kept = true;
					changed = true;
				}
			});
		})();
	}

	parts.forEach(function (part) {
		if (part.Kept) return;

		removed.push(part.Name);

		for (i = part.From; i < part.To; i++) {
			drop[i] = true;
		}
	});

	return lines.filter(function (line, index) {
		return !drop[index];
	});
}

module.exports = {
	Groups: Groups,
	Used: used,
	Shake: Shake
};
