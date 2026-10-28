/*
 * The icon of the Application, wherever it runs: the favicon of the tab on the web, the icon of the windows (the taskbar,
 * the dock) and of the tray in a native program (the Native Service). Every call takes callback(error) at the end.
 * - Set(icon, callback): the icon, a URL (or a path in the Application), the text of an SVG, a data URL, or {Light,
 *   Dark}, one for each scheme of the system (the tab of a browser follows the scheme of the system, not the one of
 *   the page); null brings back the icon of the page. In a program the windows take it (drawn into a PNG).
 * - Badge(count, callback): a count over the icon: the badge of the system in a program and in an installed web
 *   Application, and a red disc with the number drawn over the favicon (99+ past 99; 'dot' a disc alone; 0 removes it).
 * - Progress(value, callback): a part from 0 to 1, a ring around the favicon and the bar of the button of the window
 *   in a program; null removes it.
 * - Attention(on, callback): the window flashes in a program; on the web the favicon and the title blink while the
 *   page is hidden.
 * - Tray(icon, tooltip, callback): the picture (an icon as Set takes it) and the tooltip of the icon of the tray of a
 *   program (Native.Tray made it): online, offline, a count...
 * - Reset(callback): the icon of the page, no badge, no progress. Current() is {Icon, Badge, Progress}.
 */
Elemenx.Service('AppIcon', {
	$Meta: {
		Description: 'The icon of the Application: the favicon on the web, the icon of the windows and of the tray in a program.',
		Methods: ['Set(icon, callback)', 'Badge(count, callback)', 'Progress(value, callback)', 'Attention(on, callback)', 'Tray(icon, tooltip, callback)', 'Reset(callback)', 'Current()']
	},
	$OnCreate: function () {
		var self = this;

		this.Icon = null;
		this.Count = 0;
		this.Part = null;
		/* The icons the page named, to bring them back: [{Link, Href}]. */
		this.Originals = null;
		/* The last render: an older one that ends later is dropped. */
		this.Sequence = 0;
		this.Blinking = null;

		this.Scheme = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

		this.SchemeChanged = function () {
			if (self.Icon && typeof self.Icon === 'object')
				self.Render(function () {});
		};

		if (this.Scheme && this.Scheme.addEventListener)
			this.Scheme.addEventListener('change', this.SchemeChanged);
	},

	$OnDestroy: function () {
		if (this.Scheme && this.Scheme.removeEventListener)
			this.Scheme.removeEventListener('change', this.SchemeChanged);

		this.Blink(false);
	},

	Native: function () {
		var native = this.$Service('Native');

		return native && native.Available() ? native : null;
	},

	/* The icon for the scheme of now: a {Light, Dark} gives the one of the scheme. */
	Chosen: function (icon) {
		if (icon && typeof icon === 'object')
			return this.Scheme && this.Scheme.matches ? icon.Dark || icon.Light : icon.Light || icon.Dark;

		return icon || null;
	},

	/* A URL of an icon: the text of an SVG made a data URL, the others as they are. */
	Source: function (icon) {
		var text = String(icon).trim();
		if (/^<svg[\s>]/i.test(text) || /^<\?xml/i.test(text))
			return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);

		return text;
	},

	/* The links of the icons of the page; the first time, the ones it named are kept for Reset, and one is made when it has none. */
	Links: function () {
		var links = Array.prototype.slice.call(document.querySelectorAll('link[rel~="icon"]'));
		var link;

		if (!this.Originals) {
			this.Originals = links.map(function (each) {
				return {Link: each, Href: each.getAttribute('href'), Type: each.getAttribute('type')};
			});
		}

		if (!links.length) {
			link = document.createElement('link');
			link.rel = 'icon';

			link.setAttribute('data-elemenx-icon', '');

			document.head.appendChild(link);

			links = [link];
		}

		return links;
	},

	/* The icon of the page (Reset, Set(null)): the URL of its first icon, or null when it named none. */
	PageIcon: function () {
		var first = this.Originals && this.Originals[0];

		return first ? first.Href : null;
	},

	/* A picture loaded from a URL, or null when it cannot be read (another origin without CORS, a broken file). */
	Load: function (url, callback) {
		var picture = new Image();

		picture.crossOrigin = /^(data|blob):/.test(url) ? null : 'anonymous';

		picture.onload = function () {
			callback(picture);
		};

		picture.onerror = function () {
			callback(null);
		};

		picture.src = url;
	},

	/* A color of the theme (the danger of the badge, the accent of the ring), or fallback without a theme. */
	Color: function (token, fallback) {
		var value = typeof getComputedStyle === 'function' ? getComputedStyle(document.documentElement).getPropertyValue(token).trim() : '';

		return value || fallback;
	},

	/*
	 * Draws the icon of now (with its badge and its ring) and puts it where it shows: the favicon, and the windows of a
	 * program. An icon without a badge and a ring goes as its URL; with them it is drawn on a canvas of 64 pixels.
	 */
	Render: function (callback) {
		var self = this;
		var sequence = ++this.Sequence;
		var icon = this.Chosen(this.Icon);
		var url = icon ? this.Source(icon) : this.PageIcon();
		var native = this.Native();
		var plain = !this.Count && this.Part === null;

		function place (href, type) {
			if (sequence !== self.Sequence) return;

			self.Links().forEach(function (link) {
				if (href === null) link.removeAttribute('href');
				else link.setAttribute('href', href);

				if (type) link.setAttribute('type', type);
				else link.removeAttribute('type');
			});
		}

		if (plain && !native) {
			place(url, url && /^data:image\/svg/.test(url) ? 'image/svg+xml' : null);

			callback(null);

			return;
		}

		this.Draw(url, function (drawn) {
			if (sequence !== self.Sequence) {
				callback(null);

				return;
			}

			if (!plain) place(drawn || url, drawn ? 'image/png' : null);
			else place(url, null);

			/* A program takes the icon itself (its badge and progress are the ones of the system). */
			if (native && icon) {
				self.Draw(url, function (picture) {
					native.Icon(picture ? {Image: picture} : {Icon: url}, function (error) {
						callback(error || null);
					});
				}, true);

				return;
			}

			if (native && !icon) {
				native.Icon(null, function (error) {
					callback(error || null);
				});

				return;
			}

			callback(null);
		});
	},

	/* The icon at url drawn on a canvas of 64 pixels, with the badge and the ring of now (none with bare), as a data URL of a PNG; null when it cannot be read. */
	Draw: function (url, callback, bare) {
		var self = this;

		function paint (picture) {
			var canvas = document.createElement('canvas');
			var context;
			var text;

			canvas.width = 64;
			canvas.height = 64;
			context = canvas.getContext('2d');

			if (!context) {
				callback(null);

				return;
			}

			if (picture)
				context.drawImage(picture, self.Part !== null && !bare ? 6 : 0, self.Part !== null && !bare ? 6 : 0, self.Part !== null && !bare ? 52 : 64, self.Part !== null && !bare ? 52 : 64);

			if (!bare && self.Part !== null) {
				context.lineWidth = 6;
				context.strokeStyle = 'rgba(128, 128, 128, 0.35)';

				context.beginPath();
				context.arc(32, 32, 29, 0, Math.PI * 2);
				context.stroke();

				context.strokeStyle = self.Color('--elemenx-accent', '#1a73e8');

				context.beginPath();
				context.arc(32, 32, 29, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * self.Part);
				context.stroke();
			}

			if (!bare && self.Count) {
				text = self.Count === 'dot' ? '' : self.Count > 99 ? '99+' : String(self.Count);

				context.fillStyle = self.Color('--elemenx-danger', '#d93025');

				context.beginPath();
				context.arc(text ? 40 : 48, text ? 40 : 16, text ? 24 : 14, 0, Math.PI * 2);
				context.fill();

				if (text) {
					context.fillStyle = '#ffffff';
					context.font = 'bold ' + (text.length > 2 ? 20 : text.length > 1 ? 26 : 32) + 'px sans-serif';
					context.textAlign = 'center';
					context.textBaseline = 'middle';

					context.fillText(text, 40, 42);
				}
			}

			try {
				callback(canvas.toDataURL('image/png'));
			}
			catch (error) {
				/* A picture of another origin taints the canvas: the favicon stays the icon alone. */
				callback(null);
			}
		}

		if (!url) {
			paint(null);

			return;
		}

		this.Load(url, paint);
	},

	Set: function (icon, callback) {
		this.Icon = icon === undefined ? null : icon;

		this.Render(callback || function () {});
	},

	Badge: function (count, callback) {
		var native = this.Native();
		var done = callback || function () {};
		var value = count === 'dot' ? 'dot' : Math.max(0, Math.floor(Number(count) || 0));
		var self = this;

		this.Count = value;

		/* The badge of the system: in a program (Native), and in an installed web Application (navigator.setAppBadge). */
		if (native || (typeof navigator !== 'undefined' && typeof navigator.setAppBadge === 'function')) {
			this.$Service('Native').Badge(value === 'dot' ? 1 : value, function () {
				self.Render(done);
			});

			return;
		}

		this.Render(done);
	},

	Progress: function (value, callback) {
		var native = this.Native();
		var done = callback || function () {};
		var self = this;

		this.Part = value === null || value === undefined ? null : Math.max(0, Math.min(1, Number(value) || 0));

		if (native) {
			native.Progress(this.Part, function () {
				self.Render(done);
			});

			return;
		}

		this.Render(done);
	},

	/* The window asks for attention: in a program it flashes (Native); on the web the favicon and the title blink while the page is hidden. */
	Attention: function (on, callback) {
		var native = this.Native();

		if (native) {
			native.Attention(!!on, callback);

			return;
		}

		this.Blink(!!on);

		(callback || function () {})(null);
	},

	Blink: function (on) {
		var self = this;
		var shown = true;

		if (this.Blinking) {
			window.clearInterval(this.Blinking.Timer);

			document.removeEventListener('visibilitychange', this.Blinking.Seen);

			document.title = this.Blinking.Title;
			this.Count = this.Blinking.Count;
			this.Blinking = null;

			this.Render(function () {});
		}

		if (!on || typeof document === 'undefined' || document.visibilityState === 'visible') return;

		this.Blinking = {Title: document.title, Count: this.Count, Timer: 0, Seen: function () {
			if (document.visibilityState === 'visible')
				self.Blink(false);
		}};

		document.addEventListener('visibilitychange', this.Blinking.Seen);

		this.Blinking.Timer = window.setInterval(function () {
			shown = !shown;

			document.title = shown ? self.Blinking.Title : '• ' + self.Blinking.Title;
			self.Count = shown ? self.Blinking.Count : self.Blinking.Count || 'dot';

			self.Render(function () {});
		}, 1000);
	},

	/* The picture and the tooltip of the icon of the tray of a program. */
	Tray: function (icon, tooltip, callback) {
		var native = this.Native();
		var url = icon ? this.Source(this.Chosen(icon)) : null;
		var done = callback || function () {};

		if (!native) {
			done(new Error('Elemenx AppIcon Tray needs a native program'));

			return;
		}

		if (!url) {
			native.TrayIcon({Tooltip: tooltip}, done);

			return;
		}

		this.Draw(url, function (picture) {
			native.TrayIcon(picture ? {Image: picture, Tooltip: tooltip} : {Icon: url, Tooltip: tooltip}, done);
		}, true);
	},

	Reset: function (callback) {
		var native = this.Native();
		var done = callback || function () {};

		this.Icon = null;
		this.Count = 0;
		this.Part = null;

		this.Blink(false);

		/* The links the page had, as they were; the one made here goes. */
		(this.Originals || []).forEach(function (each) {
			if (each.Href === null) each.Link.removeAttribute('href');
			else each.Link.setAttribute('href', each.Href);

			if (each.Type === null) each.Link.removeAttribute('type');
			else each.Link.setAttribute('type', each.Type);
		});

		Array.prototype.forEach.call(document.querySelectorAll('link[data-elemenx-icon]'), function (link) {
			link.parentNode.removeChild(link);
		});

		this.Originals = null;
		this.Sequence++;

		if (!native) {
			done(null);

			return;
		}

		native.Badge(0, function () {
			native.Progress(null, function () {
				native.Icon(null, function (error) {
					done(error || null);
				});
			});
		});
	},

	Current: function () {
		return {Icon: this.Icon, Badge: this.Count, Progress: this.Part};
	}
});
