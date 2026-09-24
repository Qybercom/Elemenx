import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

function boot (routes, events, notFound) {
	var root=unique('RouterRoot'), appName=unique('RouterApp'), trace=[];
	Elemenx.Component(root,{Template:'<main data-outlet="Content"></main>'});
	var app=Elemenx.Application(appName,{Component:root,Mount:'#mount'});
	var router=Elemenx.Router({Root:app.Component(),Routes:routes,NotFound:notFound});
	var i=0;
	while (events && i<events.length) {
		(function (n) { router.On(n,function () {trace.push(n);}); })(events[i]);
		i++;
	}
	router.Start();
	return {App:app,Router:router,Trace:trace};
}

describe('Regression: Router / Guards', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('stale pending guard cannot override a newer navigation', async function () {
		var slow=unique('Slow'), home=unique('Home'), sp=unique('SlowPage'), fp=unique('FastPage');
		Elemenx.Guard(slow,function () {return this.Wait(function (done) {setTimeout(function () {done(true);},120);});});
		Elemenx.Component(home,{Template:'<div>HOME</div>'});
		Elemenx.Component(sp,{Template:'<div id="slow">SLOW</div>'});
		Elemenx.Component(fp,{Template:'<div id="fast">FAST</div>'});
		var x=boot([{Path:'/',Component:home},{Path:'/slow',Component:sp,Guard:slow},{Path:'/fast',Component:fp}]);
		x.Router.Go('/slow');
		setTimeout(function () {x.Router.Go('/fast');},20);
		await tick(220);
		expect(document.getElementById('fast')).not.toBeNull();
		expect(document.getElementById('slow')).toBeNull();
		expect(location.pathname).toBe('/fast');
		x.Router.Destroy(); x.App.Destroy();
	});

	it('Destroy invalidates a pending guarded navigation', async function () {
		var guard=unique('DestroyGuard'), page=unique('DestroyPage');
		Elemenx.Guard(guard,function () {return this.Wait(function (done) {setTimeout(function () {done(true);},100);});});
		Elemenx.Component(page,{Template:'<div id="destroy-page">PAGE</div>'});
		var x=boot([{Path:'/destroy-pending',Component:page,Guard:guard}]);
		x.Router.Go('/destroy-pending');
		await tick(20);
		x.Router.Destroy();
		await tick(130);
		expect(document.getElementById('destroy-page')).toBeNull();
		x.App.Destroy();
	});

	it('emits navigation event order around a guard', async function () {
		var guard=unique('OrderGuard'), page=unique('OrderPage');
		Elemenx.Guard(guard,function () {return true;});
		Elemenx.Component(page,{Template:'<div id="order-page">OK</div>'});
		var events=['NavigationStart','GuardStart','GuardEnd','NavigationCommit','NavigationEnd'];
		var x=boot([{Path:'/order',Component:page,Guard:guard}],events);
		x.Router.Go('/order');
		await tick(60);
		expect(x.Trace.join('|')).toBe(events.join('|'));
		x.Router.Destroy(); x.App.Destroy();
	});

	it('guard Context.Service resolves the Router Application service instance', async function () {
		var service=unique('GuardService'),guard=unique('GuardServiceCheck'),page=unique('GuardServicePage');
		Elemenx.Service(service,{Authorized:false});
		Elemenx.Guard(guard,function () {return this.Service(service).Authorized;});
		Elemenx.Component(page,{Template:'<div id="guard-service-page">OK</div>'});
		var x=boot([{Path:'/guard-service',Component:page,Guard:guard}]);
		x.App.Service(service).Authorized=true;
		x.Router.Go('/guard-service');
		await tick(40);
		expect(document.getElementById('guard-service-page')).not.toBeNull();
		expect(location.pathname).toBe('/guard-service');
		x.Router.Destroy();x.App.Destroy();
	});

	it('guard uses this as its complete execution context and receives no args', async function () {
		var guard=unique('GuardContext'),page=unique('GuardContextPage'),received=-1,context=null;
		Elemenx.Guard(guard,function () {
			received=arguments.length;
			context=this;
			if (!this.From || !this.To || !this.Route || !this.Guard) return this.Fail('missing context');
			return true;
		});
		Elemenx.Component(page,{Template:'<div id="guard-context-page">OK</div>'});
		var x=boot([{Path:'/guard-context/:id',Component:page,Guard:guard}]);
		x.Router.Go('/guard-context/42?q=yes#hash');
		await tick(40);
		expect(received).toBe(0);
		expect(context.To.Params.id).toBe('42');
		expect(context.To.Query.q).toBe('yes');
		expect(context.To.Hash).toBe('hash');
		expect(typeof context.Service).toBe('function');
		expect(typeof context.Wait).toBe('function');
		expect(typeof context.Fail).toBe('function');
		expect(document.getElementById('guard-context-page')).not.toBeNull();
		x.Router.Destroy();x.App.Destroy();
	});

	it('NotFound and Replace preserve expected route semantics', async function () {
		var home=unique('NFHome'), nf=unique('NFPage'), next=unique('NFNext');
		Elemenx.Component(home,{Template:'<div>HOME</div>'});
		Elemenx.Component(nf,{Template:'<div id="not-found">NF</div>'});
		Elemenx.Component(next,{Template:'<div id="replace-page">NEXT</div>'});
		var x=boot([{Path:'/',Component:home},{Path:'/next',Component:next}],null,nf);
		x.Router.Go('/missing');
		await tick(40);
		expect(document.getElementById('not-found')).not.toBeNull();
		x.Router.Replace('/next');
		await tick(40);
		expect(document.getElementById('replace-page')).not.toBeNull();
		expect(location.pathname).toBe('/next');
		x.Router.Destroy(); x.App.Destroy();
	});

	it('Waiting uses the Router component while an async guard is pending', async function () {
		var guard=unique('WaitingGuard'),home=unique('WaitingHome'),page=unique('WaitingPage'),waiting=unique('WaitingPageLoading');
		Elemenx.Guard(guard,function () {return this.Wait(function (done) {setTimeout(function () {done(true);},80);});});
		Elemenx.Component(home,{Template:'<div id="waiting-home">HOME</div>'});
		Elemenx.Component(page,{Template:'<div id="waiting-target">TARGET</div>'});
		Elemenx.Component(waiting,{Template:'<div id="waiting-global">WAIT</div>'});
		var root=unique('WaitingRoot'),appName=unique('WaitingApp');
		Elemenx.Component(root,{Template:'<main data-outlet="Content"></main><aside data-outlet="Waiting"></aside>'});
		var app=Elemenx.Application(appName,{Component:root,Mount:'#mount'});
		var router=Elemenx.Router({Root:app.Component(),Waiting:waiting,Routes:[{Path:'/',Component:home},{Path:'/waiting',Component:page,Guard:guard}]});
		router.Start();
		await tick(20);
		router.Go('/waiting');
		await tick(20);
		expect(document.getElementById('waiting-global')).not.toBeNull();
		expect(document.getElementById('waiting-global').parentNode.getAttribute('data-outlet')).toBe('Waiting');
		expect(document.getElementById('waiting-home')).not.toBeNull();
		expect(document.getElementById('waiting-target')).toBeNull();
		await tick(100);
		expect(document.getElementById('waiting-global')).toBeNull();
		expect(document.getElementById('waiting-target')).not.toBeNull();
		router.Destroy(); app.Destroy();
	});

	it('route Waiting overrides Router Waiting', async function () {
		var guard=unique('RouteWaitingGuard'),page=unique('RouteWaitingPage'),globalWaiting=unique('GlobalWaiting'),routeWaiting=unique('RouteWaiting');
		Elemenx.Guard(guard,function () {return this.Wait(function (done) {setTimeout(function () {done(true);},80);});});
		Elemenx.Component(page,{Template:'<div id="route-waiting-target">TARGET</div>'});
		Elemenx.Component(globalWaiting,{Template:'<div id="global-waiting">GLOBAL</div>'});
		Elemenx.Component(routeWaiting,{Template:'<div id="route-waiting">ROUTE</div>'});
		var root=unique('RouteWaitingRoot'),appName=unique('RouteWaitingApp');
		Elemenx.Component(root,{Template:'<main data-outlet="Content"></main><aside data-outlet="Waiting"></aside>'});
		var app=Elemenx.Application(appName,{Component:root,Mount:'#mount'});
		var router=Elemenx.Router({Root:app.Component(),Waiting:globalWaiting,Routes:[{Path:'/route-waiting',Component:page,Guard:guard,Waiting:routeWaiting}]});
		router.Start();
		router.Go('/route-waiting');
		await tick(20);
		expect(document.getElementById('route-waiting')).not.toBeNull();
		expect(document.getElementById('global-waiting')).toBeNull();
		await tick(100);
		expect(document.getElementById('route-waiting')).toBeNull();
		expect(document.getElementById('route-waiting-target')).not.toBeNull();
		router.Destroy(); app.Destroy();
	});


	it('WaitingOutlet overrides the default Waiting outlet name', async function () {
		var guard=unique('CustomWaitingOutletGuard'),page=unique('CustomWaitingOutletPage'),waiting=unique('CustomWaitingOutletLoading');
		Elemenx.Guard(guard,function () {return this.Wait(function (done) {setTimeout(function () {done(true);},80);});});
		Elemenx.Component(page,{Template:'<div id="custom-waiting-target">TARGET</div>'});
		Elemenx.Component(waiting,{Template:'<div id="custom-waiting-loader">WAIT</div>'});
		var root=unique('CustomWaitingOutletRoot'),appName=unique('CustomWaitingOutletApp');
		Elemenx.Component(root,{Template:'<main data-outlet="Content"></main><aside data-outlet="Busy"></aside>'});
		var app=Elemenx.Application(appName,{Component:root,Mount:'#mount'});
		var router=Elemenx.Router({Root:app.Component(),Waiting:waiting,WaitingOutlet:'Busy',Routes:[{Path:'/custom-waiting',Component:page,Guard:guard}]});
		router.Start();
		router.Go('/custom-waiting');
		await tick(20);
		expect(document.getElementById('custom-waiting-loader')).not.toBeNull();
		expect(document.getElementById('custom-waiting-loader').parentNode.getAttribute('data-outlet')).toBe('Busy');
		await tick(100);
		expect(document.getElementById('custom-waiting-loader')).toBeNull();
		expect(document.getElementById('custom-waiting-target')).not.toBeNull();
		router.Destroy(); app.Destroy();
	});

	it('common-prefix navigation reuses nested component instances', async function () {
		var parent=unique('Parent'), child=unique('Child'), pm=0, cm=0, pi, ci;
		Elemenx.Component(parent,{Template:'<section id="parent">{{Params.id}}<div data-outlet="Content"></div></section>',ElemenxOnCreate:function () {pm++;pi=this;}});
		Elemenx.Component(child,{Template:'<b id="child">{{Query.q}}|{{Hash}}</b>',ElemenxOnCreate:function () {cm++;ci=this;}});
		var x=boot([{Path:'/reuse/:id',Component:parent,Routes:[{Path:'child',Component:child}]}]);
		x.Router.Go('/reuse/1/child?q=a#x');
		await tick(50);
		var p=pi,c=ci;
		x.Router.Go('/reuse/2/child?q=b#y');
		await tick(50);
		expect(pi).toBe(p);
		expect(ci).toBe(c);
		expect(pm).toBe(1);
		expect(cm).toBe(1);
		expect(document.getElementById('child').textContent).toBe('b|y');
		x.Router.Destroy(); x.App.Destroy();
	});

	it('failed leave guard cancels navigation and keeps current route', async function () {
		var a=unique('LeaveA'),b=unique('LeaveB'),failed=0;
		Elemenx.Component(a,{
			Template:'<div id="leave-a">A</div>',
			ElemenxOnRouteLeave:function (x) {return x.Fail('stay');}
		});
		Elemenx.Component(b,{Template:'<div id="leave-b">B</div>'});
		var x=boot([{Path:'/leave-a',Component:a},{Path:'/leave-b',Component:b}]);
		x.Router.On('GuardFailed',function () {failed++;});
		x.Router.Go('/leave-a');
		await tick(40);
		x.Router.Go('/leave-b');
		await tick(60);
		expect(document.getElementById('leave-a')).not.toBeNull();
		expect(document.getElementById('leave-b')).toBeNull();
		expect(location.pathname).toBe('/leave-a');
		expect(failed).toBe(1);
		x.Router.Destroy();x.App.Destroy();
	});

	it('stale async redirect cannot override a newer navigation', async function () {
		var guard=unique('RedirectGuard'),home=unique('RedirectHome'),slow=unique('RedirectSlow'),fast=unique('RedirectFast'),target=unique('RedirectTarget');
		Elemenx.Guard(guard,function () {return this.Wait(function (done) {setTimeout(function () {done('/redirect-target');},120);});});
		Elemenx.Component(home,{Template:'<div>HOME</div>'});
		Elemenx.Component(slow,{Template:'<div id="redirect-slow">SLOW</div>'});
		Elemenx.Component(fast,{Template:'<div id="redirect-fast">FAST</div>'});
		Elemenx.Component(target,{Template:'<div id="redirect-target">TARGET</div>'});
		var x=boot([{Path:'/',Component:home},{Path:'/redirect-slow',Component:slow,Guard:guard},{Path:'/redirect-fast',Component:fast},{Path:'/redirect-target',Component:target}]);
		x.Router.Go('/redirect-slow');
		setTimeout(function () {x.Router.Go('/redirect-fast');},20);
		await tick(220);
		expect(document.getElementById('redirect-fast')).not.toBeNull();
		expect(document.getElementById('redirect-target')).toBeNull();
		expect(location.pathname).toBe('/redirect-fast');
		x.Router.Destroy();x.App.Destroy();
	});

});