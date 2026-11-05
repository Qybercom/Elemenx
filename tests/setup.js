export async function loadElemenx () {
	if (window.Elemenx)
		return window.Elemenx;

	await new Promise(function (resolve, reject) {
		var script = document.createElement('script');


		script.src = typeof __ELEMENX_SCRIPT__ === 'string' ? __ELEMENX_SCRIPT__ : '/elemenx.js';
		script.onload = resolve;
		script.onerror = reject;

		document.head.appendChild(script);
	});

	groundsByWorld(window.Elemenx);

	return window.Elemenx;
}

/*
 * The grounds of the templates of the tests told by numbers, as before a ground had its World: each component defined with
 * one has it as the World of those numbers (grounded, below), so a test says the ground it means in one line.
 */
function groundsByWorld (elemenx) {
	var define = elemenx.Component;

	elemenx.Component = function (name, definition) {
		var made;

		if (definition && typeof definition.$Template === 'string' && /Kind="ground"/.test(definition.$Template)) {
			made = grounded(definition.$Template);
			definition = Object.assign({}, definition, {$Template: made.Template, GroundWorlds: made.Worlds});
		}

		return arguments.length > 1 ? define.call(this, name, definition) : define.apply(this, arguments);
	};

	Object.keys(define).forEach(function (key) {
		elemenx.Component[key] = define[key];
	});
}

export function mount () {
	resetDOM();

	return document.getElementById('mount');
}

export function resetDOM () {
	document.body.innerHTML = '<div id="mount"></div>';

	history.replaceState({}, '', '/');
}

export function tick (ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms === undefined ? 30 : ms);
	});
}

export async function waitFor (test, timeout) {
	var started = Date.now();
	var value;

	while (Date.now() - started < (timeout || 1500)) {
		value = test();

		if (value)
			return value;

		await tick(15);
	}

	return false;
}

export function unique (prefix) {
	unique.ID = (unique.ID || 0) + 1;

	return prefix + unique.ID;
}

/*
 * A template whose grounds are told by numbers (<SceneObject Kind="ground" Size="100" Height="1" Seed="test" />) as the
 * World of each (SceneWorld.Library of those numbers): the only way a ground is told. {Template, Worlds}: each ground
 * reads its graph from GroundWorlds of the host, given as its state.
 */
export function grounded (template) {
	var worlds = [];
	var numbers = ['Size', 'Height', 'Water', 'Scale', 'Ridges', 'Rock', 'Snow'];
	var made = template.replace(/<SceneObject\b([^>]*?)\bKind="ground"([^>]*?)(\/?)>/g, function (tag, before, after, closed) {
		var options = {};
		var rest = (before + ' ' + after).replace(/\s(Size|Height|Water|Scale|Ridges|Rock|Snow|Seed|Biome)="([^"]*)"/g, function (all, key, value) {
			if (key === 'Biome') options.Biomes = [value];
			else options[key] = numbers.indexOf(key) !== -1 && value !== '' && value !== 'false' ? Number(value) : value;

			return '';
		});

		worlds.push(Elemenx.Service('SceneWorld').Library(options));

		return '<SceneObject' + rest.replace(/\s+/g, ' ').replace(/\s$/, '') + ' Kind="ground" [world]="GroundWorlds[' + (worlds.length - 1) + ']"' + closed + '>';
	});

	return {Template: made, Worlds: worlds};
}
