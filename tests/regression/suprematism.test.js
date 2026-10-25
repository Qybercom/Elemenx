import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import componentSource from '../../libraries/ElemenxUI/components/Suprematism/Suprematism.js?raw';
import componentTemplate from '../../libraries/ElemenxUI/components/Suprematism/Suprematism.html?raw';
import avatarSource from '../../libraries/ElemenxUI/components/Avatar/Avatar.js?raw';
import avatarTemplate from '../../libraries/ElemenxUI/components/Avatar/Avatar.html?raw';

var owned = [];

/* A component of the Library with its template inline: the page of the tests serves no Library. */
function define (source, name, template) {
	new Function(source.replace(/\$StyleURL: '[^']+',\n/, '').replace("$TemplateURL: '" + name + ".html'", function () {
		return '$Template: ' + JSON.stringify(template);
	}))();
}

function mount (template) {
	var component = Elemenx.Component(unique('SuprematismHost'), {$Template: template})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

describe('Contract: Suprematism, pictures made of a seed', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/directives/Mount.js');
		await import('../../libraries/ElemenxUI/services/Suprematist.js');

		define(componentSource, 'Suprematism', componentTemplate);
		define(avatarSource, 'Avatar', avatarTemplate);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('makes the same picture of the same seed, another of another, in its palette, as SVG text or a data URL', function () {
		var service = Elemenx.Service('Suprematist');
		var picture = service.Generate({Seed: 'Malevich'});
		var figures = service.Figures({Seed: 'Malevich'});
		var document = new DOMParser().parseFromString(picture, 'image/svg+xml');

		expect(service.Generate({Seed: 'Malevich'})).toBe(picture);
		expect(service.Generate({Seed: 'Lissitzky'})).not.toBe(picture);

		/* An SVG of its size, the ground of the paper first, then its figures, decoration without a title. */
		expect(document.documentElement.getAttribute('viewBox')).toBe('0 0 400 400');
		expect(document.documentElement.getAttribute('aria-hidden')).toBe('true');
		expect(document.documentElement.firstElementChild.getAttribute('fill')).toBe('#f1ebdf');
		expect(document.documentElement.children.length).toBe(figures.length + 1);
		expect(figures.every(function (figure) {
			return ['rect', 'circle', 'triangle', 'line', 'arc'].indexOf(figure.Kind) !== -1;
		})).toBe(true);

		/* More density, more figures; a palette of its own; a title makes it an image. */
		expect(service.Figures({Seed: 'Malevich', Density: 1}).length).toBeGreaterThan(service.Figures({Seed: 'Malevich', Density: 0}).length);
		expect(service.Figures({Seed: 'Malevich', Palette: ['#ff00ff']}).every(function (figure) {
			return figure.Fill === '#ff00ff';
		})).toBe(true);
		expect(service.Generate({Seed: 'Malevich', Palette: 'theme'})).toContain('var(--elemenx-accent)');
		expect(service.Generate({Seed: 'Malevich', Title: 'A "red" square'})).toContain('role="img" aria-label="A &quot;red&quot; square"');
		expect(service.DataURL({Seed: 'Malevich'})).toBe('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(picture));
	});

	it('draws it in the page as a component, again when its seed changes, and as an avatar', async function () {
		var host = mount('<div><Suprematism [seed]="Seed" Title="Cover" /><Avatar Name="Ada Lovelace" Generate="suprematism" /></div>');
		var first;

		host.Seed = 'one';

		await tick(20);

		first = host.$Element().querySelector('.elemenx-suprematism svg').outerHTML;

		expect(host.$Element().querySelector('.elemenx-suprematism svg').getAttribute('aria-label')).toBe('Cover');

		host.Seed = 'two';

		await tick(20);

		expect(host.$Element().querySelector('.elemenx-suprematism svg').outerHTML).not.toBe(first);

		expect(host.$Element().querySelector('.elemenx-avatar .elemenx-avatar-art svg')).not.toBe(null);
	});
});
