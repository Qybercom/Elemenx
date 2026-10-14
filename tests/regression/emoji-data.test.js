import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Emoji = require('../../tools/emoji.js');
var temporary = [];

var test = [
	'# Version: 18.0',
	'# group: Smileys & Emotion',
	'1F600                                                  ; fully-qualified     # 😀 E1.0 grinning face',
	'263A FE0F                                              ; fully-qualified     # ☺️ E0.6 smiling face',
	'263A                                                   ; unqualified         # ☺ E0.6 smiling face',
	'# group: People & Body',
	'1F44B                                                  ; fully-qualified     # 👋 E0.6 waving hand',
	'1F44B 1F3FB                                            ; fully-qualified     # 👋🏻 E1.0 waving hand: light skin tone',
	'1F469 200D 1F4BB                                       ; fully-qualified     # 👩‍💻 E4.0 woman technologist',
	'1F469 1F3FD 200D 1F4BB                                 ; fully-qualified     # 👩🏽‍💻 E4.0 woman technologist: medium skin tone',
	'# group: Component',
	'1F3FB                                                  ; fully-qualified     # 🏻 E1.0 light skin tone',
	'# group: Flags',
	'1F1E9 1F1EA                                            ; fully-qualified     # 🇩🇪 E2.0 flag: Germany'
].join('\n');

function annotations (root, kind, value) {
	var file = path.join(root, kind + '.json');
	var data = {};

	data[kind] = {identity: {language: 'ru'}, annotations: value};

	fs.writeFileSync(file, JSON.stringify(data));

	return file;
}

afterEach(function () {
	while (temporary.length) fs.rmSync(temporary.pop(), {recursive: true, force: true});
});

describe('ElemenxUI emoji data', function () {
	it('reads the fully-qualified emoji of emoji-test.txt by group, with their version, tone and region', function () {
		var data = Emoji.ParseTest(test);

		expect(data.Version).toBe('18.0');
		expect(data.Groups.map(function (group) {
			return group.ID;
		})).toEqual(['smileys', 'people', 'flags']);
		expect(data.Groups[0].Emoji).toEqual([['😀', 'grinning face', 1, 0], ['☺️', 'smiling face', 0.6, 0]]);
		expect(data.Groups[1].Emoji).toEqual([['👋', 'waving hand', 0.6, 1], ['👩‍💻', 'woman technologist', 4, 1]]);
		expect(data.Groups[2].Emoji).toEqual([['🇩🇪', 'flag: Germany', 2, 0, 'DE']]);
	});

	it('writes the emoji and the names and keywords of each language, for the emoji of the data only', function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-emoji-'));
		var result;

		temporary.push(root);

		fs.writeFileSync(path.join(root, 'emoji-test.txt'), test);

		result = Emoji.Build({
			Test: path.join(root, 'emoji-test.txt'),
			Annotations: {ru: [
				annotations(root, 'annotations', {'😀': {default: ['лицо', 'улыбка'], tts: ['широко улыбается']}, '☺': {default: ['улыбка'], tts: ['улыбающееся лицо']}, '👋🏻': {default: ['привет'], tts: ['машет рукой: светлый тон']}, '🦖': {default: ['динозавр'], tts: ['тираннозавр']}}),
				annotations(root, 'annotationsDerived', {'🇩🇪': {default: ['флаг'], tts: ['флаг: Германия']}})
			]},
			Output: path.join(root, 'data')
		});

		expect(result).toEqual({Version: '18.0', Count: 5, Locales: ['ru']});
		expect(JSON.parse(fs.readFileSync(path.join(root, 'data', 'emoji.json'), 'utf8')).Groups.length).toBe(3);
		expect(JSON.parse(fs.readFileSync(path.join(root, 'data', 'emoji-ru.json'), 'utf8'))).toEqual({
			'😀': ['широко улыбается', 'лицо|улыбка'],
			'☺️': ['улыбающееся лицо', 'улыбка'],
			'🇩🇪': ['флаг: Германия', 'флаг']
		});
	});

	it('refuses a missing emoji-test.txt and a file that is not CLDR annotations', function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-emoji-'));

		temporary.push(root);

		fs.writeFileSync(path.join(root, 'emoji-test.txt'), test);
		fs.writeFileSync(path.join(root, 'other.json'), '{"main": {}}');

		expect(function () {
			Emoji.Build({Test: path.join(root, 'absent.txt'), Output: root});
		}).toThrow('emoji-test.txt not found: ');

		expect(function () {
			Emoji.Build({Test: path.join(root, 'emoji-test.txt'), Annotations: {en: [path.join(root, 'other.json')]}, Output: root});
		}).toThrow('Not a CLDR annotations file: ');
	});
});
