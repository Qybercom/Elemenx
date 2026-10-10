'use strict';

/*
 * try, catch and finally blocks are never written on one line:
 *
 * try {
 * 	value = JSON.parse(source);
 * }
 * catch (error) {
 * 	return null;
 * }
 *
 * `catch` and `finally` on their own line after `}` are enforced by @stylistic/brace-style (stroustrup).
 */

module.exports = {
	meta: {
		type: 'layout',
		fixable: 'whitespace',
		docs: {
			description: 'Require multi-line try, catch and finally blocks'
		},
		messages: {
			multiline: 'A `{{name}}` block must not be written on one line.'
		},
		schema: []
	},
	create: function (context) {
		var sourceCode = context.sourceCode;

		function lineIndent (line) {
			return /^[ \t]*/.exec(sourceCode.lines[line - 1])[0];
		}

		function check (block, name) {
			var open;
			var close;
			var first;
			var last;
			var indent;

			if (!block || block.loc.start.line !== block.loc.end.line) return;

			open = sourceCode.getFirstToken(block);
			close = sourceCode.getLastToken(block);
			first = sourceCode.getTokenAfter(open, {includeComments: true});
			last = sourceCode.getTokenBefore(close, {includeComments: true});
			indent = lineIndent(block.loc.start.line);

			context.report({
				node: block,
				messageId: 'multiline',
				data: {name: name},
				fix: function (fixer) {
					if (first === close)
						return fixer.replaceTextRange([open.range[1], close.range[0]], '\n' + indent);

					return [
						fixer.replaceTextRange([open.range[1], first.range[0]], '\n' + indent + '\t'),
						fixer.replaceTextRange([last.range[1], close.range[0]], '\n' + indent)
					];
				}
			});
		}

		return {
			TryStatement: function (node) {
				check(node.block, 'try');

				if (node.handler)
					check(node.handler.body, 'catch');

				check(node.finalizer, 'finally');
			}
		};
	}
};
