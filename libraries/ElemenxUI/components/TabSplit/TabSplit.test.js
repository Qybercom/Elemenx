import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';
import splitSource from './TabSplit.js?raw';
import splitTemplate from './TabSplit.html?raw';
import groupSource from '../TabGroup/TabGroup.js?raw';

var owned = [];

describe('Regression: a TabSplit given its layout before its TabGroup loads', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Tab', 'TabRow', 'TabColumn', 'ContextMenu', 'Icon', 'service:Panels', '*draggable', '*droppable']);

		/* The TabGroup loads its template, as in an Application: the TabSplit reads its layout before the groups have a body. */
		new Function(groupSource.replace(/\n\t\$StyleURL: '[^']*',/, '').replace("$TemplateURL: 'TabGroup.html'", "$TemplateURL: '/libraries/ElemenxUI/components/TabGroup/TabGroup.html'"))();
		new Function(splitSource.replace(/\n\t\$StyleURL: '[^']*',/, '').replace("$TemplateURL: 'TabSplit.html'", function () {
			return '$Template: ' + JSON.stringify(splitTemplate);
		}))();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/* Its panels were put into the bodies of the groups before the groups had one: they stayed hidden in its source. */
	it('puts the panels into the groups once the groups are there', async function () {
		var component = Elemenx.Component(unique('LateSplit'), {
			$Template: '<div style="height: 200px"><TabSplit [layout]="Saved"><Tab ID="one" Label="one.js">One</Tab><Tab ID="two" Label="two.js">Two</Tab></TabSplit></div>',
			Saved: {Split: 'row', Sizes: [50, 50], Children: [{Group: 'left', Tabs: ['one'], Active: 'one'}, {Group: 'right', Tabs: ['two'], Active: 'two'}]}
		})();
		var root;

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		root = component.$Element();

		await waitFor(function () {
			return root.querySelectorAll('.elemenx-tab-group-tab').length === 2;
		}, 15000);

		await waitFor(function () {
			return root.querySelectorAll('.elemenx-tab-group-body > .elemenx-tab-panel.active').length === 2;
		}, 15000);

		expect(Array.prototype.map.call(root.querySelectorAll('.elemenx-tab-group-body > .elemenx-tab-panel.active'), function (panel) {
			return panel.textContent.trim();
		})).toEqual(['One', 'Two']);
		expect(root.querySelectorAll('.elemenx-tab-split-source .elemenx-tab-panel').length).toBe(0);
	});
});
