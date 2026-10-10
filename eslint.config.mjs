import stylistic from '@stylistic/eslint-plugin';
import html from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';
import inlineScripts from 'eslint-plugin-html';
import elemenx from './eslint/plugin.js';

/*
 * Mechanical form of docs/CODE-STYLE.md.
 * Shipped code is ES5. Tests and tool configs may use modern syntax, but follow the same formatting.
 * Blank lines never carry whitespace, in any file.
 */

var formatting = {
	'elemenx/if-layout': 'error',
	'elemenx/one-statement-per-line': 'error',
	'elemenx/padding-lines': 'error',
	'elemenx/try-layout': 'error',
	'eqeqeq': ['error', 'always', {null: 'ignore'}],
	'one-var': ['error', 'never'],
	'@stylistic/indent': ['error', 'tab', {SwitchCase: 1}],
	'@stylistic/no-mixed-spaces-and-tabs': 'error',
	'@stylistic/no-trailing-spaces': 'error',
	'@stylistic/brace-style': ['error', 'stroustrup', {allowSingleLine: true}],
	'@stylistic/quotes': ['error', 'single', {avoidEscape: true}],
	'@stylistic/semi': ['error', 'always'],
	'@stylistic/space-before-function-paren': ['error', 'always'],
	'@stylistic/space-before-blocks': ['error', 'always'],
	'@stylistic/keyword-spacing': ['error', {before: true, after: true}],
	'@stylistic/space-infix-ops': 'error',
	'@stylistic/comma-spacing': ['error', {before: false, after: true}],
	'@stylistic/key-spacing': ['error', {beforeColon: false, afterColon: true}],
	'@stylistic/object-curly-spacing': ['error', 'never', {overrides: {ObjectPattern: 'always', ImportDeclaration: 'always', ExportNamedDeclaration: 'always', ImportAttributes: 'always'}}],
	'@stylistic/array-bracket-spacing': ['error', 'never'],
	'@stylistic/space-in-parens': ['error', 'never'],
	'@stylistic/arrow-spacing': ['error', {before: true, after: true}]
};

var plugins = {
	'@stylistic': stylistic,
	elemenx: elemenx
};

export default [
	{
		ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**', 'coverage/**', '**/dist/**', '.vitest/**', '.idea/**']
	},
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'error'
		}
	},
	{
		files: ['elemenx.js', 'elemenx-cli.js', 'tools/**/*.js', 'libraries/**/*.js', 'examples/**/*.js', 'eslint/**/*.js'],
		languageOptions: {
			ecmaVersion: 5,
			sourceType: 'script'
		},
		plugins: plugins,
		rules: formatting
	},
	{
		files: ['tests/**/*.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'script'
		},
		plugins: plugins,
		rules: formatting
	},
	{
		files: ['tests/**/*.test.js', 'tests/**/*.spec.js', 'tests/setup.js', '*.config.js', '*.config.mjs', 'stylelint/**/*.mjs'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module'
		},
		plugins: plugins,
		rules: formatting
	},
	{
		/*
		 * Inline <script> blocks of HTML pages: same JavaScript formatting, the code indented one tab inside <script>.
		 * Pages outside tests/ are ES5.
		 */
		files: ['**/*.html'],
		plugins: Object.assign({html: inlineScripts}, plugins),
		settings: {
			'html/indent': '+tab',
			'html/report-bad-indent': 'error'
		},
		languageOptions: {
			ecmaVersion: 5,
			sourceType: 'script'
		},
		rules: formatting
	},
	{
		files: ['tests/**/*.html'],
		languageOptions: {
			ecmaVersion: 'latest'
		}
	},
	{
		/*
		 * HTML pages and component templates. <head> and <body> stay at the <html> level.
		 * Empty components may be written either way (<Card /> or <Card></Card>).
		 */
		files: ['**/*.html'],
		languageOptions: {
			parser: htmlParser
		},
		plugins: {
			'@html-eslint': html
		},
		rules: {
			'elemenx/html-self-closing': 'error',
			'@html-eslint/indent': ['error', 'tab', {tagChildrenIndent: {html: 0}}],
			'@html-eslint/quotes': ['error', 'double'],
			'@html-eslint/no-extra-spacing-attrs': ['error', {enforceBeforeSelfClose: true, disallowMissing: true}],
			'@html-eslint/no-duplicate-attrs': 'error',
			'@html-eslint/no-trailing-spaces': 'error'
		}
	}
];
