/*
 * The bridge of an Elemenx Application in the ElemenxView of an Android program of its own (elemenx build --native
 * android-library): window.ElemenxNative for the Platform Service of ElemenxUI, over the door the view gives the page
 * (window.ElemenxAndroid). A call goes to the handler the program registered (ElemenxView.handle), its answer comes
 * back by Reply; the events of the program come by Emit. Can tells whether the program handles a call: the Service
 * does the others as on the web.
 */
(function () {
	var port = window.ElemenxAndroid;
	var pending = {};
	var listeners = {};
	var sequence = 0;
	var features = [];

	if (!port || window.ElemenxNative) return;

	try {
		features = JSON.parse(port.features());
	}
	catch (error) {
		features = [];
	}

	window.ElemenxNative = {
		Platform: 'android',
		System: 'android',
		Features: features,
		Can: function (name) {
			return !!port.can(String(name));
		},
		Call: function (name, args, callback) {
			var id = String(++sequence);

			pending[id] = callback || function () {};

			port.call(id, String(name), JSON.stringify(args === undefined || args === null ? {} : args));
		},
		On: function (name, callback) {
			(listeners[name] = listeners[name] || []).push(callback);

			return function () {
				listeners[name] = (listeners[name] || []).filter(function (item) {
					return item !== callback;
				});
			};
		},
		/* The answer of the program to a call, and its events. */
		Reply: function (id, error, value) {
			var callback = pending[id];

			delete pending[id];

			if (callback)
				callback(error ? new Error(error) : null, error ? null : value);
		},
		Emit: function (name, value) {
			(listeners[name] || []).slice().forEach(function (callback) {
				callback(value);
			});
		}
	};
})();
