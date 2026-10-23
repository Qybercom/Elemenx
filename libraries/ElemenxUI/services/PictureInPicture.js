/*
 * Picture-in-Picture: a video, or any part of the page, in a small window of its own that stays over the other
 * windows of the system.
 * - Supported(kind): whether the browser has it, for kind 'video' (Chrome, Edge, Safari, Firefox with its own button)
 *   or 'document' (any element: Chrome and Edge).
 * - Video(video, callback): the video in its window, or back when it is there already; callback(error, {Active}).
 * - Document(element, {Width, Height, Title}, callback): the element moves into a window of its own, with the styles,
 *   the theme and the direction of the page; a frame in its place tells where it is and brings it back. It comes back
 *   when the window closes. callback(error, {Window}).
 * - Close(callback): the video or the element back in the page. Active(): {Kind, Element} or null.
 * - OnChange(callback) / OffChange(callback): callback(Active()) when something goes into a window or comes back.
 * The browser lets a window open only after a press or a key of the user.
 */
Elemenx.Service('PictureInPicture', {
	$Meta: {
		Description: 'Picture-in-Picture: a video, or any part of the page, in a small window of its own that stays over the other windows of the system.',
		Methods: ['Supported(kind)', 'Active()', 'OnChange(callback)', 'OffChange(callback)', 'Video(video, callback)', 'Document(element, options, callback)', 'Close(callback)']
	},
	$OnCreate: function () {
		this.Current = null;
		this.Listeners = [];
	},

	$OnDestroy: function () {
		this.Close();
	},

	Supported: function (kind) {
		if (kind === 'document')
			return !!window.documentPictureInPicture && typeof window.documentPictureInPicture.requestWindow === 'function';

		return !!document.pictureInPictureEnabled && typeof HTMLVideoElement === 'function' && typeof HTMLVideoElement.prototype.requestPictureInPicture === 'function';
	},

	Active: function () {
		return this.Current ? {Kind: this.Current.Kind, Element: this.Current.Element} : null;
	},

	OnChange: function (callback) {
		if (this.Listeners.indexOf(callback) === -1)
			this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (listener) {
			return listener !== callback;
		});
	},

	Changed: function () {
		var state = this.Active();

		this.Listeners.slice().forEach(function (listener) {
			listener(state);
		});
	},

	Video: function (video, callback) {
		var self = this;

		callback = callback || function () {};

		if (!this.Supported('video')) {
			callback(new Error('Picture-in-Picture of a video is not supported here'));

			return;
		}

		if (document.pictureInPictureElement === video) {
			this.Close(function (error) {
				callback(error || null, {Active: false});
			});

			return;
		}

		video.requestPictureInPicture().then(function () {
			var left = function () {
				video.removeEventListener('leavepictureinpicture', left);

				if (self.Current && self.Current.Element === video) {
					self.Current = null;

					self.Changed();
				}
			};

			video.addEventListener('leavepictureinpicture', left);

			self.Current = {Kind: 'video', Element: video};

			self.Changed();

			callback(null, {Active: true});
		}, function (error) {
			callback(error);
		});
	},

	Document: function (element, options, callback) {
		var self = this;

		options = options || {};
		callback = callback || function () {};

		if (!this.Supported('document')) {
			callback(new Error('Picture-in-Picture of a document is not supported here'));

			return;
		}

		if (this.Current && this.Current.Element === element) {
			callback(null, {Window: this.Current.Window || null});

			return;
		}

		this.Close();

		window.documentPictureInPicture.requestWindow({width: Math.round(options.Width || element.offsetWidth || 400), height: Math.round(options.Height || element.offsetHeight || 300)}).then(function (pip) {
			self.Open(element, pip, options);

			callback(null, {Window: pip});
		}, function (error) {
			callback(error);
		});
	},

	/* The element into the window: the styles and the look of the page go along, a frame takes its place. */
	Open: function (element, pip, options) {
		var self = this;
		var holder = document.createElement('div');
		var text = document.createElement('span');
		var back = document.createElement('button');
		var current;
		var copy = function () {
			Array.prototype.forEach.call(document.documentElement.attributes, function (attribute) {
				pip.document.documentElement.setAttribute(attribute.name, attribute.value);
			});

			pip.document.body.className = 'elemenx-pip-body';
		};
		var style = function (node) {
			if (node.nodeName === 'STYLE' || (node.nodeName === 'LINK' && /stylesheet/i.test(node.rel)))
				pip.document.head.appendChild(node.cloneNode(true));
		};
		var watch = new MutationObserver(function (records) {
			records.forEach(function (record) {
				if (record.type === 'attributes') copy();
				else Array.prototype.forEach.call(record.addedNodes, style);
			});
		});

		Array.prototype.forEach.call(document.head.childNodes, style);

		copy();

		pip.document.title = options.Title || document.title;

		holder.className = 'elemenx-pip-placeholder';
		holder.style.minHeight = Math.min(element.offsetHeight, 160) + 'px';

		text.textContent = Elemenx.Locale.Text('ui.pip.away');

		back.type = 'button';
		back.className = 'elemenx-pip-back';
		back.textContent = Elemenx.Locale.Text('ui.pip.back');

		back.addEventListener('click', function () {
			self.Close();
		});

		holder.appendChild(text);
		holder.appendChild(back);

		element.parentNode.insertBefore(holder, element);

		pip.document.body.appendChild(element);

		watch.observe(document.head, {childList: true});
		watch.observe(document.documentElement, {attributes: true});

		current = {Kind: 'document', Element: element, Window: pip, Holder: holder, Watch: watch};

		current.Return = function () {
			pip.removeEventListener('pagehide', current.Return);

			watch.disconnect();

			if (holder.parentNode) {
				holder.parentNode.insertBefore(element, holder);
				holder.parentNode.removeChild(holder);
			}

			if (self.Current === current) {
				self.Current = null;

				self.Changed();
			}
		};

		pip.addEventListener('pagehide', current.Return);

		this.Current = current;

		this.Changed();
	},

	Close: function (callback) {
		var current = this.Current;

		callback = callback || function () {};

		if (!current) {
			callback(null);

			return;
		}

		if (current.Kind === 'video') {
			if (document.pictureInPictureElement && document.exitPictureInPicture) {
				document.exitPictureInPicture().then(function () {
					callback(null);
				}, function (error) {
					callback(error);
				});

				return;
			}

			this.Current = null;

			this.Changed();

			callback(null);

			return;
		}

		current.Return();

		if (!current.Window.closed)
			current.Window.close();

		callback(null);
	}
});
