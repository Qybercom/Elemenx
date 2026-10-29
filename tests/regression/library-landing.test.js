import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];
var address = '';

function mount (template, state) {
	var component = Elemenx.Component(unique('LandingHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

describe('Contract: the Audience Service, Experiment, Variant and the Landing blocks', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Experiment', 'Variant', 'LandingHero', 'LandingFeatures', 'LandingStats', 'LandingTestimonials', 'LandingFAQ', 'LandingCTA']);
	});

	beforeEach(function () {
		resetDOM();

		address = window.location.href;
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		window.history.replaceState(null, '', address);

		Elemenx.Service('Audience').Forget();
	});

	it('tells who came, from where, in which language and on what, and matches its rules', function () {
		var audience = Elemenx.Service('Audience');
		var phone = audience.Context({URL: 'https://shop.test/?utm_source=Google&utm_campaign=spring&ref=42', Referrer: 'https://www.google.com/search?q=x', Language: 'ru-RU', Width: 390, UserAgent: 'Mozilla/5.0 (iPhone) Mobile'});
		var desktop = audience.Context({URL: 'https://shop.test/', Referrer: 'https://shop.test/other', Language: 'en', Width: 1440, UserAgent: 'Mozilla/5.0 (Windows NT 10.0)', Touch: false});

		expect(phone.UTM).toEqual({Source: 'Google', Medium: '', Campaign: 'spring', Term: '', Content: ''});
		expect(phone.Params.ref).toBe('42');
		expect(phone.Referrer).toBe('www.google.com');
		expect(phone.Device).toBe('phone');
		expect(desktop.Device).toBe('desktop');
		expect(desktop.Referrer).toBe('');
		expect(audience.Context({Width: 800, Touch: true, UserAgent: 'Mozilla/5.0 (Linux; Android 14)'}).Device).toBe('tablet');

		expect(audience.Match({Source: 'google', Campaign: ['spring', 'summer']}, phone)).toBe(true);
		expect(audience.Match({Source: 'google', Device: 'desktop'}, phone)).toBe(false);
		expect(audience.Match({Language: 'ru', Referrer: 'google'}, phone)).toBe(true);
		expect(audience.Match({Referrer: ''}, desktop)).toBe(true);
		expect(audience.Match({Params: {ref: true, promo: false}}, phone)).toBe(true);
		expect(audience.Match({Params: {ref: '7'}}, phone)).toBe(false);
		expect(audience.Match({Referrer: /^www\./}, phone)).toBe(true);
		expect(audience.Match({Test: function (context) {
			return context.Width < 400;
		}}, phone)).toBe(true);
		expect(audience.Match(null, phone)).toBe(true);
	});

	it('chooses a forced variant, then a rule, then the one kept, then a split by weight, else the default', function () {
		var audience = Elemenx.Service('Audience');
		var name = unique('experiment');
		var variants = [{ID: 'ads', When: {Source: 'google'}}, {ID: 'a', Weight: 1}, {ID: 'b', Weight: 3}];
		var plain = audience.Context({URL: 'https://shop.test/'});

		expect(audience.Choose(name, variants, {Context: audience.Context({URL: 'https://shop.test/?variant=' + name + ':a&utm_source=google'})}).Reason).toBe('forced');
		expect(audience.Choose(name, variants, {Context: audience.Context({URL: 'https://shop.test/?utm_source=google'})}).ID).toBe('ads');

		/* 0.5 of the weight 4 is 2: past a (1), in b. Kept, a split of 0 next time still gives b. */
		expect(audience.Choose(name, variants, {Context: plain, Random: function () {
			return 0.5;
		}})).toEqual({Experiment: name, ID: 'b', Variant: variants[2], Reason: 'split'});
		expect(audience.Choose(name, variants, {Context: plain, Random: function () {
			return 0;
		}}).Reason).toBe('remembered');
		expect(audience.Chosen(name).ID).toBe('b');

		audience.Forget(name);

		expect(audience.Choose(name, variants, {Context: plain, Random: function () {
			return 0;
		}}).ID).toBe('a');

		/* Only rules that do not hold: the default one, or none. */
		expect(audience.Choose(unique('experiment'), [{ID: 'x', When: {Device: 'tablet'}}, {ID: 'y', When: {Language: 'fr'}, Default: true}], {Context: plain}).Reason).toBe('default');
		expect(audience.Choose(unique('experiment'), [{ID: 'x', When: {Device: 'tablet'}}], {Context: plain})).toBe(null);
	});

	it('shows the Variant chosen, tells its view once and the conversion of an action with a Goal inside it', async function () {
		var audience = Elemenx.Service('Audience');
		var events = [];
		var chosen = [];
		var listener = audience.OnEvent(function (event) {
			events.push(event.Type + ':' + event.Experiment + ':' + event.Variant + ':' + (event.Goal || '') + ':' + event.Source);
		});
		var host;
		var root;

		window.history.replaceState(null, '', window.location.pathname + '?utm_source=newsletter');

		host = mount('<div><Experiment Name="hero" (choose)="Chosen"><Variant ID="ads" Source="google, bing"><p class="text">From ads</p></Variant><Variant ID="mail" Source="newsletter" Params="utm_source"><p class="text">From the letter</p><LandingCTA Title="Join" [actions]="Actions" /></Variant><Variant ID="plain" Default="true"><p class="text">Plain</p></Variant></Experiment></div>', {
			Actions: [{ID: 'join', Label: 'Join now', Goal: 'signup'}],
			Chosen: function (event) {
				chosen.push(event.ID + ':' + event.Reason);
			}
		});

		expect(await waitFor(function () {
			return chosen.length > 0;
		}, 3000)).toBe(true);

		await tick(20);

		root = host.$Element();

		expect(chosen).toEqual(['mail:rule']);
		expect(root.querySelector('.elemenx-experiment').getAttribute('data-variant')).toBe('mail');
		expect(Array.prototype.filter.call(root.querySelectorAll('.text'), function (node) {
			return node.offsetParent !== null;
		}).map(function (node) {
			return node.textContent;
		})).toEqual(['From the letter']);

		root.querySelector('[data-action="join"]').click();

		await tick(10);

		expect(events).toEqual(['view:hero:mail::newsletter', 'conversion:hero:mail:signup:newsletter']);

		/* A view is told once for a page. */
		expect(audience.View('hero')).toBe(null);

		audience.OffEvent(listener);
	});

	it('keeps the variant of a split for the visitor, and a link forces another one', async function () {
		var name = unique('split');
		var shown = async function () {
			var host = mount('<div><Experiment [name]="Name"><Variant ID="a"><i>A</i></Variant><Variant ID="b"><i>B</i></Variant></Experiment></div>', {Name: name});
			var found;

			expect(await waitFor(function () {
				return !!host.$Element().querySelector('.elemenx-experiment[data-variant]');
			}, 3000)).toBe(true);

			found = host.$Element().querySelector('.elemenx-experiment').getAttribute('data-variant');

			owned.pop().$Destroy();

			return found;
		};
		var first = await shown();

		expect(await shown()).toBe(first);
		expect(await shown()).toBe(first);

		window.history.replaceState(null, '', window.location.pathname + '?variant=' + (first === 'a' ? 'b' : 'a'));

		expect(await shown()).toBe(first === 'a' ? 'b' : 'a');
	});

	it('draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions', async function () {
		var actions = [];
		var toggles = [];
		var host = mount('<div style="width: 960px"><LandingHero Overline="New" Title="Ship faster" Text="One file." Image="data:image/gif;base64,R0lGODlhAQABAAAAACw=" [actions]="Actions" (action)="Acted" /><LandingFeatures Title="Why" Columns="2" [items]="Features" /><LandingStats Duration="200" [items]="Stats" /><LandingTestimonials [items]="Quotes" /><LandingFAQ Single="true" Open="free" [items]="Questions" (toggle)="Toggled" /></div>', {
			Actions: [{ID: 'start', Label: 'Start'}, {ID: 'docs', Label: 'Docs', Href: '#docs', Variant: 'secondary'}],
			Features: [{ID: 'fast', Icon: 'star', Title: 'Fast', Text: 'No build.'}, {ID: 'safe', Icon: 'lock', Title: 'Safe', Text: 'No eval.', Href: '#safe'}],
			Stats: [{ID: 'users', Value: 12000, Suffix: '+', Label: 'Users'}, {ID: 'uptime', Value: 99.9, Suffix: '%', Label: 'Uptime'}],
			Quotes: [{ID: 'ada', Text: 'It just works.', Name: 'Ada Lovelace', Role: 'CTO', Rating: 5}],
			Questions: [{ID: 'free', Question: 'Is it free?', Answer: 'Yes.'}, {ID: 'deps', Question: 'Dependencies?', Answer: 'None.'}],
			Acted: function (event) {
				actions.push(event.ID + ':' + event.Href);
			},
			Toggled: function (event) {
				toggles.push(event.ID + ':' + event.Open);
			}
		});
		var root;
		var hero;
		var open;

		expect(await waitFor(function () {
			return !!host.$Element().querySelector('.elemenx-landing-faq-item');
		}, 3000)).toBe(true);

		root = host.$Element();
		hero = root.querySelector('.elemenx-landing-hero');

		expect(hero.querySelector('h1').textContent).toBe('Ship faster');
		expect(hero.querySelector('button[data-action="start"]').classList.contains('primary')).toBe(true);
		expect(hero.querySelector('a[data-action="docs"]').getAttribute('href')).toBe('#docs');
		expect(hero.querySelector('.elemenx-landing-hero-image')).not.toBeNull();

		hero.querySelector('button[data-action="start"]').click();
		hero.querySelector('a[data-action="docs"]').click();

		expect(actions).toEqual(['start:', 'docs:#docs']);

		/* Two columns side by side; a feature with an Href is a link. */
		expect(root.querySelectorAll('.elemenx-landing-feature').length).toBe(2);
		expect(root.querySelector('a.elemenx-landing-feature').getAttribute('data-id')).toBe('safe');
		expect(root.querySelectorAll('.elemenx-landing-feature')[0].getBoundingClientRect().top).toBe(root.querySelectorAll('.elemenx-landing-feature')[1].getBoundingClientRect().top);

		/* The numbers end at their values, written in the language of the page. */
		expect(await waitFor(function () {
			return root.querySelector('[data-id="users"] .elemenx-landing-stat-value').textContent === '12,000+';
		}, 3000)).toBe(true);
		expect(root.querySelector('[data-id="uptime"] .elemenx-landing-stat-value').textContent).toBe('99.9%');

		expect(root.querySelector('.elemenx-landing-testimonial blockquote').textContent).toBe('It just works.');
		expect(root.querySelector('.elemenx-landing-testimonial .elemenx-avatar')).not.toBeNull();

		/* One question open at a time: opening the second closes the first. */
		open = function () {
			return Array.prototype.filter.call(root.querySelectorAll('.elemenx-landing-faq-item'), function (node) {
				return node.open;
			}).map(function (node) {
				return node.getAttribute('data-id');
			});
		};

		expect(open()).toEqual(['free']);

		root.querySelector('[data-id="deps"] summary').click();

		expect(await waitFor(function () {
			return open().join() === 'deps';
		}, 2000)).toBe(true);
		expect(await waitFor(function () {
			return toggles.indexOf('deps:true') !== -1;
		}, 2000)).toBe(true);
	});
});
