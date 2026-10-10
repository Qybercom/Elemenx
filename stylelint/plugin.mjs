import stylelint from 'stylelint';

/*
 * elemenx/declaration-colon: no space before the colon of a declaration; after it exactly one space,
 * or a line break when a multi-component value (box-shadow, transition, grid-template...) is split by logical groups.
 * The indentation of the moved groups (one level deeper than the declaration) is checked by @stylistic/indentation.
 *
 * Written in ES5 style; only the module syntax is required by stylelint.
 */

var ruleName = 'elemenx/declaration-colon';

var messages = stylelint.utils.ruleMessages(ruleName, {
	rejected: 'Expected ": " or a line break after the colon, and no space before it'
});

function valid (between) {
	return /^:( |\r?\n[ \t]*)$/.test(between);
}

function rule (primary) {
	return function (root, result) {
		var validOptions = stylelint.utils.validateOptions(result, ruleName, {actual: primary, possible: [true]});
		if (!validOptions) return;

		root.walkDecls(function (decl) {
			var between = decl.raws.between || '';
			if (between.indexOf('/*') !== -1 || valid(between)) return;

			stylelint.utils.report({
				ruleName: ruleName,
				result: result,
				node: decl,
				message: messages.rejected,
				word: decl.prop + between,
				fix: function () {
					decl.raws.between = /\n/.test(between) ? ':' + between.slice(between.search(/\r?\n/)) : ': ';
				}
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = {
	url: 'docs/CODE-STYLE.md',
	fixable: true
};

export default stylelint.createPlugin(ruleName, rule);
