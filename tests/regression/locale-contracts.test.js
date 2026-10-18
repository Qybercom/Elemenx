import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';

function language (code) {
	return new Promise(function (resolve) {
		Elemenx.Locale.Language(code, resolve);
	});
}

describe('Regression: Elemenx.Locale', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	afterAll(async function () {
		await language('en');

		document.documentElement.removeAttribute('dir');
	});

	it('looks a key up in the language, its base language and the fallback language, then shows the key', async function () {
		var key = unique('greeting');

		Elemenx.Locale.Add('en', {[key]: 'Hello', only: {english: 'English only'}});
		Elemenx.Locale.Add('pt', {[key]: 'Olá'});
		Elemenx.Locale.Add('pt-BR', {[key]: 'Oi'});

		await language('pt-BR');

		expect(Elemenx.Locale.Language()).toBe('pt-br');
		expect(Elemenx.Locale.Text(key)).toBe('Oi');
		expect(Elemenx.Locale.Text('only.english')).toBe('English only');
		expect(Elemenx.Locale.Text('missing.key')).toBe('missing.key');
		expect(Elemenx.Locale.Has('only.english')).toBe(true);
		expect(Elemenx.Locale.Has('missing.key')).toBe(false);

		await language('pt-PT');

		expect(Elemenx.Locale.Text(key)).toBe('Olá');

		await language('en');

		expect(Elemenx.Locale.Text(key)).toBe('Hello');
		expect(Elemenx.Locale.Fallback()).toBe('en');
	});

	it('puts the params in a phrase and chooses the plural form of count by the rules of the language', async function () {
		Elemenx.Locale.Add('en', {files: {one: '{count} file in {folder}', other: '{count} files in {folder}'}});
		Elemenx.Locale.Add('ru', {files: {one: '{count} файл в {folder}', few: '{count} файла в {folder}', many: '{count} файлов в {folder}', other: '{count} файла в {folder}'}});

		expect(Elemenx.Locale.Text('files', {count: 1, folder: 'docs'})).toBe('1 file in docs');
		expect(Elemenx.Locale.Text('files', {count: 5, folder: 'docs'})).toBe('5 files in docs');
		expect(Elemenx.Locale.Text('files', {count: 2})).toBe('2 files in {folder}');

		await language('ru');

		expect(Elemenx.Locale.Text('files', {count: 21, folder: 'docs'})).toBe('21 файл в docs');
		expect(Elemenx.Locale.Text('files', {count: 3, folder: 'docs'})).toBe('3 файла в docs');
		expect(Elemenx.Locale.Text('files', {count: 11, folder: 'docs'})).toBe('11 файлов в docs');

		await language('en');
	});

	it('shows phrases in templates with $T, collection items included, and renders them again in a new language', async function () {
		var name = unique('LocalePage');
		var component;
		var mount;

		resetDOM();

		Elemenx.Locale.Add('en', {page: {title: 'Projects', item: 'Item {name}'}});
		Elemenx.Locale.Add('de', {page: {title: 'Projekte', item: 'Eintrag {name}'}});

		Elemenx.Component(name, {
			$Template: '<section><h1 id="locale-title">{{$T(\'page.title\')}}</h1><p *for="item of Items" class="locale-item">{{$T(\'page.item\', {name: item})}}</p></section>',
			Items: ['a', 'b']
		});

		component = Elemenx.Component(name)({});
		mount = document.getElementById('mount');

		mount.appendChild(component.$Element());

		await tick();

		expect(document.getElementById('locale-title').textContent).toBe('Projects');
		expect(Array.from(document.querySelectorAll('.locale-item'), function (node) {
			return node.textContent;
		})).toEqual(['Item a', 'Item b']);

		await language('de');

		await waitFor(function () {
			return document.getElementById('locale-title').textContent === 'Projekte';
		}, 1000);

		expect(document.querySelectorAll('.locale-item')[1].textContent).toBe('Eintrag b');
		expect(document.documentElement.lang).toBe('de');
		expect(document.documentElement.dir).toBe('ltr');

		await language('en');

		component.$Destroy();
	});

	it('loads the dictionaries of a source for the language and its fallback before it switches, and only the languages it lists', async function () {
		var key = unique('loaded');
		var folder = '/embedded/' + unique('locales');
		var heard = [];

		function listener (code) {
			heard.push(code);
		}

		Elemenx.Resource(folder + '/en.json', JSON.stringify({[key]: 'Loaded'}));
		Elemenx.Resource(folder + '/fr.json', JSON.stringify({[key]: 'Chargé'}));

		Elemenx.Locale.Source(folder + '/{language}.json', ['en', 'fr']);
		Elemenx.Locale.OnChange(listener);

		expect(Elemenx.Locale.Text(key)).toBe(key);

		await language('fr');

		expect(Elemenx.Locale.Text(key)).toBe('Chargé');
		expect(heard).toEqual(['fr']);

		/* No file for es: the source does not list it, nothing is asked for; the fallback phrase shows. */
		await language('es');

		expect(Elemenx.Locale.Text(key)).toBe('Loaded');

		Elemenx.Locale.OffChange(listener);

		await language('en');

		expect(heard).toEqual(['fr', 'es']);
	});

	it('gives the direction of a language and sets the one of the page', async function () {
		expect(Elemenx.Locale.Direction('ar')).toBe('rtl');
		expect(Elemenx.Locale.Direction('he-IL')).toBe('rtl');
		expect(Elemenx.Locale.Direction('ru')).toBe('ltr');

		await language('ar');

		expect(document.documentElement.dir).toBe('rtl');

		await language('en');

		expect(document.documentElement.dir).toBe('ltr');
	});

	it('reads the arrows of a keyboard event in the direction of its element', function () {
		var ltr = document.createElement('div');
		var rtl = document.createElement('div');

		rtl.dir = 'rtl';

		rtl.appendChild(document.createElement('button'));

		document.body.append(ltr, rtl);

		function key (target, name) {
			var result = null;

			target.addEventListener('keydown', function (event) {
				result = Elemenx.Locale.Key(event);
			}, {once: true});
			target.dispatchEvent(new KeyboardEvent('keydown', {key: name, bubbles: true}));

			return result;
		}

		expect(key(ltr, 'ArrowLeft')).toBe('ArrowLeft');
		expect(key(rtl.firstChild, 'ArrowLeft')).toBe('ArrowRight');
		expect(key(rtl.firstChild, 'ArrowRight')).toBe('ArrowLeft');
		expect(key(rtl.firstChild, 'ArrowUp')).toBe('ArrowUp');
		expect(key(rtl, 'Enter')).toBe('Enter');

		ltr.remove();
		rtl.remove();
	});

	it('rejects wrong arguments', function () {
		expect(function () {
			Elemenx.Locale.Add('', {});
		}).toThrow('Elemenx.Locale.Add expects (language, entries)');
		expect(function () {
			Elemenx.Locale.Text('');
		}).toThrow('Elemenx.Locale.Text expects (key) or (key, params)');
		expect(function () {
			Elemenx.Locale.Source('/locales/en.json');
		}).toThrow('Elemenx.Locale.Source expects (url with {language}) or (url, languages)');
		expect(function () {
			Elemenx.Locale.Language('');
		}).toThrow('Elemenx.Locale.Language expects (language) or (language, callback)');
		expect(function () {
			Elemenx.Locale.OnChange(null);
		}).toThrow('Elemenx.Locale.OnChange expects (callback)');
	});
});
