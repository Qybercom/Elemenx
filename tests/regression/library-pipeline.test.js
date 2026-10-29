import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('PipelineHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function names (root, selector) {
	return Array.prototype.map.call(root.querySelectorAll(selector), function (node) {
		return node.textContent.replace(/\s+/g, ' ').trim();
	});
}

describe('Contract: Pipeline, the stages and jobs of CI as GitHub and GitLab show them', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Pipeline', 'PipelineStage', 'PipelineJob']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('shows the stages given and declared, their jobs, a matrix as one card, the status of each stage and of the whole', async function () {
		var host = mount('<div style="width: 900px"><Pipeline Title="main" [stages]="Stages"><PipelineStage ID="deploy" Name="Deploy"><PipelineJob ID="ship" Name="Ship" Status="manual" Needs="unit, lint" /></PipelineStage></Pipeline></div>', {
			Stages: [
				{ID: 'build', Name: 'Build', Jobs: [{ID: 'compile', Name: 'Compile', Status: 'success', Duration: 72}]},
				{ID: 'test', Name: 'Test', Jobs: [
					{ID: 'unit', Name: 'Unit', Status: 'failed', Duration: 125, Needs: ['compile']},
					{ID: 'node-18', Name: 'Node 18', Status: 'success', Group: 'node', Needs: ['compile']},
					{ID: 'node-20', Name: 'Node 20', Status: 'running', Group: 'node', Needs: ['compile']},
					{ID: 'lint', Name: 'Lint', Status: 'success', Duration: 9}
				]}
			]
		});
		var root;
		var group;

		expect(await waitFor(function () {
			return host.$Element().querySelectorAll('.elemenx-pipeline-stage').length === 3;
		}, 3000)).toBe(true);

		root = host.$Element();

		expect(names(root, '.elemenx-pipeline-stage-header')).toEqual(['Build', 'Test', 'Deploy']);
		expect(names(root, '.elemenx-pipeline-stage[data-stage="test"] .elemenx-pipeline-job-name')).toEqual(['Unit', 'node', 'Lint']);
		expect(root.querySelector('[data-id="compile"] .elemenx-pipeline-time').textContent).toBe('1m 12s');
		expect(root.querySelector('.elemenx-pipeline-stage[data-stage="test"] .elemenx-pipeline-stage-header .elemenx-pipeline-status').className).toContain('failed');
		expect(root.querySelector('.elemenx-pipeline-header .elemenx-pipeline-summary').textContent).toContain('Failed');

		/* The matrix: one card of the group, its count and its worst status; a press opens it. */
		group = root.querySelector('[data-group="node"]');

		expect(group.querySelector('.elemenx-pipeline-count').textContent).toBe('2');
		expect(group.className).toContain('running');

		group.click();

		await tick(20);

		expect(names(root, '.elemenx-pipeline-job.inner .elemenx-pipeline-job-name')).toEqual(['Node 18', 'Node 20']);
		expect(group.getAttribute('aria-expanded')).toBe('true');

		/* The links of the needs: compile to unit and to both jobs of the open group, unit and lint to ship. */
		expect(await waitFor(function () {
			return root.querySelectorAll('.elemenx-pipeline-link').length === 5;
		}, 3000)).toBe(true);
	});

	it('marks the chain of a job under the pointer, selects a job, tells its action, and goes from job to job by the keys', async function () {
		var selected = [];
		var actions = [];
		var host = mount('<div style="width: 900px"><Pipeline Summary="false" [stages]="Stages" (select)="Chosen" (action)="Acted" /></div>', {
			Stages: [
				{ID: 'a', Name: 'A', Jobs: [{ID: 'one', Name: 'One', Status: 'success'}, {ID: 'two', Name: 'Two', Status: 'success'}]},
				{ID: 'b', Name: 'B', Jobs: [{ID: 'three', Name: 'Three', Status: 'failed', Needs: ['one']}]}
			],
			Chosen: function (event) {
				selected.push(event.Job.ID + '@' + event.Stage);
			},
			Acted: function (event) {
				actions.push(event.Action + ':' + event.Job.ID);
			}
		});
		var root;

		expect(await waitFor(function () {
			return !!host.$Element().querySelector('[data-id="three"]');
		}, 3000)).toBe(true);

		root = host.$Element();

		root.querySelector('[data-id="three"]').dispatchEvent(new PointerEvent('pointerenter'));

		await tick(20);

		expect(root.querySelector('[data-id="one"]').className).toContain('related');
		expect(root.querySelector('[data-id="two"]').className).toContain('faded');

		root.querySelector('[data-id="three"]').click();
		root.querySelector('[data-id="three"] .elemenx-pipeline-action').click();

		await tick(20);

		expect(selected).toEqual(['three@b']);
		expect(actions).toEqual(['retry:three']);
		expect(root.querySelector('[data-id="three"]').className).toContain('selected');

		/* Down in a stage, across to the next one. */
		root.querySelector('[data-id="one"]').focus();
		root.querySelector('[data-id="one"]').dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}));

		expect(document.activeElement.getAttribute('data-id')).toBe('two');

		document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));

		expect(document.activeElement.getAttribute('data-id')).toBe('three');
	});

	it('counts the time of a running job from Started, and joins the stages without needs', async function () {
		var host = mount('<div style="width: 900px"><Pipeline [stages]="Stages" /></div>', {
			Stages: [
				{ID: 'a', Name: 'A', Jobs: [{ID: 'one', Name: 'One', Status: 'success', Duration: 5}]},
				{ID: 'b', Name: 'B', Jobs: [{ID: 'run', Name: 'Run', Status: 'running', Started: Date.now() - 65000}, {ID: 'wait', Name: 'Wait', Status: 'pending'}]}
			]
		});
		var root;

		expect(await waitFor(function () {
			return !!host.$Element().querySelector('[data-id="run"] .elemenx-pipeline-time');
		}, 3000)).toBe(true);

		root = host.$Element();

		expect(root.querySelector('[data-id="run"] .elemenx-pipeline-time').textContent).toMatch(/^1m [5-9]s$/);
		expect(root.querySelector('[data-id="run"] .elemenx-pipeline-action').getAttribute('data-action')).toBe('cancel');

		/* Stages: one line out of the card of A, one into each card of B. */
		expect(await waitFor(function () {
			return root.querySelectorAll('.elemenx-pipeline-link').length === 3;
		}, 3000)).toBe(true);
	});
});
