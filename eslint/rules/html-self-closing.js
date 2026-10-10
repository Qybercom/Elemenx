'use strict';

/*
 * Self-closing tags in HTML templates.
 *
 * - Void elements are always written self-closed with a space: <input type="text" />.
 * - Components (PascalCase) may be written either way: <Card /> or <Card></Card>.
 * - Other HTML elements are never self-closed: <div /> is not valid HTML.
 */

var Void = {
	area: true,
	base: true,
	br: true,
	col: true,
	embed: true,
	hr: true,
	img: true,
	input: true,
	link: true,
	meta: true,
	source: true,
	track: true,
	wbr: true
};

module.exports = {
	meta: {
		type: 'layout',
		fixable: 'code',
		docs: {
			description: 'Enforce Elemenx self-closing tags in HTML templates'
		},
		messages: {
			voidClose: 'Void element <{{name}}> must be written self-closed: " />".',
			elementClose: 'HTML element <{{name}}> cannot be self-closed.'
		},
		schema: []
	},
	create: function (context) {
		var sourceCode = context.sourceCode;

		return {
			Tag: function (node) {
				var name;
				var end;
				var before;

				if (!node.openStart || !node.openEnd) return;

				name = node.openStart.value.replace(/^</, '');
				end = node.openEnd;

				if (/^[A-Z]/.test(name)) return;

				if (Void[name.toLowerCase()]) {
					if (end.value === '/>') return;

					before = sourceCode.text.charAt(end.range[0] - 1);

					context.report({
						loc: end.loc,
						messageId: 'voidClose',
						data: {name: name},
						fix: function (fixer) {
							return fixer.replaceTextRange(end.range, /\s/.test(before) ? '/>' : ' />');
						}
					});

					return;
				}

				if (end.value === '/>') {
					context.report({
						loc: end.loc,
						messageId: 'elementClose',
						data: {name: name}
					});
				}
			}
		};
	}
};
