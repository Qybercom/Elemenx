'use strict';

/*
 * One statement per line: `a(); b();` and `{ a(); return; }` are split.
 * The body of an `if` on the header line is governed by elemenx/if-layout and is not counted here.
 */

function lineIndent (sourceCode, line) {
	return /^[ \t]*/.exec(sourceCode.lines[line - 1])[0];
}

module.exports = {
	meta: {
		type: 'layout',
		fixable: 'whitespace',
		docs: {
			description: 'Allow only one statement per line'
		},
		messages: {
			split: 'Only one statement per line.'
		},
		schema: []
	},
	create: function (context) {
		var sourceCode = context.sourceCode;

		function check (statements) {
			var i = 1;

			while (i < statements.length) {
				(function (previous, current) {
					if (previous.loc.end.line !== current.loc.start.line) return;

					context.report({
						node: current,
						messageId: 'split',
						fix: function (fixer) {
							if (sourceCode.commentsExistBetween(previous, current)) return null;

							return fixer.replaceTextRange([previous.range[1], current.range[0]], '\n' + lineIndent(sourceCode, previous.loc.start.line));
						}
					});
				})(statements[i - 1], statements[i]);

				i++;
			}
		}

		return {
			Program: function (node) {
				check(node.body);
			},
			BlockStatement: function (node) {
				check(node.body);
			},
			SwitchCase: function (node) {
				check(node.consequent);
			}
		};
	}
};
