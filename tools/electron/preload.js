'use strict';

/*
 * The bridge of an Elemenx program between its page and its main process: window.ElemenxNative, the only native door
 * of the page (the Platform Service of ElemenxUI uses it). Call(name, args, callback) asks the main process, callback
 * (error, result); On(name, callback) hears its events (menu, tray, window). Features lists the features it answers.
 */

var electron = require('electron');

var features = (process.argv.filter(function (argument) {
	return argument.indexOf('--elemenx-features=') === 0;
})[0] || '').replace('--elemenx-features=', '').split(',').filter(Boolean);

/* The frame and the material of the window: the page reads them, and its CSS by data-elemenx-frame and data-elemenx-material. */
var frame = argument('frame') || 'system';
var material = argument('material') || 'none';

var listeners = {};

function argument (name) {
	return (process.argv.filter(function (value) {
		return value.indexOf('--elemenx-' + name + '=') === 0;
	})[0] || '').replace('--elemenx-' + name + '=', '');
}

function mark () {
	document.documentElement.setAttribute('data-elemenx-frame', frame);

	if (material !== 'none')
		document.documentElement.setAttribute('data-elemenx-material', material);
}

if (typeof document !== 'undefined' && document.documentElement) mark();
else if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', mark);

electron.ipcRenderer.on('elemenx:native-event', function (event, name, value) {
	(listeners[name] || []).slice().forEach(function (callback) {
		callback(value);
	});
});

electron.contextBridge.exposeInMainWorld('ElemenxNative', {
	Platform: 'electron',
	System: process.platform,
	Frame: frame,
	Material: material,
	Features: features,
	Call: function (name, args, callback) {
		electron.ipcRenderer.invoke('elemenx:native', String(name), args || {}).then(function (result) {
			if (callback)
				callback(null, result === undefined ? null : result);
		}, function (error) {
			if (callback)
				callback(new Error(String(error && error.message || error).replace(/^Error invoking remote method 'elemenx:native': (Error: )?/, '')));
		});
	},
	On: function (name, callback) {
		(listeners[name] = listeners[name] || []).push(callback);

		return function () {
			listeners[name] = (listeners[name] || []).filter(function (item) {
				return item !== callback;
			});
		};
	}
});
