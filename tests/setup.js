export async function loadElemenx () {
	if (window.Elemenx) return window.Elemenx;

	await new Promise(function (resolve, reject) {
		var script = document.createElement('script');
		script.src = '/elemenx.js';
		script.onload = resolve;
		script.onerror = reject;
		document.head.appendChild(script);
	});

	return window.Elemenx;
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
		if (value) return value;
		await tick(15);
	}

	return false;
}

export function unique (prefix) {
	unique.ID = (unique.ID || 0) + 1;
	return prefix + unique.ID;
}