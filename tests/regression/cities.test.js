import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Cities = require('../../tools/cities.js');
var service = fs.readFileSync(path.join(import.meta.dirname, '../../libraries/ElemenxUI/services/Cities.js'), 'utf8');
var temporary = [];

/* A line of cities1000.txt: the columns of GeoNames that the build reads. */
function city (id, name, latitude, longitude, country, region, zone) {
	var field = new Array(19).fill('');

	field[0] = String(id);
	field[1] = name;
	field[4] = String(latitude);
	field[5] = String(longitude);
	field[8] = country;
	field[10] = region;
	field[17] = zone;

	return field.join('\t');
}

/* The GeoNames files of a few cities, built into a directory: {Root, Output}. */
function build (languages) {
	var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-cities-'));
	var output = path.join(root, 'data');

	temporary.push(root);

	fs.writeFileSync(path.join(root, 'cities.txt'), [
		city(524901, 'Moscow', 55.75222, 37.61556, 'RU', '48', 'Europe/Moscow'),
		city(2657896, 'Zürich', 47.36667, 8.55, 'CH', 'ZH', 'Europe/Zurich'),
		city(4839822, 'Lake Zurich', 42.19669, -88.09341, 'US', 'IL', 'America/Chicago'),
		city(498817, 'Saint Petersburg', 59.93863, 30.31413, 'RU', '66', 'Europe/Moscow'),
		city(2950159, 'Berlin', 52.52437, 13.41053, 'DE', '16', 'Europe/Berlin'),
		city(1220747, 'Moskva', 37.60805, 68.36004, 'TJ', '02', 'Asia/Dushanbe')
	].join('\n') + '\n');
	fs.writeFileSync(path.join(root, 'admin1.txt'), ['RU.48\tMoscow\tMoscow\t524894', 'RU.66\tSaint Petersburg\tSaint Petersburg\t536203', 'CH.ZH\tZurich\tZurich\t2657895', 'US.IL\tIllinois\tIllinois\t4896861', 'DE.16\tBerlin\tBerlin\t2950157', 'TJ.02\tKhatlon\tKhatlon\t1347488', 'FR.11\tÎle-de-France\tIle-de-France\t3012874'].join('\n') + '\n');
	fs.writeFileSync(path.join(root, 'names.txt'), [
		['1', '524901', 'ru', 'Москва', '1', '', '', ''],
		['2', '524901', 'ru', 'Мск', '', '1', '', ''],
		['3', '498817', 'ru', 'Ленинград', '', '', '', '1'],
		['4', '498817', 'ru', 'Санкт-Петербург', '1', '', '', ''],
		['5', '2657896', 'ru', 'Цюрих', '', '', '', ''],
		['6', '2657896', 'de', 'Zürich', '1', '', '', ''],
		['7', '524894', 'ru', 'Москва', '1', '', '', ''],
		['8', '2950159', 'ru', 'Берлин', '1', '', '', ''],
		['9', '1220747', 'ru', 'Москва', '', '', '', '']
	].map(function (row) {
		return row.join('\t');
	}).join('\n') + '\n');

	Cities.Build({Cities: path.join(root, 'cities.txt'), Regions: path.join(root, 'admin1.txt'), Names: path.join(root, 'names.txt'), Output: output, Languages: languages || ['ru']});

	return {Root: root, Output: output};
}

/* The Cities Service on the files of a directory, in the language given: {Service, Loads (the URLs read)}. */
function load (output, language) {
	var definition;
	var loads = [];
	var Elemenx = {
		Service: function (name, value) {
			definition = value;
		},
		Library: function () {
			return {$Root: output.replace(/[\\/]data$/, '') + '/'};
		},
		Locale: {
			Language: function () {
				return language;
			}
		},
		Resource: {
			Load: function (url, callback) {
				loads.push(url);

				fs.readFile(url, 'utf8', callback);
			}
		}
	};
	var instance;

	vm.runInNewContext(service, {Elemenx: Elemenx, Intl: Intl, Math: Math, Number: Number, String: String, Date: Date, Infinity: Infinity, parseInt: parseInt});

	instance = Object.assign({}, definition);

	instance.$OnCreate();

	return {Service: instance, Loads: loads};
}

function names (cities) {
	return cities.map(function (entry) {
		return entry.Name + ' ' + entry.Country;
	});
}

afterEach(function () {
	while (temporary.length) fs.rmSync(temporary.pop(), {recursive: true, force: true});
});

describe('ElemenxUI cities data', function () {
	it('writes the cities by name with base 36 IDs and time zone indexes, the regions used and the preferred names of a language', function () {
		var built = build();
		var lines = fs.readFileSync(path.join(built.Output, 'cities.txt'), 'utf8').split('\n');

		expect(lines[0]).toBe('America/Chicago|Asia/Dushanbe|Europe/Berlin|Europe/Moscow|Europe/Zurich');
		expect(lines.slice(1, -1).map(function (line) {
			return line.split('\t')[1];
		})).toEqual(['Berlin', 'Lake Zurich', 'Moscow', 'Moskva', 'Saint Petersburg', 'Zürich']);
		expect(lines[3]).toBe(['b90l', 'Moscow', 'RU', '48', '55.7522', '37.6156', '3'].join('\t'));
		expect(fs.readFileSync(path.join(built.Output, 'regions.txt'), 'utf8')).not.toContain('FR.11');
		expect(fs.readFileSync(path.join(built.Output, 'cities-ru.txt'), 'utf8').split('\n')).toEqual(['1r8cv\tБерлин', 'b90l\tМосква', 'q5xn\tМосква', 'aow1\tСанкт-Петербург', '1kyug\tЦюрих', 'RU.48\tМосква', '']);
	});

	it('fails on a missing GeoNames file', function () {
		expect(function () {
			Cities.Build({Cities: 'missing.txt', Regions: 'missing.txt', Output: os.tmpdir()});
		}).toThrow('GeoNames file not found: Cities missing.txt');
	});
});

describe('ElemenxUI Cities Service', function () {
	it('loads the data once for every caller, with the names of the language when it has a pack', async function () {
		var built = build();
		var english = load(built.Output, 'en');
		var russian = load(built.Output, 'ru-RU');
		var counts = await new Promise(function (resolve) {
			var result = [];

			english.Service.Load(function (error, count) {
				result.push(count);
			});
			english.Service.Load(function (error, count) {
				result.push(count);

				resolve(result);
			});
		});

		expect(counts).toEqual([6, 6]);
		expect(english.Loads.map(function (url) {
			return path.basename(url);
		})).toEqual(['cities.txt', 'regions.txt']);

		await new Promise(function (resolve) {
			russian.Service.Load(resolve);
		});

		expect(russian.Loads.map(function (url) {
			return path.basename(url);
		})).toEqual(['cities.txt', 'regions.txt', 'cities-ru.txt']);
	});

	it('finds the names that start with the text first, then the words, by name; without diacritics and across alphabets', async function () {
		var built = build();
		var english = load(built.Output, 'en').Service;
		var russian = load(built.Output, 'ru').Service;
		var search = function (instance, text, options) {
			return new Promise(function (resolve, reject) {
				instance.Search(text, options || {}, function (error, cities) {
					if (error) reject(error);
					else resolve(names(cities));
				});
			});
		};

		expect(await search(english, 'zurich')).toEqual(['Zürich CH', 'Lake Zurich US']);
		expect(await search(english, 'ZÜR', {Country: 'US'})).toEqual(['Lake Zurich US']);
		expect(await search(english, 'mos', {Limit: 1})).toEqual(['Moscow RU']);
		expect(await search(english, 'urich')).toEqual([]);
		expect(await search(english, ' ')).toEqual([]);
		expect(await search(russian, 'москва')).toEqual(['Москва RU', 'Москва TJ']);
		expect(await search(russian, 'moskva')).toEqual(['Москва RU', 'Москва TJ']);
		expect(await search(russian, 'peterb')).toEqual(['Санкт-Петербург RU']);
		expect(await search(russian, 'Цюр')).toEqual(['Цюрих CH']);
	});

	it('finds a city by ID and the nearest city, and tells the place, the label and the time there', async function () {
		var built = build();
		var russian = load(built.Output, 'ru').Service;
		var english = load(built.Output, 'en').Service;
		var found = await new Promise(function (resolve) {
			russian.Find(524901, function (error, value) {
				resolve(value);
			});
		});
		var nearest = await new Promise(function (resolve) {
			english.Nearest(52.4, 13.1, function (error, value) {
				resolve(value);
			});
		});
		var nothing = await new Promise(function (resolve) {
			english.Find('nope', function (error, value) {
				resolve(value);
			});
		});

		expect(found).toEqual({ID: 524901, Name: 'Москва', Country: 'RU', Region: 'Москва', Latitude: 55.7522, Longitude: 37.6156, TimeZone: 'Europe/Moscow'});
		expect(russian.Label(found)).toBe('Москва, Россия');
		expect(nearest.Name).toBe('Berlin');
		expect(english.Place(nearest)).toBe('Germany');
		expect(nothing).toBe(null);
		expect(english.Clock(found, new Date(Date.UTC(2026, 0, 31, 22, 5)))).toEqual({Date: '2026-02-01', Time: '01:05', Offset: '+03:00', TimeZone: 'Europe/Moscow'});
		expect(english.Clock('UTC', new Date(Date.UTC(2026, 6, 1, 9, 30))).Offset).toBe('+00:00');
	});

	it('calls back the error of a file that does not load', async function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-cities-'));
		var instance;
		var error;

		temporary.push(root);

		instance = load(path.join(root, 'data'), 'en').Service;
		error = await new Promise(function (resolve) {
			instance.Search('a', function (value) {
				resolve(value);
			});
		});

		expect(error.code).toBe('ENOENT');
	});
});
