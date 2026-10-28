import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

var formats;

function failure (name, text, options) {
	try {
		formats.Parse(name, text, options);
	}
	catch (error) {
		return error;
	}

	return null;
}

/* The DataFormats Service: texts of JSON, YAML, CSV, INI, TOML, XML, query strings and Base64 read and written. */
describe('Contract: the DataFormats Service', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:DataFormats']);

		formats = Elemenx.Service('DataFormats');
	});

	it('names its formats, finds the one of a file or a type, takes formats of its own and refuses an unknown one', function () {
		expect(formats.Names()).toEqual(['json', 'jsonc', 'yaml', 'csv', 'tsv', 'ini', 'toml', 'xml', 'query', 'base64']);
		expect(formats.For('config.YML')).toBe('yaml');
		expect(formats.For('data.tsv')).toBe('tsv');
		expect(formats.For('text/csv')).toBe('csv');
		expect(formats.For('photo.png')).toBe(null);
		expect(formats.Find('yml')).toBe(formats.Find('yaml'));

		formats.Register('upper', {Extensions: ['.up'], Parse: function (text) {
			return text.toLowerCase();
		}, Stringify: function (value) {
			return String(value).toUpperCase();
		}});

		expect(formats.Parse('upper', 'ABC')).toBe('abc');
		expect(formats.Stringify('upper', 'abc')).toBe('ABC');
		expect(formats.For('note.up')).toBe('upper');
		expect(function () {
			formats.Parse('nothing', '');
		}).toThrow('Elemenx DataFormats has no format nothing');
		expect(function () {
			formats.Register('bad', {});
		}).toThrow('DataFormats.Register expects (name, {Parse(text, options), Stringify(value, options)})');
	});

	it('reads YAML: mappings, sequences, flow collections, scalars of the core schema, block scalars, anchors and merges', function () {
		var text = [
			'# a comment',
			'name: Elemenx',
			'version: 0.11',
			'tags: [ui, es5]',
			'empty:',
			'nothing: ~',
			'flags: {a: true, b: no}',
			'quoted: "line\\nnext"',
			'single: \'it\'\'s\'',
			'list:',
			'  - one',
			'  - two: 2',
			'    three: 3',
			'  - - nested',
			'    - deep',
			'literal: |',
			'  first',
			'  second',
			'folded: >-',
			'  a',
			'  b',
			'',
			'  c',
			'',
			'base: &base',
			'  x: 1',
			'  y: 2',
			'derived:',
			'  <<: *base',
			'  y: 3',
			'same: *base',
			'multi: this is',
			'  a plain text',
			'hex: 0x1F',
			'inf: -.inf',
			'url: http://example.com/a#b',
			'items:',
			'- 1',
			'- "2"',
			'note: a # comment'
		].join('\n');

		expect(formats.Parse('yaml', text)).toEqual({
			name: 'Elemenx',
			version: 0.11,
			tags: ['ui', 'es5'],
			empty: null,
			nothing: null,
			flags: {a: true, b: 'no'},
			quoted: 'line\nnext',
			single: 'it\'s',
			list: ['one', {two: 2, three: 3}, ['nested', 'deep']],
			literal: 'first\nsecond\n',
			folded: 'a b\nc',
			base: {x: 1, y: 2},
			derived: {x: 1, y: 3},
			same: {x: 1, y: 2},
			multi: 'this is a plain text',
			hex: 31,
			inf: -Infinity,
			url: 'http://example.com/a#b',
			items: [1, '2'],
			note: 'a'
		});

		/* Several documents: the first one, or All of them. */
		expect(formats.Parse('yaml', 'a: 1\n---\nb: 2\n...\n')).toEqual({a: 1});
		expect(formats.Parse('yaml', '---\na: 1\n---\nb: [2]\n', {All: true})).toEqual([{a: 1}, {b: [2]}]);
		expect(formats.Parse('yaml', '- a\n- b')).toEqual(['a', 'b']);
		expect(formats.Parse('yaml', '')).toBe(null);
	});

	it('names the line and the column of what YAML cannot read', function () {
		var error = failure('yaml', 'a: 1\n  b: 2');

		expect([error.Line, error.Column]).toEqual([2, 3]);
		expect(error.message).toBe('Elemenx DataFormats yaml: line 2, column 3: a line more indented than its mapping');
		expect(failure('yaml', 'a: [1, 2').message).toContain('line 1, column 4: a flow collection is not closed');
		expect(failure('yaml', 'a: 1\na: 2').message).toContain('line 2, column 1: the key a is there twice');
		expect(failure('yaml', 'a: !!str 1').message).toContain('tags (!!str) are not supported');
		expect(failure('yaml', 'a: *nothing').message).toContain('no anchor &nothing');
		expect(failure('yaml', 'a: "open').message).toContain('a quoted scalar is not closed');
	});

	it('writes YAML that reads back as the same values', function () {
		var value = {
			name: 'Elemenx',
			count: 3,
			ratio: 0.5,
			on: true,
			none: null,
			tricky: ['true', '1', 'a: b', '', ' padded', '#hash', '- dash'],
			text: 'two\nlines',
			nested: {list: [{a: 1, b: [1, 2]}, [3, 4]], empty: [], blank: {}}
		};
		var text = formats.Stringify('yaml', value);

		expect(text).toContain('name: Elemenx\n');
		expect(text).toContain('text: |-\n  two\n  lines');
		expect(formats.Parse('yaml', text)).toEqual(value);
	});

	it('reads JSON and JSON with comments, naming the place of an error', function () {
		var error;

		expect(formats.Parse('json', '{"a": [1, 2]}')).toEqual({a: [1, 2]});
		expect(formats.Parse('jsonc', '{\n  // a comment\n  "a": "http://x", /* and */\n  "b": [1, 2,],\n}')).toEqual({a: 'http://x', b: [1, 2]});
		expect(formats.Stringify('json', {a: 1}, {Indent: 0})).toBe('{"a":1}');

		error = failure('json', '{\n  "a": 1,\n  "b": }');

		expect(error.Line).toBeGreaterThan(1);
		expect(error.message).toMatch(/^Elemenx DataFormats json: line \d+, column \d+: /);
	});

	it('reads and writes CSV and TSV: quotes, the header, the types', function () {
		var text = 'name,age\r\n"Smith, J",42\r\n"say ""hi""",7\r\n';

		expect(formats.Parse('csv', text)).toEqual([{name: 'Smith, J', age: '42'}, {name: 'say "hi"', age: '7'}]);
		expect(formats.Parse('csv', text, {Types: true})[0].age).toBe(42);
		expect(formats.Parse('csv', 'a,b\n1,"x\ny"', {Header: false})).toEqual([['a', 'b'], ['1', 'x\ny']]);
		expect(formats.Stringify('csv', [{name: 'Smith, J', age: 42}, {name: 'say "hi"', age: 7}])).toBe(text);
		expect(formats.Parse('tsv', 'a\tb\n1\t2')).toEqual([{a: '1', b: '2'}]);
		expect(formats.Stringify('tsv', [['a', 'b'], [1, 2]])).toBe('a\tb\r\n1\t2\r\n');
		expect(failure('csv', 'a\n"open').message).toContain('a quoted cell is not closed');
	});

	it('reads and writes INI: sections, nested by dots, comments and types', function () {
		var value = formats.Parse('ini', '; a comment\nname = x\n[server]\nport = 8080\nhost = "a b"\n# another\n[server.tls]\non: true\n');

		expect(value).toEqual({name: 'x', server: {port: 8080, host: 'a b', tls: {on: true}}});
		expect(formats.Parse('ini', formats.Stringify('ini', value))).toEqual(value);
		expect(failure('ini', 'name = x\nnothing here').Line).toBe(2);
	});

	it('reads and writes TOML: tables, arrays of tables, dotted keys, strings, numbers, dates and inline tables', function () {
		var text = [
			'title = "TOML \\u00e9"',
			'[owner]',
			'name = "Tom" # a comment',
			'dob = 1979-05-27T07:32:00-08:00',
			'[database]',
			'ports = [ 8000, 8001, 8002 ]',
			'data = [ ["delta", "phi"],',
			'  [3.14] ]',
			'enabled = true',
			'temp = { cpu = 79.5, case = 72.0 }',
			'[[products]]',
			'name = "Hammer"',
			'sku = 738594937',
			'[[products]]',
			'name = "Nail"',
			'site.url = \'https://x\'',
			'hex = 0xDEAD_BEEF',
			'big = 1_000',
			'cold = -inf',
			'poem = """',
			'multi',
			'line"""'
		].join('\n');
		var value = formats.Parse('toml', text);

		expect(value).toEqual({
			title: 'TOML é',
			owner: {name: 'Tom', dob: '1979-05-27T07:32:00-08:00'},
			database: {ports: [8000, 8001, 8002], data: [['delta', 'phi'], [3.14]], enabled: true, temp: {cpu: 79.5, 'case': 72}},
			products: [{name: 'Hammer', sku: 738594937}, {name: 'Nail', site: {url: 'https://x'}, hex: 0xDEADBEEF, big: 1000, cold: -Infinity, poem: 'multi\nline'}]
		});

		expect(formats.Parse('toml', formats.Stringify('toml', value))).toEqual(value);
		expect(failure('toml', 'a = 1\na = 2').message).toContain('line 2');
		expect(failure('toml', 'a = 1\na = 2').message).toContain('the key a is there twice');
		expect(failure('toml', 'a = ').message).toContain('a value is expected');
	});

	it('reads and writes XML as elements of {Name, Attributes, Children}', function () {
		var value = formats.Parse('xml', '<?xml version="1.0"?>\n<!-- a comment -->\n<root a="1 &amp; 2">\n  <item id="x">Text &lt;b&gt; &#65;</item>\n  <empty/>\n  <![CDATA[<raw>]]>\n</root>\n');

		expect(value).toEqual({Name: 'root', Attributes: {a: '1 & 2'}, Children: [
			{Name: 'item', Attributes: {id: 'x'}, Children: ['Text <b> A']},
			{Name: 'empty', Attributes: {}, Children: []},
			'<raw>'
		]});

		expect(formats.Parse('xml', formats.Stringify('xml', value))).toEqual(value);
		expect(formats.Stringify('xml', {Name: 'a', Attributes: {x: '"'}, Children: ['<']}, {Declaration: false})).toBe('<a x="&quot;">&lt;</a>\n');
		expect(failure('xml', '<a>\n  <b></a>').message).toContain('line 2, column 6: </b> is expected');
		expect(failure('xml', '<a/><b/>').message).toContain('only one root element is allowed');
	});

	it('reads and writes query strings with lists and nested names, and Base64 of texts and bytes', function () {
		var query = formats.Parse('query', '?a=1&b=2&b=3&c[d]=4&e[]=x&e[]=y&f=hello+world%21&g');

		expect(query).toEqual({a: '1', b: ['2', '3'], c: {d: '4'}, e: ['x', 'y'], f: 'hello world!', g: ''});
		expect(formats.Parse('query', formats.Stringify('query', query))).toEqual(query);
		expect(formats.Stringify('query', {q: 'a b&c', page: 2})).toBe('q=a%20b%26c&page=2');

		expect(formats.Stringify('base64', 'Привет, мир')).toBe('0J/RgNC40LLQtdGCLCDQvNC40YA=');
		expect(formats.Parse('base64', '0J/RgNC40LLQtdGCLCDQvNC40YA=')).toBe('Привет, мир');
		expect(formats.Stringify('base64', new Uint8Array([251, 255]), {Url: true})).toBe('-_8');
		expect(Array.from(formats.Parse('base64', '-_8', {Bytes: true}))).toEqual([251, 255]);
		expect(failure('base64', 'not base64!').message).toContain('not a text of Base64');
	});
});
