/*
 * CSS style (docs/CODE-STYLE.md): CSS files, <style> blocks and style="" attributes in HTML.
 * Author's blank lines and repeated selectors are deliberate and never checked; blank lines carry no whitespace.
 */

export default {
	plugins: ['@stylistic/stylelint-plugin', './stylelint/plugin.mjs'],
	ignoreFiles: ['node_modules/**', '**/dist/**', 'docs-site/**', 'designer-site/**', 'test-results/**', 'playwright-report/**', 'coverage/**', 'examples/Native/android/**', 'examples/Native/ios/**', 'editors/intellij/build/**', 'editors/intellij/.gradle/**', 'editors/intellij/.intellijPlatform/**', 'editors/vscode/core/**'],
	overrides: [
		{
			files: ['**/*.html'],
			customSyntax: 'postcss-html'
		}
	],
	rules: {
		'elemenx/declaration-colon': true,
		'@stylistic/indentation': 'tab',
		'@stylistic/no-eol-whitespace': true,
		'@stylistic/number-leading-zero': 'always',
		'@stylistic/color-hex-case': 'lower',
		'color-hex-length': 'long'
	}
};
