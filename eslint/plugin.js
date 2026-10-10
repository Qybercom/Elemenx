'use strict';

module.exports = {
	meta: {
		name: 'eslint-plugin-elemenx'
	},
	rules: {
		'if-layout': require('./rules/if-layout.js'),
		'html-self-closing': require('./rules/html-self-closing.js'),
		'one-statement-per-line': require('./rules/one-statement-per-line.js'),
		'padding-lines': require('./rules/padding-lines.js'),
		'try-layout': require('./rules/try-layout.js')
	}
};
