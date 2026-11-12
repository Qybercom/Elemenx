// Takes the 3D sections out of UIKitPage: their markup (a section of links instead), the properties of their code nothing
// else refers to any more (to a fixed point), and the rules of the stylesheet of classes no longer used.
import fs from 'fs';
import * as acorn from 'acorn';

const root = 'D:/dev/Elemenx/examples/Advanced/application/components/UIKitPage/';
let js = fs.readFileSync(root + 'UIKitPage.js', 'utf8');
let html = fs.readFileSync(root + 'UIKitPage.html', 'utf8');
let css = fs.readFileSync(root + 'UIKitPage.css', 'utf8');
const uses = JSON.parse(fs.readFileSync(process.env.USES, 'utf8')).uses;

/* The markup: from the first 3D section to the one after the last. */
const from = html.indexOf('\t<Section *if="Shows(\'Game world\')"');
const to = html.indexOf('\t<Section *if="Shows(\'Keep-alive\')"');
const removedHtml = html.slice(from, to);

html = html.slice(0, from) + `\t<Section *if="Shows('3D scenes')" Title="3D scenes" Note="Scene and its editors, each demo on a page of its own">
\t\t<p class="elemenx-text">The 3D scenes have pages of their own, one demo at a time, made for a phone too: <a href="/graphics">Graphics</a> (terrain, locations, space, models, plants, textures, cinema and the editors) and <a href="/gaming">Gaming</a> (strategy, racing, orbit, combat).</p>
\t</Section>

` + html.slice(to);

/* The properties: candidates are those the 3D sections used; one goes when nothing else names it. */
const candidates = new Set();

Object.values(uses).forEach((list) => list.forEach((name) => candidates.add(name)));

function props () {
	const tree = acorn.parse(js, {ecmaVersion: 5, ranges: true});
	const object = tree.body[0].expression.arguments[1];
	let previous = object.start + 1;

	return object.properties.map((p) => {
		const name = p.key.name || p.key.value;
		let start = previous;

		if (js.charAt(start) === ',') start++;

		previous = p.end;

		return {Name: name, Start: start, End: p.end};
	});
}

const removed = [];
let changed = true;

while (changed) {
	changed = false;

	const list = props();

	for (let i = list.length - 1; i >= 0; i--) {
		const p = list[i];

		if (!candidates.has(p.Name) || p.Name.charAt(0) === '$') continue;

		const rest = js.slice(0, p.Start) + js.slice(p.End);
		const named = new RegExp('(^|[^A-Za-z0-9_$])' + p.Name.replace(/\$/g, '\\$') + '(?![A-Za-z0-9_$])');

		if (named.test(rest) || named.test(html)) continue;

		/* Its comma too: the one before it (the previous property's), or after it when it is the first. */
		let start = p.Start - 1;
		let end = p.End;

		if (js.charAt(start) !== ',') {
			start = p.Start;
			end = js.charAt(p.End) === ',' ? p.End + 1 : p.End;
		}

		js = js.slice(0, start) + js.slice(end);
		removed.push(p.Name);
		changed = true;

		break;
	}
}

/* The stylesheet: rules of classes of the removed markup that nothing names now. */
const classes = [...new Set(removedHtml.match(/ui-kit-[a-z0-9-]+/g) || [])].filter((c) => !new RegExp(c + '(?![a-z0-9-])').test(html + js));
const blocks = css.split(/\n(?=\/\*|[^\s@}][^\n]*\{)/);
const kept = blocks.filter((block) => !classes.some((c) => new RegExp('\\.' + c + '(?![a-z0-9-])').test(block.split('{')[0]) && !/ui-kit-(?!(space|world|dash|cinema|flora|scene-editor|object-editor|space-editor|place|tune|lazy))/.test(block.split('{')[0].replace(new RegExp('\\.' + c + '(?![a-z0-9-])', 'g'), ''))));

css = kept.join('\n');

fs.writeFileSync(root + 'UIKitPage.js', js);
fs.writeFileSync(root + 'UIKitPage.html', html);
fs.writeFileSync(root + 'UIKitPage.css', css);
console.log(JSON.stringify({removed: removed.length, names: removed.slice(0, 400), classes, blocks: blocks.length - kept.length}));
