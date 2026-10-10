'use strict';

/*
 * Layout of `if` statements whose branches are not blocks.
 *
 * A single `if` (no else):
 * - early exit (return, break, continue) shorter than its `if (...)` header stays on the header line;
 * - everything else, including throw, goes to the next line.
 *
 * An if..else chain either braces every branch or keeps every branch on the line of its keyword.
 */

var EarlyExit = {
	ReturnStatement: true,
	BreakStatement: true,
	ContinueStatement: true
};

function collapse (text) {
	return text.replace(/\s+/g, ' ');
}

function isChainHead (node) {
	return !(node.parent && node.parent.type === 'IfStatement' && node.parent.alternate === node);
}

module.exports = {
	meta: {
		type: 'layout',
		fixable: 'whitespace',
		docs: {
			description: 'Enforce the Elemenx layout of non-block if branches'
		},
		messages: {
			sameLine: 'Short early exit must stay on the `if` line.',
			nextLine: 'This `if` body must start on the next line.',
			chainSameLine: 'Non-block if..else branches must stay on the line of their keyword.',
			chainMixed: 'An if..else chain must either brace every branch or brace none.'
		},
		schema: []
	},
	create: function (context) {
		var sourceCode = context.sourceCode;

		function hasComments (left, right) {
			return sourceCode.commentsExistBetween(left, right);
		}

		function lineIndent (line) {
			return /^[ \t]*/.exec(sourceCode.lines[line - 1])[0];
		}

		function moveToLine (fixer, keyword, body) {
			if (hasComments(keyword, body)) return null;

			return fixer.replaceTextRange([keyword.range[1], body.range[0]], ' ');
		}

		function moveToNextLine (fixer, keyword, body, header) {
			if (hasComments(keyword, body)) return null;

			return fixer.replaceTextRange([keyword.range[1], body.range[0]], '\n' + lineIndent(header.loc.start.line) + '\t');
		}

		function checkSingle (node) {
			var close = sourceCode.getTokenBefore(node.consequent);
			var header = collapse(sourceCode.text.slice(node.range[0], close.range[1]));
			var body = collapse(sourceCode.getText(node.consequent));
			var sameLine = node.consequent.loc.start.line === close.loc.end.line;

			if (EarlyExit[node.consequent.type] && body.length < header.length) {
				if (!sameLine) {
					context.report({
						node: node.consequent,
						messageId: 'sameLine',
						fix: function (fixer) {
							return moveToLine(fixer, close, node.consequent);
						}
					});
				}

				return;
			}

			if (sameLine) {
				context.report({
					node: node.consequent,
					messageId: 'nextLine',
					fix: function (fixer) {
						return moveToNextLine(fixer, close, node.consequent, node);
					}
				});
			}
		}

		function checkChain (node) {
			var branches = [];
			var current = node;
			var blocks = 0;
			var i = 0;

			while (current) {
				branches.push({Keyword: sourceCode.getTokenBefore(current.consequent), Body: current.consequent});

				if (current.alternate && current.alternate.type === 'IfStatement') {
					current = current.alternate;

					continue;
				}

				if (current.alternate)
					branches.push({Keyword: sourceCode.getTokenBefore(current.alternate), Body: current.alternate});

				current = null;
			}

			while (i < branches.length) {
				if (branches[i].Body.type === 'BlockStatement')
					blocks++;

				i++;
			}

			if (blocks === branches.length) return;

			if (blocks) {
				context.report({node: node, messageId: 'chainMixed'});

				return;
			}

			i = 0;

			while (i < branches.length) {
				(function (branch) {
					if (branch.Body.loc.start.line === branch.Keyword.loc.end.line) return;

					context.report({
						node: branch.Body,
						messageId: 'chainSameLine',
						fix: function (fixer) {
							return moveToLine(fixer, branch.Keyword, branch.Body);
						}
					});
				})(branches[i]);

				i++;
			}
		}

		return {
			IfStatement: function (node) {
				if (!isChainHead(node)) return;

				if (node.alternate) {
					checkChain(node);

					return;
				}

				if (node.consequent.type !== 'BlockStatement')
					checkSingle(node);
			}
		};
	}
};
