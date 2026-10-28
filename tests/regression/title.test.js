import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: Document Title', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () {
		resetDOM();

		document.title = '';
	});

	it('Elemenx.Title reads and writes document title', function () {
		expect(Elemenx.Title()).toBe('');
		expect(Elemenx.Title('Global title')).toBe(Elemenx);
		expect(document.title).toBe('Global title');
		expect(Elemenx.Title()).toBe('Global title');
	});

	it('component Title is declarative and this.$Title can change it', function () {
		var name = unique('TitleComponent');
		var factory = Elemenx.Component(name, {
			$Title: 'Component title',
			$Template: '<div></div>',
			$OnCreate: function () {
				expect(document.title).toBe('Component title');

				this.$Title('Runtime component title');
			}
		});
		var component = factory();

		expect(document.title).toBe('Runtime component title');
		expect(component.$Title()).toBe('Runtime component title');

		component.$Destroy();

		expect(document.title).toBe('Runtime component title');
	});


	it('$OnReady can override declarative Title', function () {
		var name = unique('TitleReadyComponent');
		var factory = Elemenx.Component(name, {
			$Title: 'Project - Elemenx',
			$Template: '<div></div>',
			$OnReady: function () {
				this.$Title('Project \"42\" - Elemenx');
			}
		});
		var component = factory();

		expect(document.title).toBe('Project \"42\" - Elemenx');

		component.$Destroy();
	});

	it('Application Title sets the default document title and exposes Title()', function () {
		var componentName = unique('TitleApplicationRoot');
		var applicationName = unique('TitleApplication');

		Elemenx.Component(componentName, {$Template: '<div></div>'});

		var application = Elemenx.Application(applicationName, {$Component: componentName, $Mount: '#mount', $Title: 'Application title'});

		expect(document.title).toBe('Application title');
		expect(application.$Title()).toBe('Application title');

		application.$Title('Runtime application title');

		expect(document.title).toBe('Runtime application title');

		application.$Destroy();
	});

	it('route Params are available in $OnReady after $OnCreate', async function () {
		var page = unique('TitleRoutePage');
		var root = unique('TitleRouteRoot');
		var applicationName = unique('TitleRouteApplication');
		var createParams = null;
		var readyParams = null;

		Elemenx.Component(page, {
			$Title: 'Project - Elemenx',
			$Template: '<div></div>',
			$OnCreate: function () {
				createParams = this.$Params;
			},
			$OnReady: function () {
				readyParams = this.$Params;

				this.$Title('Project "' + this.$Params.id + '" - Elemenx');
			}
		});
		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main>'});

		var application = Elemenx.Application(applicationName, {
			$Component: root,
			$Mount: '#mount',
			$Router: {Routes: [{Path: '/project/:id', Component: page}]}
		});

		application.$Router().Go('/project/42');

		await new Promise(function (resolve) {setTimeout(resolve, 20);});

		expect(createParams).toBeUndefined();
		expect(readyParams.id).toBe('42');
		expect(document.title).toBe('Project "42" - Elemenx');

		application.$Destroy();
	});

	it('$Title and $Icon read {{ }} in the state and follow it, the last instance made is the one the page follows', async function () {
		var name = unique('TitleExpression');
		var other = unique('TitleOther');
		var first;
		var second;

		Elemenx.Component(name, {$Title: '{{Count}} new - {{Name}}', $Icon: '/icons/{{Count ? "unread" : "read"}}.svg', $Template: '<i></i>', Count: 2, Name: 'Inbox'});
		Elemenx.Component(other, {$Title: 'Other {{Count}}', $Template: '<b></b>', Count: 1});

		first = Elemenx.Component(name)();

		expect(document.title).toBe('2 new - Inbox');
		expect(Elemenx.Icon()).toBe('/icons/unread.svg');
		expect(document.head.querySelector('link[rel="icon"][data-elemenx-icon]').getAttribute('href')).toBe('/icons/unread.svg');

		first.Count = 0;

		expect(document.title).toBe('0 new - Inbox');
		expect(Elemenx.Icon()).toBe('/icons/read.svg');

		/* A second instance: the page follows it, the first one changes nothing more. */
		second = Elemenx.Component(other)();

		expect(document.title).toBe('Other 1');

		first.Count = 5;

		expect(document.title).toBe('Other 1');

		second.Count = 3;

		expect(document.title).toBe('Other 3');

		/* Destroyed, it leaves its title; this.$Title of the first one makes it the one of the page again. */
		second.$Destroy();

		expect(document.title).toBe('Other 3');

		first.$Title('Mine {{Name}}');

		expect(document.title).toBe('Mine Inbox');

		first.$Destroy();

		Elemenx.Icon(null);
	});

	it('a $Title with $T follows the language of the page', async function () {
		var name = unique('TitleLanguage');
		var component;

		Elemenx.Locale.Add('en', {titleTest: {hello: 'Hello'}});
		Elemenx.Locale.Add('ru', {titleTest: {hello: 'Привет'}});
		Elemenx.Component(name, {$Title: '{{$T("titleTest.hello")}} {{Name}}', $Template: '<i></i>', Name: 'Ada'});

		component = Elemenx.Component(name)();

		expect(document.title).toBe('Hello Ada');

		await new Promise(function (resolve) {
			Elemenx.Locale.Language('ru', resolve);
		});

		expect(document.title).toBe('Привет Ada');

		await new Promise(function (resolve) {
			Elemenx.Locale.Language('en', resolve);
		});

		component.$Destroy();
	});

	it('Elemenx.Icon sets the favicon (one for each scheme), brings back the icons of the page, and tells its listeners and those of the title', function () {
		var page = document.createElement('link');
		var heard = [];
		var listener = function (value) {
			heard.push(value);
		};

		page.rel = 'icon';
		page.href = '/page.ico';

		document.head.appendChild(page);

		Elemenx.Icon.OnChange(listener);
		Elemenx.Title.OnChange(listener);

		Elemenx.Icon('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

		expect(page.parentNode).toBe(null);
		expect(document.head.querySelector('link[data-elemenx-icon]').getAttribute('href')).toBe('data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));

		Elemenx.Icon({Light: '/light.svg', Dark: '/dark.svg'});

		expect(Array.prototype.map.call(document.head.querySelectorAll('link[data-elemenx-icon]'), function (link) {
			return link.getAttribute('href') + ' ' + link.media;
		})).toEqual(['/light.svg (prefers-color-scheme: light)', '/dark.svg (prefers-color-scheme: dark)']);

		/* The same icon again tells nothing; null brings back the one of the page. */
		Elemenx.Icon({Light: '/light.svg', Dark: '/dark.svg'});
		Elemenx.Icon(null);

		expect(page.parentNode).toBe(document.head);
		expect(document.head.querySelector('link[data-elemenx-icon]')).toBe(null);
		expect(Elemenx.Icon()).toBe(null);

		Elemenx.Title('Told');
		Elemenx.Title('Told');

		expect(heard.length).toBe(4);
		expect(heard[1]).toEqual({Light: '/light.svg', Dark: '/dark.svg'});
		expect(heard.slice(2)).toEqual([null, 'Told']);

		Elemenx.Icon.OffChange(listener);
		Elemenx.Title.OffChange(listener);
		Elemenx.Title('Not told');

		expect(heard.length).toBe(4);
		expect(function () {
			Elemenx.Title.OnChange('nothing');
		}).toThrow('Elemenx.Title.OnChange expects a function');

		page.remove();
	});

	it('a page of a Router without $Title shows the one of the Application, and a page kept alive shows its own again', async function () {
		var home = unique('TitleHome');
		var about = unique('TitleAbout');
		var plain = unique('TitlePlain');
		var root = unique('TitlePagesRoot');
		var application;
		var router;

		Elemenx.Component(home, {$Title: 'Home {{Visits}}', $KeepAlive: true, $Template: '<div class="title-home"></div>', Visits: 1});
		Elemenx.Component(about, {$Title: 'About', $Template: '<div></div>'});
		Elemenx.Component(plain, {$Template: '<div></div>'});
		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main>'});

		application = Elemenx.Application(unique('TitlePagesApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Title: 'The application',
			$Router: {Routes: [{Path: '/', Component: home}, {Path: '/about', Component: about}, {Path: '/plain', Component: plain}]}
		});

		router = application.$Router();

		router.Go('/');

		await new Promise(function (resolve) {
			setTimeout(resolve, 30);
		});

		expect(document.title).toBe('Home 1');

		router.Go('/about');

		await new Promise(function (resolve) {
			setTimeout(resolve, 30);
		});

		expect(document.title).toBe('About');

		router.Go('/plain');

		await new Promise(function (resolve) {
			setTimeout(resolve, 30);
		});

		expect(document.title).toBe('The application');

		router.Go('/');

		await new Promise(function (resolve) {
			setTimeout(resolve, 30);
		});

		expect(document.title).toBe('Home 1');

		application.$Destroy();
	});
});
