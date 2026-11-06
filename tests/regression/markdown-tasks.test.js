import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('TasksHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

describe('Contract: the tasks of Markdown, boxes of - [ ] and - [x], shown or ticked as TaskCheck allows', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Markdown', 'service:RichText']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('draws a box for each task, ticked as written, only shown by default', async function () {
		var host = mount('<div><Markdown [value]="Text" /></div>', {Text: '# Plan\n\n- [x] Buy milk\n- [ ] Call Ann\n- Not a task\n'});
		var boxes;

		await tick(30);

		boxes = host.$Element().querySelectorAll('.elemenx-markdown-task');

		expect(boxes).toHaveLength(2);
		expect(boxes[0].checked).toBe(true);
		expect(boxes[1].checked).toBe(false);
		expect(boxes[0].disabled).toBe(true);
		expect(boxes[1].closest('li').textContent.trim()).toBe('Call Ann');
		expect(boxes[1].getAttribute('aria-label')).toBe('Call Ann');
	});

	it('ticks a task when editable: writes it into the text and tells task and change; TaskCheck refuses whom it will', async function () {
		var told = [];
		var denied = [];
		var host = mount('<div><Markdown [value]="Text" Tasks="editable" [taskcheck]="Allow" (task)="Told" (taskdenied)="Denied" /></div>', {
			Text: '- [ ] One\n- [ ] Two (admin only)\n',
			Allow: function (item) {
				return item.Index !== 1;
			},
			Told: function (event) {
				told.push(event);
			},
			Denied: function (event) {
				denied.push(event);
			}
		});
		var boxes;

		await tick(30);

		boxes = host.$Element().querySelectorAll('.elemenx-markdown-task');

		expect(boxes[0].disabled).toBe(false);

		boxes[0].click();

		await tick(30);

		expect(told[0]).toMatchObject({Index: 0, Checked: true, Text: 'One', Value: '- [x] One\n- [ ] Two (admin only)\n'});

		boxes = host.$Element().querySelectorAll('.elemenx-markdown-task');

		boxes[1].click();

		await tick(30);

		expect(denied[0]).toMatchObject({Index: 1, Checked: true});
		expect(host.$Element().querySelectorAll('.elemenx-markdown-task')[1].checked).toBe(false);
		expect(told).toHaveLength(1);
	});
});
