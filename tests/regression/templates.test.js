import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: Template / TemplateID', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('Template is inline markup and does not require a DOM template', function () {
		var name=unique('Inline');
		Elemenx.Component(name,{$Template:'<article class="inline-template">{{value}}</article>'});
		var c=Elemenx.Component(name)({value:'INLINE'});
		document.getElementById('mount').appendChild(c.$Element());
		expect(document.querySelector('.inline-template').textContent).toBe('INLINE');
		c.$Destroy();
	});

	it('TemplateID resolves the requested DOM template', function () {
		var name=unique('ByID'), id=unique('Template');
		var t=document.createElement('template');
		t.id=id;
		t.innerHTML='<article class="id-template">{{value}}</article>';
		document.body.appendChild(t);
		Elemenx.Component(name,{$TemplateID:id});
		var c=Elemenx.Component(name)({value:'DOM'});
		document.getElementById('mount').appendChild(c.$Element());
		expect(document.querySelector('.id-template').textContent).toBe('DOM');
		c.$Destroy();
		t.remove();
	});

	it('Template takes precedence over TemplateID', function () {
		var name=unique('Priority'), id=unique('Template');
		var t=document.createElement('template');
		t.id=id;
		t.innerHTML='<div class="wrong">WRONG</div>';
		document.body.appendChild(t);
		Elemenx.Component(name,{$Template:'<div class="right">RIGHT</div>',$TemplateID:id});
		var c=Elemenx.Component(name)();
		document.getElementById('mount').appendChild(c.$Element());
		expect(document.querySelector('.right')).not.toBeNull();
		expect(document.querySelector('.wrong')).toBeNull();
		c.$Destroy();
		t.remove();
	});
	it('Component tags preserve case and do not capture native HTML tags', function () {
		var buttonName='Button';
		Elemenx.Component(buttonName,{$Template:'<strong class="custom-button">component</strong>'});
		var hostName=unique('CaseHost');
		Elemenx.Component(hostName,{$Template:'<section><Button /><button class="native-button">native</button></section>'});
		var host=Elemenx.Component(hostName)();
		expect(host.$Element().querySelector('.custom-button').textContent).toBe('component');
		expect(host.$Element().querySelector('button.native-button').textContent).toBe('native');
		host.$Destroy();
	});
});