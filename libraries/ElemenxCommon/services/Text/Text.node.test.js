import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

var source = fs.readFileSync(path.join(import.meta.dirname, 'Text.js'), 'utf8');

/* The Text Service, as the Library defines it. */
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

describe('Contract: Text, the texts of markup escaped once for every Library', function () {
	it('escapes & < > and " for an attribute or an element, and & < > alone for the text of an element', function () {
		var text = create();

		expect(text.Escape('a & b < c > d "e"')).toBe('a &amp; b &lt; c &gt; d &quot;e&quot;');
		expect(text.EscapeText('a & b < c > d "e"')).toBe('a &amp; b &lt; c &gt; d "e"');
		expect(text.Escape('&amp;')).toBe('&amp;amp;');
		expect(text.Escape('plain')).toBe('plain');
		expect(text.Escape(12)).toBe('12');
		expect(text.EscapeText(null)).toBe('null');
	});
});
