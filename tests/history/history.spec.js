import { test, expect } from '@playwright/test';

async function boot (page) {
	await page.goto('/tests/history/fixture.html');
}

test.describe('Regression: real browser session history', function () {
	test('Params / Query / Hash survive multi-step back/forward', async function ({ page }) {
		await boot(page);
		await page.evaluate(function () {
			Elemenx.Component('HRoot',{Template:'<main data-outlet="Content"></main>'});
			Elemenx.Component('HPage',{Template:'<div id="v">{{Params.id}}|{{Query.q}}|{{Hash}}</div>'});
			window.App=Elemenx.Application('HApp',{Component:'HRoot',Mount:'#mount'});
			window.Router=Elemenx.Router({Root:App.Component(),Routes:[{Path:'/hs/:id',Component:'HPage'}]});
			Router.Start();
		});
		await page.evaluate(function(){Router.Go('/hs/1?q=a#x');});
		await expect(page.locator('#v')).toHaveText('1|a|x');
		await page.evaluate(function(){Router.Go('/hs/2?q=b#y');});
		await expect(page.locator('#v')).toHaveText('2|b|y');
		await page.evaluate(function(){Router.Go('/hs/3?q=c#z');});
		await expect(page.locator('#v')).toHaveText('3|c|z');
		await page.goBack(); await expect(page.locator('#v')).toHaveText('2|b|y');
		await page.goBack(); await expect(page.locator('#v')).toHaveText('1|a|x');
		await page.goForward(); await expect(page.locator('#v')).toHaveText('2|b|y');
	});

	test('nested common-prefix instances survive popstate', async function ({ page }) {
		await boot(page);
		await page.evaluate(function () {
			window.PMade=0;window.CMade=0;window.PGone=0;window.CGone=0;
			Elemenx.Component('HRRoot',{Template:'<main data-outlet="Content"></main>'});
			Elemenx.Component('HRParent',{Template:'<section id="p">{{Params.id}}<div data-outlet="Content"></div></section>',ElemenxOnCreate:function(){PMade++;window.P=this;},ElemenxOnDestroy:function(){PGone++;}});
			Elemenx.Component('HRChild',{Template:'<b id="c">{{Query.q}}|{{Hash}}</b>',ElemenxOnCreate:function(){CMade++;window.C=this;},ElemenxOnDestroy:function(){CGone++;}});
			window.App=Elemenx.Application('HRApp',{Component:'HRRoot',Mount:'#mount'});
			window.Router=Elemenx.Router({Root:App.Component(),Routes:[{Path:'/hr/:id',Component:'HRParent',Routes:[{Path:'child',Component:'HRChild'}]}]});
			Router.Start();
		});
		await page.evaluate(function(){Router.Go('/hr/1/child?q=a#x');window.P0=P;window.C0=C;});
		await page.evaluate(function(){Router.Go('/hr/2/child?q=b#y');});
		await page.goBack();
		await expect(page.locator('#c')).toHaveText('a|x');
		var state=await page.evaluate(function(){return {p:P===P0,c:C===C0,pm:PMade,cm:CMade,pg:PGone,cg:CGone};});
		expect(state).toEqual({p:true,c:true,pm:1,cm:1,pg:0,cg:0});
	});

	test('Replace mutates current history entry', async function ({ page }) {
		await boot(page);
		await page.evaluate(function () {
			Elemenx.Component('XRRoot',{Template:'<main data-outlet="Content"></main>'});
			Elemenx.Component('XRPage',{Template:'<div id="x">{{Params.id}}|{{Query.q}}</div>'});
			window.App=Elemenx.Application('XRApp',{Component:'XRRoot',Mount:'#mount'});
			window.Router=Elemenx.Router({Root:App.Component(),Routes:[{Path:'/rx/:id',Component:'XRPage'}]});
			Router.Start();
			Router.Go('/rx/1?q=a');Router.Replace('/rx/2?q=b');Router.Go('/rx/3?q=c');
		});
		await expect(page.locator('#x')).toHaveText('3|c');
		await page.goBack();
		await expect(page.locator('#x')).toHaveText('2|b');
	});

	test('repeated history cycles reuse route instance without lifecycle churn', async function ({ page }) {
		await boot(page);
		await page.evaluate(function () {
			window.CycleMade=0;window.CycleGone=0;
			Elemenx.Component('CYRoot',{Template:'<main data-outlet="Content"></main>'});
			Elemenx.Component('CYPage',{
				Template:'<div id="cycle">{{Params.id}}</div>',
				ElemenxOnCreate:function(){CycleMade++;},
				ElemenxOnDestroy:function(){CycleGone++;}
			});
			window.App=Elemenx.Application('CYApp',{Component:'CYRoot',Mount:'#mount'});
			window.Router=Elemenx.Router({Root:App.Component(),Routes:[{Path:'/cycle/:id',Component:'CYPage'}]});
			Router.Start();
			Router.Go('/cycle/1');
			Router.Go('/cycle/2');
			Router.Go('/cycle/3');
		});
		await expect(page.locator('#cycle')).toHaveText('3');
		await page.goBack();await expect(page.locator('#cycle')).toHaveText('2');
		await page.goBack();await expect(page.locator('#cycle')).toHaveText('1');
		await page.goForward();await expect(page.locator('#cycle')).toHaveText('2');
		await page.goForward();await expect(page.locator('#cycle')).toHaveText('3');
		await page.goBack();await expect(page.locator('#cycle')).toHaveText('2');
		await page.goForward();await expect(page.locator('#cycle')).toHaveText('3');
		var state=await page.evaluate(function(){return {made:CycleMade,gone:CycleGone,text:document.getElementById('cycle').textContent};});
		expect(state).toEqual({made:1,gone:0,text:'3'});
	});

});

test.describe('Regression: Router public history facade', function () {
	test('Router.Back and Router.Forward drive real browser session history', async function ({ page }) {
		await boot(page);
		await page.evaluate(function () {
			Elemenx.Component('FBRoot',{Template:'<main data-outlet="Content"></main>'});
			Elemenx.Component('FBPage',{Template:'<div id="fb">{{Params.id}}</div>'});
			window.App=Elemenx.Application('FBApp',{Component:'FBRoot',Mount:'#mount'});
			window.Router=Elemenx.Router({Root:App.Component(),Routes:[{Path:'/fb/:id',Component:'FBPage'}]});
			Router.Start();
			Router.Go('/fb/1');
			Router.Go('/fb/2');
			Router.Go('/fb/3');
		});
		await expect(page.locator('#fb')).toHaveText('3');
		await page.evaluate(function () { Router.Back(); });
		await expect(page.locator('#fb')).toHaveText('2');
		await page.evaluate(function () { Router.Back(); });
		await expect(page.locator('#fb')).toHaveText('1');
		await page.evaluate(function () { Router.Forward(); });
		await expect(page.locator('#fb')).toHaveText('2');
	});
});