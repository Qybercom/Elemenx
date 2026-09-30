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

	it('component Title is declarative and this.$Title can change it', function () {
		var name=unique('TitleComponent');
		var factory=Elemenx.Component(name,{
			$Title:'Component title',
			$Template:'<div></div>',
			$OnCreate:function () {
				expect(document.title).toBe('Component title');
				this.$Title('Runtime component title');
			}
		});
		var component=factory();
		expect(document.title).toBe('Runtime component title');
		expect(component.$Title()).toBe('Runtime component title');
		component.$Destroy();
		expect(document.title).toBe('Runtime component title');
	});


	it('$OnReady can override declarative Title', function () {
		var name=unique('TitleReadyComponent');
		var factory=Elemenx.Component(name,{
			$Title:'Project - Elemenx',
			$Template:'<div></div>',
			$OnReady:function () {
				this.$Title('Project \"42\" - Elemenx');
			}
		});
		var component=factory();
		expect(document.title).toBe('Project \"42\" - Elemenx');
		component.$Destroy();
	});

	it('Application Title sets the default document title and exposes Title()', function () {
		var componentName=unique('TitleApplicationRoot');
		var applicationName=unique('TitleApplication');
		Elemenx.Component(componentName,{$Template:'<div></div>'});
		var application=Elemenx.Application(applicationName,{$Component:componentName,$Mount:'#mount',$Title:'Application title'});
		expect(document.title).toBe('Application title');
		expect(application.$Title()).toBe('Application title');
		application.$Title('Runtime application title');
		expect(document.title).toBe('Runtime application title');
		application.$Destroy();
	});

	it('route Params are available in $OnReady after $OnCreate', async function () {
		var page=unique('TitleRoutePage'),root=unique('TitleRouteRoot'),applicationName=unique('TitleRouteApplication');
		var createParams=null,readyParams=null;
		Elemenx.Component(page,{
			$Title:'Project - Elemenx',
			$Template:'<div></div>',
			$OnCreate:function () {
				createParams=this.$Params;
			},
			$OnReady:function () {
				readyParams=this.$Params;
				this.$Title('Project "' + this.$Params.id + '" - Elemenx');
			}
		});
		Elemenx.Component(root,{$Template:'<main *outlet="Content"></main>'});
		var application=Elemenx.Application(applicationName,{
			$Component:root,
			$Mount:'#mount',
			$Router:{Routes:[{Path:'/project/:id',Component:page}]}
		});
		application.$Router().Go('/project/42');
		await new Promise(function (resolve) {setTimeout(resolve,20);});
		expect(createParams).toBeUndefined();
		expect(readyParams.id).toBe('42');
		expect(document.title).toBe('Project "42" - Elemenx');
		application.$Destroy();
	});

});