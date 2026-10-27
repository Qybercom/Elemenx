/*
 * docs/FRONTEND-CODE-STYLE.md carries the rules of the linters of this repository (eslint/, stylelint/), made generic
 * for other projects: the prefix house/ in place of elemenx/, .cjs files, no name of Elemenx. Generic(text) makes a
 * file so; Sync() writes the files of the repository into the appendix of the document again, after a rule changed.
 * node tools/frontend-style.js
 */
var fs = require('fs');
var path = require('path');

var Root = path.resolve(__dirname, '..');
var Document = path.join(Root, 'docs', 'FRONTEND-CODE-STYLE.md');

/* The files of the appendix the repository gives: {path in the document: path in the repository}. */
function sources () {
	var files = {'eslint/plugin.cjs': 'eslint/plugin.js', 'stylelint/plugin.mjs': 'stylelint/plugin.mjs'};

	fs.readdirSync(path.join(Root, 'eslint', 'rules')).forEach(function (file) {
		files['eslint/rules/' + file.replace(/\.js$/, '.cjs')] = 'eslint/rules/' + file;
	});

	return files;
}

function Generic (text) {
	return text
		.replace(/elemenx\//g, 'house/')
		.replace(/eslint-plugin-elemenx/g, 'eslint-plugin-house')
		.replace(/Enforce the Elemenx /g, 'Enforce the house ')
		.replace(/Enforce Elemenx /g, 'Enforce the house ')
		.replace(/ \(`docs\/CODE-STYLE\.md`, "Blank lines"\)/g, '')
		.replace(/docs\/CODE-STYLE\.md/g, 'CODE-STYLE.md')
		.replace(/require\('\.\/rules\/([\w-]+)\.js'\)/g, 'require(\'./rules/$1.cjs\')')
		.replace(/`child\.\$Destroy\(\); child = null;`/g, '`child.destroy(); child = null;`');
}

/* The files of the appendix of the document: {path: text}. */
function Appendix (text) {
	var files = {};
	var pattern = /^### `([^`]+)`\n\n```\w*\n([\s\S]*?)^```$/gm;
	var part = text.slice(text.indexOf('## Appendix'));
	var match;

	while ((match = pattern.exec(part)))
		files[match[1]] = match[2];

	return files;
}

/* Puts the files of the repository, made generic, in the blocks of the appendix that hold them. */
function Sync () {
	var text = fs.readFileSync(Document, 'utf8');
	var files = sources();
	var start = text.indexOf('## Appendix');

	text = text.substring(0, start) + text.substring(start).replace(/^### `([^`]+)`\n\n```(\w*)\n[\s\S]*?^```$/gm, function (block, name, language) {
		if (!files[name]) return block;

		return '### `' + name + '`\n\n```' + language + '\n' + Generic(fs.readFileSync(path.join(Root, files[name]), 'utf8')).replace(/\n?$/, '\n') + '```';
	});

	fs.writeFileSync(Document, text);

	return text;
}

module.exports = {
	Generic: Generic,
	Appendix: Appendix,
	Sync: Sync,
	Sources: sources
};

if (require.main === module) {
	Sync();

	process.stdout.write('Elemenx frontend style: ' + Document + '\n');
}
