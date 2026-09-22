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
	document.body.innerHTML = '<div id="mount"></div>';
	
	return document.getElementById('mount');
}

export function tick (ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms === undefined ? 30 : ms);
	});
}