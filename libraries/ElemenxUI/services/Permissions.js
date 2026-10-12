/*
 * The permissions of the browser. Query(name, callback) tells the state: 'granted', 'denied', 'prompt' or
 * 'unsupported'. Request(name, callback) asks the user the way that permission is asked (a notification permission,
 * a position, a camera or microphone stream that is stopped at once, a read of the clipboard, persistent storage)
 * and tells the state that follows. Watch(name, callback) reports each change of the state and returns the ID for
 * Unwatch(id). Names: notifications, geolocation, camera, microphone, clipboard-read, clipboard-write,
 * persistent-storage. callback(error, state).
 */
Elemenx.Service('Permissions', {
	$OnCreate: function () {
		this.Watches = {};
		this.Sequence = 0;
	},

	$OnDestroy: function () {
		var id;

		for (id in this.Watches) {
			if (Object.prototype.hasOwnProperty.call(this.Watches, id))
				this.Unwatch(id);
		}
	},

	Status: function (name, callback) {
		if (!navigator.permissions || typeof navigator.permissions.query !== 'function') {
			callback(null, null);

			return;
		}

		navigator.permissions.query({name: name}).then(function (status) {
			callback(null, status);
		}, function () {
			callback(null, null);
		});
	},

	Query: function (name, callback) {
		if (name === 'notifications' && typeof window.Notification === 'function' && !navigator.permissions) {
			callback(null, window.Notification.permission === 'default' ? 'prompt' : window.Notification.permission);

			return;
		}

		this.Status(name, function (error, status) {
			callback(null, status ? status.state : 'unsupported');
		});
	},

	Request: function (name, callback) {
		var self = this;

		function after () {
			self.Query(name, callback);
		}

		if (name === 'notifications' && typeof window.Notification === 'function') {
			window.Notification.requestPermission().then(after, after);
		}
		else if (name === 'geolocation' && navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(after, after);
		}
		else if ((name === 'camera' || name === 'microphone') && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices.getUserMedia(name === 'camera' ? {video: true} : {audio: true}).then(function (stream) {
				stream.getTracks().forEach(function (track) {
					track.stop();
				});

				after();
			}, after);
		}
		else if (name === 'clipboard-read' && navigator.clipboard && navigator.clipboard.readText) {
			navigator.clipboard.readText().then(after, after);
		}
		else if (name === 'persistent-storage' && navigator.storage && navigator.storage.persist) {
			navigator.storage.persist().then(after, after);
		}
		else {
			after();
		}
	},

	Watch: function (name, callback) {
		var self = this;
		var id;

		this.Sequence++;

		id = 'permission-' + this.Sequence;

		this.Watches[id] = {Status: null, Listener: null};

		this.Status(name, function (error, status) {
			var watch = self.Watches[id];
			if (!status || !watch) return;

			watch.Status = status;
			watch.Listener = function () {
				callback(null, status.state);
			};

			status.addEventListener('change', watch.Listener);
		});

		return id;
	},

	Unwatch: function (id) {
		var watch = this.Watches[id];
		if (watch && watch.Status)
			watch.Status.removeEventListener('change', watch.Listener);

		delete this.Watches[id];
	}
});
