// Prints the source (with its comments) of the named properties of UIKitPage.js: node extract.mjs Name Name...
import fs from 'fs';
import * as acorn from 'acorn';

const root = 'D:/dev/Elemenx/examples/Advanced/application/components/UIKitPage/';
const js = fs.readFileSync(root + 'UIKitPage.js', 'utf8');
const tree = acorn.parse(js, {ecmaVersion: 5, ranges: true});
const object = tree.body[0].expression.arguments[1];
const props = {};
let previous = object.start + 1;

object.properties.forEach((p) => {
	const name = p.key.name || p.key.value;
	let from = previous;

	/* After the comma of the last one: its comments and the blank lines before it. */
	if (js.charAt(from) === ',') from++;

	props[name] = js.slice(from, p.end).replace(/^\n+/, '\n');
	previous = p.end;
});

const out = process.argv.slice(2).map((name) => props[name] === undefined ? '/* MISSING ' + name + ' */' : props[name]).join(',');

if (process.env.OUT) fs.writeFileSync(process.env.OUT, out);
else process.stdout.write(out + '\n');
