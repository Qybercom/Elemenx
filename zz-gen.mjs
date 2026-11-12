// Drafts a demo component of a section of UIKitPage: node gen.mjs "Section title" Name key
// Writes examples/Advanced/application/components/<Name>Demo/<Name>Demo.{html,js,css} and prints what to review.
import fs from 'fs';
import * as acorn from 'acorn';

const [title, name, key] = process.argv.slice(2);
const app = 'D:/dev/Elemenx/examples/Advanced/application/';
const root = app + 'components/UIKitPage/';
const js = fs.readFileSync(root + 'UIKitPage.js', 'utf8');
const html = fs.readFileSync(root + 'UIKitPage.html', 'utf8');
const css = fs.readFileSync(root + 'UIKitPage.css', 'utf8');
const uses = JSON.parse(fs.readFileSync(process.env.USES, 'utf8')).uses;
const tree = acorn.parse(js, {ecmaVersion: 5, ranges: true});
const object = tree.body[0].expression.arguments[1];
const trait = ['SceneQuality', 'SceneQualities', 'SceneQualityChosen', 'SpaceSystem', 'SceneWeather', 'SceneWeathers', 'SceneWeatherChosen', 'SceneBokeh', 'SceneFlare', 'SceneFlareChosen', 'SceneWind', 'SceneWindChosen', 'PlaceClock', 'PlacePersons', 'Far', 'SceneBack', 'Section', 'Time', 'Period', 'Color', 'Volume', 'View', 'Stars'];
const props = {};
let previous = object.start + 1;

object.properties.forEach((p) => {
	const n = p.key.name || p.key.value;
	let from = previous;

	if (js.charAt(from) === ',') from++;

	props[n] = js.slice(from, p.end).replace(/^\n+/, '\n');
	previous = p.end;
});

/* The section: its content within its <Section> and the *lazy round it. */
const at = html.indexOf('\t<Section *if="Shows(\'' + title + '\')"');
const open = html.indexOf('>', at) + 1;
const next = html.indexOf('\n\t<Section ', at + 10);
const close = html.lastIndexOf('</Section>', next === -1 ? html.length : next);
const tag = html.slice(at, open);
let body = html.slice(open, close).replace(/^\n/, '').replace(/\n\t$/, '');
const note = (tag.match(/(?:\[note\]="[^"]*'([^']*)'|Note="([^"]*)")/) || []).slice(1).filter(Boolean)[0] || '';

body = body.replace(/ \*if="!Far\.[a-z]+"/g, '').replace(/^\s*<div class="ui-kit-lazy" \*lazy>\n([\s\S]*)\n\s*<\/div>\s*$/, '$1');
body = body.replace(/class="ui-kit-row"/g, 'class="scene-demo-row"').replace(/class="ui-kit-space"/g, 'class="scene-demo-scene"').replace(/ data-demo="[a-z-]+"/g, '');

/* Its lines one tab in, as the least of them was (it was in a section, now in the root of the demo). */
const lines = body.split('\n');
const least = Math.min(...lines.filter((line) => line.trim()).map((line) => line.match(/^\t*/)[0].length));

body = lines.map((line) => line.trim() ? '\t' + line.slice(least) : line).join('\n');

const own = uses[title].filter((n) => trait.indexOf(n) === -1 && props[n] !== undefined);
const classes = [...new Set((body.match(/ui-kit-[a-z0-9-]+/g) || []))];
const rules = [];

/* The rules of the stylesheet that name a class of the section (each rule whole, with the comment before it). */
css.split(/\n(?=\/\*|[^\s@}][^\n]*\{)/).forEach((block) => {
	if (classes.some((c) => new RegExp('\\.' + c + '(?![a-z0-9-])').test(block.split('{')[0])))
		rules.push(block.trim());
});

const dir = app + 'components/' + name + 'Demo/';

fs.mkdirSync(dir, {recursive: true});
fs.writeFileSync(dir + name + 'Demo.html', '<div class="scene-demo">\n' + body + '\n</div>\n');
fs.writeFileSync(dir + name + 'Demo.js', '/*\n * ' + name + 'Demo: ' + note + '\n */\nElemenx.Component(\'' + name + 'Demo\', {\n\t$TemplateURL: \'' + name + 'Demo.html\',' + (rules.length ? '\n\t$StyleURL: \'' + name + 'Demo.css\',' : '') + '\n\t$Traits: [\'SceneDemo\'],' + own.map((n) => props[n]).join(',') + '\n});\n');

if (rules.length)
	fs.writeFileSync(dir + name + 'Demo.css', rules.join('\n\n') + '\n');

console.log(JSON.stringify({note, own: own.length, classes, rules: rules.length, sceneBack: /SceneBack/.test(own.map((n) => props[n]).join('')), clocks: (own.map((n) => props[n]).join('').match(/this\.[A-Za-z]+Clock|this\.[A-Za-z]+Timer/g) || []).filter((v, i, a) => a.indexOf(v) === i), refsKey: key}, null, 1));
