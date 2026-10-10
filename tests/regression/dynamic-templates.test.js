import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

describe('Regression: dynamic templates / structural composition', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () { resetDOM(); });

	it('Function Template creates independent reactive instances', async function () {
		var name = unique('DynamicTemplateBasic');
		var source = '<section class="remote">{{message}}</section>';

		Elemenx.Component(name, {
			$Template: function () { return source; },
			$OnCreate: function (data) { this.message = data.message; }
		});

		var factory = Elemenx.Component(name);
		var a = factory({message: 'A'});
		var b = factory({message: 'B'});
		var mount = document.getElementById('mount');

		mount.appendChild(a.$Element());
		mount.appendChild(b.$Element());

		await tick();

		var nodes = document.querySelectorAll('.remote');

		expect(nodes.length).toBe(2);
		expect(nodes[0].textContent).toBe('A');
		expect(nodes[1].textContent).toBe('B');

		a.message = 'A2';

		await tick();

		expect(nodes[0].textContent).toBe('A2');
		expect(nodes[1].textContent).toBe('B');

		a.$Destroy();
		b.$Destroy();
	});

	it('Function Template recreates nested *if with current state', async function () {
		var name = unique('DynamicTemplateIf');
		var owner;
		var source = '<div><section *if="outer"><b *if="inner" class="leaf">{{text}}</b></section></div>';

		Elemenx.Component(name, {
			$Template: function () { return source; },
			$OnCreate: function () {
				owner = this;
				this.outer = true;
				this.inner = true;
				this.text = 'A';
			}
		});

		var c = Elemenx.Component(name)({});

		document.getElementById('mount').appendChild(c.$Element());

		await tick();

		expect(document.querySelector('.leaf').textContent).toBe('A');

		owner.inner = false;

		await tick();

		expect(document.querySelector('.leaf')).toBeNull();

		owner.inner = true;
		owner.text = 'B';

		await tick();

		expect(document.querySelector('.leaf').textContent).toBe('B');

		owner.outer = false;

		await tick();

		expect(document.querySelector('.leaf')).toBeNull();

		owner.outer = true;

		await tick();

		expect(document.querySelector('.leaf').textContent).toBe('B');

		c.$Destroy();
	});

	it('Function Template preserves keyed data-for identity and events', async function () {
		var row = unique('DynamicTemplateRow');
		var root = unique('DynamicTemplateEach');
		var owner;
		var hits = '';
		var source = '<div><' + row + ' *for="item of items" *key="item.id" id="{{item.id}}" name="{{item.name}}"></' + row + '></div>';

		Elemenx.Component(row, {
			$Template: '<button class="row" (click)="Hit">{{name}}</button>',
			Hit: function () { hits += this.name; }
		});
		Elemenx.Component(root, {
			$Template: function () { return source; },
			$OnCreate: function () {
				owner = this;
				this.items = [{id: 1, name: 'A'}, {id: 2, name: 'B'}, {id: 3, name: 'C'}];
			}
		});

		var c = Elemenx.Component(root)({});

		document.getElementById('mount').appendChild(c.$Element());

		await tick();

		var nodes = document.querySelectorAll('.row');
		var a = nodes[0];
		var cc = nodes[2];

		owner.items = [{id: 3, name: 'C2'}, {id: 4, name: 'D'}, {id: 1, name: 'A2'}];

		await tick();

		nodes = document.querySelectorAll('.row');

		expect(nodes.length).toBe(3);
		expect(nodes[0]).toBe(cc);
		expect(nodes[2]).toBe(a);
		expect(nodes[0].textContent).toBe('C2');
		expect(nodes[2].textContent).toBe('A2');

		nodes[0].click();
		nodes[2].click();

		expect(hits).toBe('C2A2');

		c.$Destroy();
	});

	it('Function Template composes data-if with keyed component collection', async function () {
		var cell = unique('DynamicTemplateCell');
		var root = unique('DynamicTemplateMix');
		var owner;
		var made = 0;
		var gone = 0;
		var source = '<div><section *if="show"><' + cell + ' *for="item of items" *key="item.id" id="{{item.id}}" name="{{item.name}}"></' + cell + '></section></div>';

		Elemenx.Component(cell, {
			$Template: '<span class="cell">{{name}}</span>',
			$OnCreate: function () { made++; },
			$OnDestroy: function () { gone++; }
		});
		Elemenx.Component(root, {
			$Template: function () { return source; },
			$OnCreate: function () {
				owner = this;
				this.show = true;
				this.items = [{id: 1, name: 'A'}, {id: 2, name: 'B'}];
			}
		});

		var c = Elemenx.Component(root)({});

		document.getElementById('mount').appendChild(c.$Element());

		await tick();

		expect(document.querySelectorAll('.cell').length).toBe(2);

		owner.show = false;

		await tick();

		expect(document.querySelectorAll('.cell').length).toBe(0);

		owner.items = [{id: 2, name: 'B2'}, {id: 3, name: 'C'}];
		owner.show = true;

		await tick();

		var nodes = document.querySelectorAll('.cell');

		expect(nodes.length).toBe(2);
		expect(nodes[0].textContent).toBe('B2');
		expect(nodes[1].textContent).toBe('C');
		expect(made).toBe(4);
		expect(gone).toBe(2);

		c.$Destroy();
	});

	it('Function Template destroy/recreate detaches dead listeners', async function () {
		var name = unique('DynamicTemplateDead');
		var made = 0;
		var gone = 0;
		var hits = 0;
		var source = '<button class="dead" (click)="Hit">{{text}}</button>';

		Elemenx.Component(name, {
			$Template: function () { return source; },
			$OnCreate: function (data) {
				made++;
				this.text = data.text;
			},
			$OnDestroy: function () { gone++; },
			Hit: function () { hits++; }
		});

		var factory = Elemenx.Component(name);
		var mount = document.getElementById('mount');
		var a = factory({text: 'A'});

		mount.appendChild(a.$Element());

		await tick();

		var old = document.querySelector('.dead');

		old.click();

		a.$Destroy();

		old.click();

		var b = factory({text: 'B'});

		mount.appendChild(b.$Element());

		await tick();

		document.querySelector('.dead').click();

		expect(made).toBe(2);
		expect(gone).toBe(1);
		expect(hits).toBe(2);
		expect(old.isConnected).toBe(false);
		expect(document.querySelector('.dead').textContent).toBe('B');

		b.$Destroy();
	});

	it('Function Template composes slot projection with structural content', async function () {
		var box = unique('DynamicTemplateBox');
		var root = unique('DynamicTemplateSlot');
		var owner;
		var source = '<div><' + box + '><b *if="show" class="projected">{{text}}</b></' + box + '></div>';

		Elemenx.Component(box, {$Template: '<div class="box"><slot></slot></div>'});
		Elemenx.Component(root, {
			$Template: function () { return source; },
			$OnCreate: function () {
				owner = this;
				this.show = true;
				this.text = 'A';
			}
		});

		var c = Elemenx.Component(root)({});

		document.getElementById('mount').appendChild(c.$Element());

		await tick();

		var projected = document.querySelector('.projected');

		expect(projected.closest('.box')).not.toBeNull();

		owner.show = false;

		await tick();

		expect(document.querySelector('.projected')).toBeNull();

		owner.text = 'B';
		owner.show = true;

		await tick();

		projected = document.querySelector('.projected');

		expect(projected).not.toBeNull();
		expect(projected.textContent).toBe('B');

		c.$Destroy();
	});

	it('Function Template survives deep model / nested-if / keyed / event composition', async function () {
		var row = unique('DynamicTemplateDeepRow');
		var root = unique('DynamicTemplateDeep');
		var owner;
		var hits = '';
		var source = '<div><input class="edit" [(value)]="title"><section *if="outer"><div *if="inner">' +
			'<' + row + ' *for="item of items" *key="item.id" id="{{item.id}}" name="{{item.name}}"></' + row + '></div></section></div>';

		Elemenx.Component(row, {
			$Template: '<button class="deep-row" (click)="Hit">{{name}}</button>',
			Hit: function () { hits += this.name; }
		});
		Elemenx.Component(root, {
			$Template: function () { return source; },
			$OnCreate: function () {
				owner = this;
				this.title = 'T';
				this.outer = true;
				this.inner = true;
				this.items = [{id: 1, name: 'A'}, {id: 2, name: 'B'}];
			}
		});

		var c = Elemenx.Component(root)({});

		document.getElementById('mount').appendChild(c.$Element());

		await tick();

		var input = document.querySelector('.edit');

		expect(input.value).toBe('T');

		input.value = 'T2';

		input.dispatchEvent(new Event('input', {bubbles: true}));

		await tick();

		expect(owner.title).toBe('T2');

		var rows = document.querySelectorAll('.deep-row');
		var a = rows[0];

		owner.items = [{id: 2, name: 'B2'}, {id: 1, name: 'A2'}];

		await tick();

		rows = document.querySelectorAll('.deep-row');

		expect(rows[1]).toBe(a);

		rows[1].click();

		owner.inner = false;

		await tick();

		expect(document.querySelectorAll('.deep-row').length).toBe(0);

		owner.inner = true;

		await tick();

		rows = document.querySelectorAll('.deep-row');

		expect(rows.length).toBe(2);
		expect(rows[0].textContent).toBe('B2');
		expect(rows[1].textContent).toBe('A2');

		rows[0].click();

		expect(hits).toBe('A2B2');

		c.$Destroy();
	});

	it('TemplateID waits for a template parsed later and completes deferred lifecycle', async function () {
		var child = unique('LateTemplateChild');
		var owner = unique('LateTemplateOwner');
		var pending = 0;
		var ready = 0;

		Elemenx.Component(child, {$TemplateID: 'LateTemplateID', Value: 'ready'});
		Elemenx.Component(owner, {
			$Template: '<div><' + child + ' *pending="Waiting"></' + child + '></div>',
			Waiting: 'Loading late template',
			$OnChildPending: function () { pending++; },
			$OnChildReady: function () { ready++; }
		});

		var component = Elemenx.Component(owner)({});

		document.getElementById('mount').appendChild(component.$Element());

		await tick();

		expect(document.getElementById('mount').textContent).toContain('Waiting');
		expect(pending).toBe(1);

		var template = document.createElement('template');

		template.id = 'LateTemplateID';
		template.innerHTML = '<strong class="late-template">{{Value}}</strong>';

		document.body.appendChild(template);

		await tick();
		await tick();

		expect(document.getElementById('LateTemplateID')).toBeNull();
		expect(Elemenx.Template('LateTemplateID')).toContain('late-template');
		expect(document.querySelector('.late-template').textContent).toBe('ready');
		expect(ready).toBe(1);

		component.$Destroy();

		template.remove();
	});


	it('Template registry supports an additional asynchronous loader for TemplateID', async function () {
		var templateID = unique('LoadedTemplate');
		var child = unique('LoadedTemplateChild');
		var requested = 0;

		Elemenx.Template.Loader(function (name, ready) {
			if (name !== templateID) return null;

			requested++;

			setTimeout(function () { ready('<em class="loaded-template">loaded</em>'); }, 0);

			return null;
		});
		Elemenx.Component(child, {$TemplateID: templateID});

		var component = Elemenx.Component(child)({});

		document.getElementById('mount').appendChild(component.$Element());

		await tick();
		await tick();

		expect(requested).toBe(1);
		expect(Elemenx.Template(templateID)).toContain('loaded-template');
		expect(document.querySelector('.loaded-template').textContent).toBe('loaded');

		component.$Destroy();
	});

	it('Template.Reload updates live TemplateID component instances from the registry', async function () {
		var templateID = unique('ReloadTemplate');
		var child = unique('ReloadTemplateChild');

		Elemenx.Template(templateID, '<strong class="registry-reload">A</strong>');
		Elemenx.Component(child, {$TemplateID: templateID});

		var component = Elemenx.Component(child)({});

		document.getElementById('mount').appendChild(component.$Element());

		await tick();

		expect(document.querySelector('.registry-reload').textContent).toBe('A');

		var count = Elemenx.Template.Reload(templateID, '<strong class="registry-reload">B</strong>');

		await tick();
		await tick();

		expect(count).toBeGreaterThan(0);
		expect(document.querySelector('.registry-reload').textContent).toBe('B');

		component.$Destroy();
	});

	it('Application exposes the shared Template Registry without shadowing Component Template', async function () {
		var templateID = unique('ApplicationTemplate');
		var rootName = unique('ApplicationTemplateRoot');
		var applicationName = unique('ApplicationTemplateApp');
		var componentRead = null;
		var bootstrapApplication = null;

		Elemenx.Component(rootName, {
			$Template: '<div class="application-template-access">ready</div>',
			$OnCreate: function () {
				componentRead = this.$Application().$Template(templateID);
			}
		});

		var application = Elemenx.Application(applicationName, {
			$Component: rootName,
			$Mount: '#mount',
			$Bootstrap: function () {
				bootstrapApplication = this;

				this.$Template(templateID, '<span>from application</span>');
			}
		});

		await tick();

		expect(bootstrapApplication).toBe(application);
		expect(application.$Template(templateID)).toContain('from application');
		expect(application.$Template.Has(templateID)).toBe(true);
		expect(componentRead).toContain('from application');
		expect(Elemenx.Template(templateID)).toBe(application.$Template(templateID));

		application.$Template.Reload(templateID, '<span>reloaded</span>');

		expect(Elemenx.Template(templateID)).toContain('reloaded');

		application.$Template.Remove(templateID);

		expect(Elemenx.Template.Has(templateID)).toBe(false);

		application.$Destroy();
	});

});