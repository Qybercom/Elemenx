/*
 * The bridge of an Elemenx Application in the ElemenxView of an Android program of its own (elemenx build --native
 * android-library): window.ElemenxNative for the Platform Service of ElemenxUI, over the door the view gives the frames of
 * the Application alone (window.ElemenxAndroid, a listener of messages: postMessage and onmessage). The features and the
 * names of the handlers of the program are in the page before it (window.ElemenxAndroidState), and come again by a
 * message when the program registers more (state). A call goes to the handler the program registered (ElemenxView.handle)
 * as a message, its answer comes back as one (reply); the events of the program too (event). Can tells whether the
 * program handles a call: the Service does the others as on the web. No door (a frame of another origin, an old
 * WebView): no ElemenxNative, the Application runs as on the web.
 */
(function () {
	var port = window.ElemenxAndroid;
	var given = window.ElemenxAndroidState || {};
	var pending = {};
	var listeners = {};
	var sequence = 0;
	var features = [];
	var handlers = [];

	if (!port || typeof port.postMessage !== 'function' || window.ElemenxNative) return;

	/* What the program has: kept in the same lists, which the Service holds. */
	function told (state) {
		features.splice.apply(features, [0, features.length].concat(state && state.Features || []));
		handlers.splice.apply(handlers, [0, handlers.length].concat(state && state.Handlers || []));
	}

	told(given);

	window.ElemenxNative = {
		Platform: 'android',
		System: 'android',
		Features: features,
		Can: function (name) {
			return handlers.indexOf(String(name)) !== -1;
		},
		Call: function (name, args, callback) {
			var id = String(++sequence);

			pending[id] = callback || function () {};

			port.postMessage(JSON.stringify({Type: 'call', ID: id, Name: String(name), Args: args === undefined || args === null ? {} : args}));
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

	port.onmessage = function (event) {
		var message;

		try {
			message = JSON.parse(event.data);
		}
		catch (error) {
			return;
		}

		if (message.Type === 'reply') window.ElemenxNative.Reply(message.ID, message.Error, message.Value);
		else if (message.Type === 'event') window.ElemenxNative.Emit(message.Name, message.Value);
		else if (message.Type === 'state') told(message.State);
	};

	/* The door opened: the program sends its events to this frame, and its state once more. */
	port.postMessage(JSON.stringify({Type: 'hello'}));
})();
