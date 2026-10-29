import { describe, expect, it } from 'vitest';
import Mangle from '../../tools/mangle.js';

/* What a mangled source does: the same as the source, run here. */
function run (source) {
	return new Function(Mangle.Mangle(source).Source)();
}

function names (source) {
	return Mangle.Mangle(source).Source;
}

describe('Builder: short local names (tools/mangle.js)', function () {
	it('renames parameters, variables, declared and named functions and the errors of a catch, and the code does the same', function () {
		var source = 'return (function (first, second) { var total = first + second; function twice (value) { return value * 2; } var named = function inner (n) { return n ? inner(n - 1) + 1 : 0; }; try { throw new Error("x"); } catch (failure) { total += failure.message.length; } return [twice(total), named(3)]; })(2, 3);';
		var mangled = names(source);

		expect(run(source)).toEqual([12, 3]);
		expect(mangled).not.toMatch(/\b(first|second|total|twice|named|inner|failure)\b/);
	});

	it('keeps properties, the keys of objects, globals and the names given to keep', function () {
		var mangled = Mangle.Mangle('var Version = "1"; (function () { var Version = "2"; var item = {Name: 1, Count: 2}; item.Name = Math.max(item.Count, Version.length); window.Kept = item; })();', ['Version']).Source;

		expect(mangled).toContain('{Name: 1, Count: 2}');
		expect(mangled).toContain('.Name = Math.max(');
		expect(mangled).toContain('.Count, Version.length');
		expect(mangled).toContain('window.Kept');
	});

	it('never hides a name of an outer scope that an inner one reads', function () {
		var source = 'var a = 10; return (function () { var outer = 1; var other = 2; return (function () { var inner = 3; return [a, outer, other, inner]; })(); })();';

		expect(run(source)).toEqual([10, 1, 2, 3]);
	});

	it('a var in a catch belongs to the function, a for of var in, and nested var statements', function () {
		var source = 'return (function () { try { throw 1; } catch (e) { var seen = e + 1; } var keys = []; for (var key in {x: 1, y: 2}) keys.push(key); var f = function () { var deep = 5; return deep; }, g = 7; return [seen, keys.join(), f(), g]; })();';

		expect(run(source)).toEqual([2, 'x,y', 5, 7]);
	});

	it('leaves code that is not ES5, or that it cannot follow (brackets or a comment that do not close), as it is', function () {
		['let a = 1;', 'var f = (a) => a;', 'var t = `x`;', 'function f (a) { return a; }}', 'var a = 1; /* open'].forEach(function (source) {
			var result = Mangle.Mangle(source);

			expect(result.Source).toBe(source);
			expect(result.Renamed).toBe(0);
		});
	});

	it('keeps the names a with or an eval can see, and renames the others (the precompiled expressions of a build)', function () {
		var source = 'return (function (scope) { var other = function (renamed) { return renamed + 1; }; var shown = (function (outer) { with (scope) { return Value + outer; } })(10); return [shown, other(1), (function (x) { return eval("x * 2"); })(4)]; })({Value: 5});';
		var mangled = names(source);

		expect(run(source)).toEqual([15, 2, 8]);
		expect(mangled).toContain('(outer)');
		expect(mangled).toContain('(scope)');
		expect(mangled).toContain('(x)');
		expect(mangled).not.toContain('renamed');
	});

	it('keeps strings, regular expressions and the words of ES5 as they are', function () {
		var source = 'return (function (text) { var pattern = /a\\/b[/]c/g; var label = "text"; return [pattern.test(text), label, typeof text, text / 2 > 0]; })("a/b/c");';

		expect(run(source)).toEqual([true, 'text', 'string', false]);
	});
});
