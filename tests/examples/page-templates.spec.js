import { test, expect } from '../coverage/playwright.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

import Server from '../../tools/server.js';

/*
 * A <template id> of a page, served by the server of Elemenx: its Components named as elements of HTML (Table, Select)
 * and its self-closing tags reach Elemenx as they were written, where the parser of a <template> lowered and nested them.
 */
var Page = [
	'<!doctype html>',
	'<html>',
	'<head>',
	'	<script src="/elemenx.js"></script>',
	'	<script>',
	'		Elemenx.Component(\'Table\', {$Template: \'<div class="component-table">{{Caption}}</div>\', Caption: \'\'});',
	'		Elemenx.Component(\'Select\', {$Template: \'<div class="component-select">{{Options.length}}</div>\', Options: []});',
	'		Elemenx.Component(\'Card\', {$Template: \'<div class="component-card"><slot></slot></div>\'});',
	'		Elemenx.Component(\'PageApp\', {$TemplateID: \'page-app\', Note: \'\', Items: [1, 2, 3]});',
	'		Elemenx.Application(\'PageTemplates\', {$Component: \'PageApp\', $Mount: \'#app\'});',
	'	</script>',
	'</head>',
	'<body>',
	'	<div id="app"></div>',
	'	<template id="page-app">',
	'		<main>',
	'			<Table Caption="Orders" />',
	'			<Select [Options]="Items"><b class="inside">no option</b></Select>',
	'			<Card />',
	'			<textarea class="note"></textarea>',
	'			<p class="after">after</p>',
	'		</main>',
	'	</template>',
	'</body>',
	'</html>'
].join('\n');

test('a <template id> of a page keeps the case of its tags and its self-closing Components', async function ({ page }) {
	var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-page-templates-'));
	var server = Server.Create({Root: root});
	var errors = [];

	fs.writeFileSync(path.join(root, 'index.html'), Page);

	await new Promise(function (resolve) {
		server.Listen(0, '127.0.0.1', resolve);
	});

	page.on('pageerror', function (error) {
		errors.push(error.message);
	});

	try {
		await page.goto('http://127.0.0.1:' + server.Server.address().port + '/');

		await expect(page.locator('.component-table')).toHaveText('Orders');
		await expect(page.locator('.component-select')).toHaveText('3');
		await expect(page.locator('.component-card')).toHaveCount(1);
		/* <Card /> holds nothing: the paragraph after it is a sibling, not projected into the card. */
		await expect(page.locator('.component-card .after')).toHaveCount(0);
		await expect(page.locator('main > .after')).toHaveText('after');
		await expect(page.locator('main > textarea.note')).toHaveCount(1);
		await expect(page.locator('table, select')).toHaveCount(0);

		expect(errors).toEqual([]);
	}
	finally {
		await new Promise(function (resolve) {
			server.Close(resolve);
		});

		fs.rmSync(root, {recursive: true, force: true});
	}
});
