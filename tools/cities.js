'use strict';

var fs = require('fs');
var path = require('path');
var fail = require('./common.js').fail;

var Order = new Intl.Collator('en').compare;

/* Every line of a text file, read in parts: the files of GeoNames are too large for one string. */
function eachLine (file, callback) {
	var descriptor = fs.openSync(file, 'r');
	var buffer = Buffer.alloc(1 << 20);
	var rest = '';
	var read;
	var lines;

	try {
		while ((read = fs.readSync(descriptor, buffer, 0, buffer.length, null)) > 0) {
			lines = (rest + buffer.toString('utf8', 0, read)).split('\n');
			rest = lines.pop();

			lines.forEach(callback);
		}
	}
	finally {
		fs.closeSync(descriptor);
	}

	if (rest)
		callback(rest);
}

/* A number in base 36: the IDs and the time zones of cities.txt. */
function base36 (number) {
	return Number(number).toString(36);
}

/* A coordinate with four decimals (about 10 m), without the zeros at its end. */
function coordinate (value) {
	var text = Number(value).toFixed(4).replace(/\.?0+$/, '');

	return text === '-0' || text === '' ? '0' : text;
}

/*
 * Builds the city data of ElemenxUI from GeoNames (CC BY 4.0): cities.txt (its first line the time zones joined by
 * |, then a line per city: id in base 36, name, country, region code, latitude, longitude, time zone index in base 36;
 * sorted by name), regions.txt (CC.region and its name) and one cities-<language>.txt per language (the names of the
 * cities, then of the regions, in it: preferred names first, never short, colloquial or historic ones). Options: Cities
 * (cities1000.txt), Regions (admin1CodesASCII.txt), Names (alternateNamesV2.txt), Languages (['ru']), Output.
 */
function Build (options) {
	var cities = [];
	var zones = {};
	var zoneList;
	var regions = {};
	var regionIDs = {};
	var used = {};
	var ids = {};
	var best = {};
	var languages = options && options.Languages || [];
	var output;

	['Cities', 'Regions'].concat(languages.length ? ['Names'] : []).forEach(function (key) {
		if (!options || !options[key] || !fs.existsSync(options[key]))
			fail('GeoNames file not found: ' + key + ' ' + (options && options[key]));
	});

	eachLine(options.Cities, function (line) {
		var field = line.split('\t');
		if (field.length < 18) return;

		cities.push({ID: Number(field[0]), Name: field[1], Country: field[8], Region: field[10], Latitude: field[4], Longitude: field[5], Zone: field[17]});

		zones[field[17]] = true;
		used[field[8] + '.' + field[10]] = true;
		ids[field[0]] = true;
	});

	cities.sort(function (a, b) {
		return Order(a.Name, b.Name) || (a.Country < b.Country ? -1 : a.Country > b.Country ? 1 : 0) || a.ID - b.ID;
	});

	zoneList = Object.keys(zones).sort();

	eachLine(options.Regions, function (line) {
		var field = line.replace(/\r$/, '').split('\t');
		if (field.length < 4) return;

		regions[field[0]] = field[1];
		regionIDs[field[3]] = field[0];
	});

	if (languages.length) {
		eachLine(options.Names, function (line) {
			var field = line.split('\t');
			var rank;
			var key;

			if (field.length < 8 || languages.indexOf(field[2]) === -1 || field[5] === '1' || field[6] === '1' || field[7] === '1') return;
			if (!ids[field[1]] && !regionIDs[field[1]]) return;

			key = field[2] + ' ' + field[1];
			rank = field[4] === '1' ? 0 : 1;

			if (!best[key] || rank < best[key].Rank)
				best[key] = {Rank: rank, Name: field[3]};
		});
	}

	fs.mkdirSync(options.Output, {recursive: true});

	output = [zoneList.join('|')].concat(cities.map(function (city) {
		return [base36(city.ID), city.Name, city.Country, city.Region, coordinate(city.Latitude), coordinate(city.Longitude), base36(zoneList.indexOf(city.Zone))].join('\t');
	}));

	fs.writeFileSync(path.join(options.Output, 'cities.txt'), output.join('\n') + '\n');

	fs.writeFileSync(path.join(options.Output, 'regions.txt'), Object.keys(regions).filter(function (key) {
		return used[key];
	}).sort().map(function (key) {
		return key + '\t' + regions[key] + '\n';
	}).join(''));

	languages.forEach(function (language) {
		var lines = [];

		cities.forEach(function (city) {
			var name = best[language + ' ' + city.ID];
			if (name)
				lines.push(base36(city.ID) + '\t' + name.Name);
		});

		Object.keys(regionIDs).map(function (id) {
			return {ID: id, Key: regionIDs[id]};
		}).sort(function (a, b) {
			return a.Key < b.Key ? -1 : a.Key > b.Key ? 1 : 0;
		}).forEach(function (region) {
			var name = best[language + ' ' + region.ID];
			if (name && used[region.Key])
				lines.push(region.Key + '\t' + name.Name);
		});

		fs.writeFileSync(path.join(options.Output, 'cities-' + language + '.txt'), lines.join('\n') + (lines.length ? '\n' : ''));
	});

	return {Count: cities.length, Zones: zoneList.length, Languages: languages};
}

module.exports = {
	Build: Build
};

/*
 * node tools/cities.js <cities1000.txt> <admin1CodesASCII.txt> <alternateNamesV2.txt> <output> [ru]
 * The files of https://download.geonames.org/export/dump/ (cities1000.zip and alternateNamesV2.zip unpacked).
 */
if (require.main === module) {
	(function (args) {
		var result;

		if (args.length < 4)
			fail('usage: node tools/cities.js <cities1000.txt> <admin1CodesASCII.txt> <alternateNamesV2.txt> <output> [ru]');

		result = Build({Cities: args[0], Regions: args[1], Names: args[2], Output: args[3], Languages: String(args[4] || 'ru').split(',')});

		process.stdout.write('Elemenx cities: ' + result.Count + ' cities, ' + result.Zones + ' time zones, ' + result.Languages.join(', ') + '\n');
	})(process.argv.slice(2));
}
