import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: Document Title', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); document.title=''; });

	it('Elemenx.Title reads and writes document title', function () {
		expect(Elemenx.Title()).toBe('');
		expect(Elemenx.Title('Global title')).toBe(Elemenx);
		expect(document.title).toBe('Global title');
		expect(Elemenx.Title()).toBe('Global title');
	});

	it('component Title is declarative and this.Title can change it', function () {
		var name=unique('TitleComponent');
		var factory=Elemenx.Component(name,{
			Title:'Component title',
			Template:'<div></div>',
			ElemenxOnCreate:function () {
				expect(document.title).toBe('Component title');
				this.Title('Runtime component title');
			}
		});
		var component=factory();
		expect(document.title).toBe('Runtime component title');
		expect(component.Title()).toBe('Runtime component title');
		component.Destroy();
		expect(document.title).toBe('Runtime component title');
	});

	it('Application Title sets the default document title and exposes Title()', function () {
		var componentName=unique('TitleApplicationRoot');
		var applicationName=unique('TitleApplication');
		Elemenx.Component(componentName,{Template:'<div></div>'});
		var application=Elemenx.Application(applicationName,{Component:componentName,Mount:'#mount',Title:'Application title'});
		expect(document.title).toBe('Application title');
		expect(application.Title()).toBe('Application title');
		application.Title('Runtime application title');
		expect(document.title).toBe('Runtime application title');
		application.Destroy();
	});
});