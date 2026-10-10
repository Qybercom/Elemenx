'use strict';

/*
 * Blank lines between statements of one block (docs/CODE-STYLE.md, "Blank lines"):
 *
 * 1. return, break and continue are preceded by a blank line, unless they open their block.
 * 2. An `if` is preceded by a blank line, unless it opens its block. Exceptions:
 *    - consecutive one-line ifs (`if (x) return;`) form a group and may follow each other directly;
 *    - rule 4.
 * 3. A statement that follows an `if`, a loop or a `try` (and is not itself checked by rules 1, 2, 6, 8) is preceded by a blank line.
 * 4. A compact `if` (no braces) that tests a variable declared by the `var` right above it
 *    follows that `var` without a blank line.
 * 5. The closing increment of a `while` body (`i++;`, `i += step;`) is preceded by a blank line.
 * 6. A loop (while, do, for) is preceded by a blank line, unless it opens its block or the statement
 *    right above it initializes a variable the loop uses (`i = 0;` or `var i = 0;`): then the blank line is optional.
 * 7. Logical groups are separated by a blank line. Consecutive simple statements belong to one group when they are
 *    all `var` declarations, all assignments (`a = b`, `a[k] = b`, `a++`), or calls on the same root
 *    (`response.writeHead(); response.end();`) or of the same method (`outlets.set(...); values.set(...);`).
 *    Releasing a reference right after the call that used it (`clearTimeout(timer); timer = null;`,
 *    `child.$Destroy(); child = null;`) stays in the group.
 * 8. A `try` is preceded by a blank line, unless it opens its block.
 */

var Exit = {
	ReturnStatement: true,
	BreakStatement: true,
	ContinueStatement: true
};

var Loop = {
	WhileStatement: true,
	DoWhileStatement: true,
	ForStatement: true,
	ForInStatement: true,
	ForOfStatement: true
};

function isIf (node) {
	return node.type === 'IfStatement';
}

function isCompactIf (node) {
	return isIf(node) && !node.alternate && node.consequent.type !== 'BlockStatement';
}

function isOneLineIf (node) {
	return isCompactIf(node) && node.loc.start.line === node.loc.end.line;
}

function isIncrement (node) {
	var expression = node.type === 'ExpressionStatement' ? node.expression : null;
	if (!expression) return false;

	if (expression.type === 'UpdateExpression')
		return expression.argument.type === 'Identifier';

	return expression.type === 'AssignmentExpression' && (expression.operator === '+=' || expression.operator === '-=') && expression.left.type === 'Identifier';
}

function root (node) {
	while (node) {
		if (node.type === 'Identifier') return node.name;

		if (node.type === 'ThisExpression') return 'this';

		if (node.type === 'MemberExpression') node = node.object;
		else if (node.type === 'CallExpression' || node.type === 'NewExpression') node = node.callee;
		else if (node.type === 'ChainExpression') node = node.expression;
		else return null;
	}

	return null;
}

function method (node) {
	if (node.type === 'ChainExpression')
		node = node.expression;

	if ((node.type === 'CallExpression' || node.type === 'NewExpression') && node.callee.type === 'MemberExpression' && !node.callee.computed) return node.callee.property.name;

	return null;
}

function unwrap (node) {
	var expression = node.expression;
	if (expression.type === 'AwaitExpression' || (expression.type === 'UnaryExpression' && expression.operator === 'void'))
		expression = expression.argument;

	return expression;
}

function group (node) {
	var expression;

	if (node.type === 'VariableDeclaration') return {Kind: 'var'};

	if (node.type !== 'ExpressionStatement') return null;

	expression = unwrap(node);

	if (expression.type === 'AssignmentExpression' || expression.type === 'UpdateExpression') return {Kind: 'assign', Expression: expression};

	if (expression.type === 'CallExpression' || expression.type === 'NewExpression' || expression.type === 'ChainExpression') {
		if (!root(expression)) return null;

		return {Kind: 'call', Root: root(expression), Method: method(expression), Expression: expression};
	}

	return null;
}

function isRelease (call, assign) {
	var target = assign.Expression;
	var expression = call.Expression.type === 'ChainExpression' ? call.Expression.expression : call.Expression;
	var args = expression.arguments;
	var i = 0;

	if (target.type !== 'AssignmentExpression' || target.operator !== '=' || target.right.type !== 'Literal' || target.right.value !== null) return false;

	if (expression.callee.type === 'MemberExpression' && sameTarget(expression.callee.object, target.left)) return true;

	while (args && i < args.length) {
		if (sameTarget(args[i], target.left)) return true;

		i++;
	}

	return false;
}

function sameTarget (a, b) {
	if (a.type !== b.type) return false;

	if (a.type === 'Identifier') return a.name === b.name;

	if (a.type === 'ThisExpression') return true;

	if (a.type === 'MemberExpression')
		return !a.computed && !b.computed && a.property.name === b.property.name && sameTarget(a.object, b.object);

	return false;
}

function sameGroup (a, b) {
	if (a.Kind !== b.Kind)
		return a.Kind === 'call' && b.Kind === 'assign' && isRelease(a, b);

	if (a.Kind !== 'call') return true;

	return a.Root === b.Root || (a.Method !== null && a.Method === b.Method);
}

function declaredNames (node) {
	var result = [];
	var i = 0;

	if (node.type === 'VariableDeclaration') {
		while (i < node.declarations.length) {
			if (node.declarations[i].id.type === 'Identifier')
				result.push(node.declarations[i].id.name);

			i++;
		}
	}
	else if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && node.expression.left.type === 'Identifier') {
		result.push(node.expression.left.name);
	}

	return result;
}

function references (node, names) {
	var found = false;

	function walk (current) {
		var key;

		if (found || !current || typeof current.type !== 'string') return;

		if (current.type === 'Identifier' && names.indexOf(current.name) !== -1) {
			found = true;

			return;
		}

		for (key in current) {
			if (key === 'parent' || key === 'loc' || key === 'range' || !current[key] || typeof current[key] !== 'object') continue;

			if (Array.isArray(current[key])) current[key].forEach(walk);
			else walk(current[key]);
		}
	}

	if (!names.length) return false;

	walk(node);

	return found;
}

function loopHead (node) {
	return {type: 'LoopHead', parts: [node.init, node.test, node.update, node.left, node.right]};
}

module.exports = {
	meta: {
		type: 'layout',
		fixable: 'whitespace',
		docs: {
			description: 'Enforce the Elemenx blank lines between statements'
		},
		messages: {
			beforeExit: 'Expected a blank line before this statement.',
			beforeIf: 'Expected a blank line before this `if`.',
			beforeLoop: 'Expected a blank line before this loop.',
			beforeTry: 'Expected a blank line before this `try`.',
			afterBlock: 'Expected a blank line after the `if`, loop or `try` above.',
			varIf: 'This `if` tests the variable declared right above it: no blank line between them.',
			beforeIncrement: 'Expected a blank line before the closing increment of the loop.',
			group: 'Expected a blank line between different logical groups (declarations, assignments, calls on another object).'
		},
		schema: []
	},
	create: function (context) {
		var sourceCode = context.sourceCode;

		function lineEnd (line) {
			return sourceCode.getIndexFromLoc({line: line, column: 0}) + sourceCode.lines[line - 1].length;
		}

		function hasBlankLine (previous, current) {
			var line = previous.loc.end.line + 1;

			while (line < current.loc.start.line) {
				if (/^\s*$/.test(sourceCode.lines[line - 1])) return true;

				line++;
			}

			return false;
		}

		function requireBlank (previous, current, messageId) {
			if (hasBlankLine(previous, current)) return;

			context.report({
				node: current,
				messageId: messageId,
				fix: function (fixer) {
					return fixer.insertTextAfterRange([0, lineEnd(previous.loc.end.line)], '\n');
				}
			});
		}

		function forbidBlank (previous, current) {
			if (!hasBlankLine(previous, current)) return;

			context.report({
				node: current,
				messageId: 'varIf',
				fix: function (fixer) {
					if (sourceCode.commentsExistBetween(previous, current)) return null;

					return fixer.replaceTextRange([lineEnd(previous.loc.end.line), sourceCode.getIndexFromLoc({line: current.loc.start.line, column: 0})], '\n');
				}
			});
		}

		function pair (previous, current, last, loop) {
			var previousGroup;
			var currentGroup;

			if (isIf(current)) {
				if (previous.type === 'VariableDeclaration' && isCompactIf(current) && references(current.test, declaredNames(previous))) forbidBlank(previous, current);
				else if (!(isOneLineIf(previous) && isOneLineIf(current))) requireBlank(previous, current, 'beforeIf');

				return;
			}

			if (loop && last && isIncrement(current)) {
				requireBlank(previous, current, 'beforeIncrement');

				return;
			}

			if (Exit[current.type]) {
				requireBlank(previous, current, 'beforeExit');

				return;
			}

			if (Loop[current.type]) {
				if (!references(loopHead(current), declaredNames(previous)))
					requireBlank(previous, current, 'beforeLoop');

				return;
			}

			if (current.type === 'TryStatement') {
				requireBlank(previous, current, 'beforeTry');

				return;
			}

			if (isIf(previous) || Loop[previous.type] || previous.type === 'TryStatement') {
				requireBlank(previous, current, 'afterBlock');

				return;
			}

			previousGroup = group(previous);
			currentGroup = group(current);

			if (previousGroup && currentGroup && !sameGroup(previousGroup, currentGroup))
				requireBlank(previous, current, 'group');
		}

		function check (statements, loop) {
			var i = 1;

			while (i < statements.length) {
				if (statements[i - 1].loc.end.line !== statements[i].loc.start.line)
					pair(statements[i - 1], statements[i], i === statements.length - 1, loop);

				i++;
			}
		}

		return {
			Program: function (node) {
				check(node.body);
			},
			BlockStatement: function (node) {
				check(node.body, node.parent && (node.parent.type === 'WhileStatement' || node.parent.type === 'DoWhileStatement') && node.parent.body === node);
			},
			SwitchCase: function (node) {
				check(node.consequent);
			}
		};
	}
};
