import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

var source = fs.readFileSync(path.join(import.meta.dirname, '../../libraries/ElemenxUI/services/Diff.js'), 'utf8');

/* The Diff Service, as the Library defines it. */
function create () {
	var definition;

	vm.runInNewContext(source, {
		Elemenx: {
			Service: function (name, value) {
				definition = value;
			}
		}
	});

	return Object.assign({}, definition);
}

describe('ElemenxUI Diff Service', function () {
	it('lists the lines of two texts as kept, removed and added, with their numbers in each text', function () {
		var diff = create();

		expect(diff.Lines('a\nb\nc\nd', 'a\nB\nc\nd\ne')).toEqual([
			{Type: 'same', Text: 'a', Old: 1, New: 1},
			{Type: 'remove', Text: 'b', Old: 2, New: null},
			{Type: 'add', Text: 'B', Old: null, New: 2},
			{Type: 'same', Text: 'c', Old: 3, New: 3},
			{Type: 'same', Text: 'd', Old: 4, New: 4},
			{Type: 'add', Text: 'e', Old: null, New: 5}
		]);
		expect(diff.Lines('same', 'same')).toEqual([{Type: 'same', Text: 'same', Old: 1, New: 1}]);
		expect(diff.Stats(diff.Lines('a\nb', 'c'))).toEqual({Added: 1, Removed: 2});
	});

	it('finds the shortest list of changes in long texts quickly', function () {
		var diff = create();
		var before = [];
		var after = [];
		var started;
		var lines;
		var i;

		for (i = 0; i < 3000; i++) {
			before.push('line ' + i);
			after.push(i % 50 === 0 ? 'changed ' + i : 'line ' + i);
		}

		started = Date.now();
		lines = diff.Lines(before.join('\n'), after.join('\n'));

		expect(diff.Stats(lines)).toEqual({Added: 60, Removed: 60});
		expect(lines.length).toBe(3060);
		expect(Date.now() - started).toBeLessThan(1000);
	});

	it('marks the words that differ in two versions of a line', function () {
		var diff = create();

		expect(diff.Words('var count = 1;', 'var total = 2;')).toEqual({Before: [{Start: 4, End: 9}, {Start: 12, End: 13}], After: [{Start: 4, End: 9}, {Start: 12, End: 13}]});
		expect(diff.Words('same text', 'same text')).toEqual({Before: [], After: []});
	});

	it('groups the lines into changes with their context and the folds between them', function () {
		var diff = create();
		var lines = diff.Lines('1\n2\n3\n4\n5\n6\n7\n8\n9\n10', '1\n2\n3\n4\nX\n6\n7\n8\n9\n10');

		expect(diff.Hunks(lines, 1).map(function (hunk) {
			return [hunk.Type, hunk.Lines.length];
		})).toEqual([['fold', 3], ['change', 4], ['fold', 4]]);
		expect(diff.Hunks(lines).map(function (hunk) {
			return [hunk.Type, hunk.Lines.length];
		})).toEqual([['fold', 1], ['change', 8], ['fold', 2]]);
	});
});
