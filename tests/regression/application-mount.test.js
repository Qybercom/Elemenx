import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest';
import {loadElemenx,resetDOM,unique} from '../setup.js';

var applications=[];

function app (name,definition) {
	var value=Elemenx.Application(name,definition);
	applications.push(value);
	return value;
}

describe('Regression: multi-Application mounts',function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () {
		resetDOM();
		applications=[];
	});
	afterEach(function () {
		while (applications.length) {
			if (applications[0] && applications[0].Destroy) applications[0].Destroy();
			applications.shift();
		}
	});

	it('mounts two Applications into independent DOM roots',function () {
		document.body.innerHTML='<div id="foo"></div><div id="bar"></div>';
		var fooRoot=unique('FooRoot');
		var barRoot=unique('BarRoot');

		Elemenx.Component(fooRoot,{Template:'<div id="foo-content">Foo</div>'});
		Elemenx.Component(barRoot,{Template:'<div id="bar-content">Bar</div>'});

		var foo=app(unique('FooApp'),{Component:fooRoot,Mount:'#foo'});
		var bar=app(unique('BarApp'),{Component:barRoot,Mount:'#bar'});

		expect(foo.Mount()).toBe(document.getElementById('foo'));
		expect(bar.Mount()).toBe(document.getElementById('bar'));
		expect(document.querySelector('#foo #foo-content')).not.toBeNull();
		expect(document.querySelector('#bar #bar-content')).not.toBeNull();
		expect(foo.Component().Application()).toBe(foo);
		expect(bar.Component().Application()).toBe(bar);
	});

	it('keeps body as the default single-Application mount',function () {
		var root=unique('BodyRoot');
		Elemenx.Component(root,{Template:'<main id="body-application"></main>'});

		var application=app(unique('BodyApp'),{Component:root});

		expect(application.Mount()).toBe(document.body);
		expect(document.getElementById('body-application')).not.toBeNull();
	});

	it('rejects two Applications owning the exact same mount',function () {
		document.body.innerHTML='<div id="shared"></div>';
		var firstRoot=unique('FirstRoot');
		var secondRoot=unique('SecondRoot');
		Elemenx.Component(firstRoot,{Template:'<div></div>'});
		Elemenx.Component(secondRoot,{Template:'<div></div>'});

		var first=app(unique('FirstApp'),{Component:firstRoot,Mount:'#shared'});
		var secondName=unique('SecondApp');

		expect(function () {
			Elemenx.Application(secondName,{Component:secondRoot,Mount:'#shared'});
		}).toThrow(/Application mount conflict/);

		first.Destroy();
		applications.splice(applications.indexOf(first),1);
		var second=app(unique('ReplacementApp'),{Component:secondRoot,Mount:'#shared'});
		expect(second.Mount()).toBe(document.getElementById('shared'));
	});

	it('treats a foreign Application mount as a structural traversal boundary',function () {
		document.body.innerHTML='<div id="outer"></div><div id="inner"></div>';
		var innerRoot=unique('InnerRoot');
		var outerRoot=unique('OuterRoot');

		Elemenx.Component(innerRoot,{Template:'<div id="inner-content">Inner</div>'});
		Elemenx.Component(outerRoot,{Template:'<div id="outer-content">Outer</div>'});

		var inner=app(unique('InnerApp'),{Component:innerRoot,Mount:'#inner'});
		var outer=app(unique('OuterApp'),{Component:outerRoot,Mount:'#outer'});

		expect(inner.Component().Application()).toBe(inner);
		expect(outer.Component().Application()).toBe(outer);
		expect(document.getElementById('inner-content')).not.toBeNull();
		expect(document.getElementById('outer-content')).not.toBeNull();
	});
	it('supports body Application with nested Application in either declaration order',function () {
		var mainRoot=unique('MainRoot');
		var chatRoot=unique('ChatRoot');
		Elemenx.Component(mainRoot,{Template:'<main id="main"><div id="chat"></div></main>'});
		Elemenx.Component(chatRoot,{Template:'<section id="chat-content">Chat</section>'});
		var main=app(unique('MainApp'),{Component:mainRoot,Mount:'body'});
		var chat=app(unique('ChatApp'),{Component:chatRoot,Mount:'#chat'});
		expect(chat.Component().Application()).toBe(chat);
		expect(document.querySelector('#main #chat #chat-content')).not.toBeNull();

		chat.Destroy();
		main.Destroy();
		applications=[];
		resetDOM();
		document.body.innerHTML='<div id="chat"></div>';
		chat=app(unique('ChatFirst'),{Component:chatRoot,Mount:'#chat'});
		var original=chat.Mount();
		main=app(unique('MainSecond'),{Component:mainRoot,Mount:'body'});
		expect(chat.Mount()).toBe(original);
		expect(chat.Component().Application()).toBe(chat);
		expect(document.querySelector('#main #chat #chat-content')).not.toBeNull();
	});

	it('supports several nested Applications and releases their mounts',function () {
		var mainRoot=unique('MainRoot');
		var aRoot=unique('ARoot');
		var bRoot=unique('BRoot');
		Elemenx.Component(mainRoot,{Template:'<main><div id="a"></div><div id="b"></div></main>'});
		Elemenx.Component(aRoot,{Template:'<div id="a-content"></div>'});
		Elemenx.Component(bRoot,{Template:'<div id="b-content"></div>'});
		app(unique('MainApp'),{Component:mainRoot,Mount:'body'});
		var a=app(unique('AApp'),{Component:aRoot,Mount:'#a'});
		var b=app(unique('BApp'),{Component:bRoot,Mount:'#b'});
		expect(a.Component().Application()).toBe(a);
		expect(b.Component().Application()).toBe(b);
		expect(document.getElementById('a-content')).not.toBeNull();
		expect(document.getElementById('b-content')).not.toBeNull();
		var mount=a.Mount();
		a.Destroy();
		applications.splice(applications.indexOf(a),1);
		var replacement=app(unique('AReplacement'),{Component:aRoot,Mount:mount});
		expect(replacement.Mount()).toBe(mount);
	});

});