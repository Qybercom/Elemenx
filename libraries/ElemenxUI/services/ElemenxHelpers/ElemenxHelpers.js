/*
 * The helpers the Components and the Services of ElemenxUI share, so each is written once: the text of a body without
 * the indentation of its template (BodyText), the first day of a week (FirstDay), a list of listeners that tells
 * each of them apart (Listeners), the focus moved among elements by the arrow keys (Rove), and whether a value changes
 * on and on (Live). An Application may use them too; its own Services keep their names.
 */
Elemenx.Service('ElemenxHelpers', {
	$Meta: {
		Description: 'The helpers the Components and the Services of ElemenxUI share: the text of a body, the first day of a week, a list of listeners.',
		Methods: ['BodyText(node)', 'FirstDay(setting, locale)', 'Listeners()', 'Rove(event, elements, options)', 'Live(quiet)']
	},

	/*
	 * The text of a body: its lines without the indentation they all share, and without the blank lines around them,
	 * so a text indented as the template around it reads as it was written.
	 */
	BodyText: function (node) {
		var lines = String(node ? node.textContent : '').replace(/\r\n?/g, '\n').split('\n');
		var indent = null;

		while (lines.length && !lines[0].trim()) {
			lines.shift();
		}

		while (lines.length && !lines[lines.length - 1].trim()) {
			lines.pop();
		}

		lines.forEach(function (line) {
			var lead = /^[ \t]*/.exec(line)[0];
			if (line.trim() && (indent === null || lead.length < indent.length))
				indent = lead;
		});

		return lines.map(function (line) {
			return indent && line.indexOf(indent) === 0 ? line.substring(indent.length) : line.replace(/^[ \t]+$/, '');
		}).join('\n');
	},

	/*
	 * The first day of a week (0 Sunday ... 6 Saturday): a number of setting, Monday without one, and for 'locale' the
	 * one of locale (the language of the page without one) where the browser knows it, else Monday.
	 */
	FirstDay: function (setting, locale) {
		var info;

		if (setting === null || setting === undefined || setting === '') return 1;

		if (setting !== 'locale')
			return Number(setting) % 7;

		try {
			info = new Intl.Locale(locale || Elemenx.Locale.Language());

			if (info.weekInfo)
				return info.weekInfo.firstDay % 7;

			if (typeof info.getWeekInfo === 'function') return info.getWeekInfo().firstDay % 7;
		}
		catch (error) {
			/* A browser without Intl.Locale, or a locale it does not know: Monday. */
		}

		return 1;
	},

	/*
	 * A list of listeners: On(callback) adds one (once) and returns it, Off(callback) takes it away, Tell(...) calls each
	 * with what it is given, Count() tells how many there are and Clear() takes them all away. A listener that throws stops none of the others: its error goes to the page (reportError),
	 * as an event listener of the DOM does.
	 */
	Listeners: function () {
		var list = [];

		return {
			On: function (callback) {
				if (typeof callback === 'function' && list.indexOf(callback) === -1)
					list.push(callback);

				return callback;
			},

			Off: function (callback) {
				var index = list.indexOf(callback);
				if (index !== -1)
					list.splice(index, 1);
			},

			Tell: function () {
				var listeners = list.slice();
				var args = arguments;
				var i = 0;

				while (i < listeners.length) {
					try {
						listeners[i].apply(null, args);
					}
					catch (error) {
						if (typeof window.reportError === 'function') {
							window.reportError(error);
						}
						else {
							window.setTimeout(function () {
								throw error;
							}, 0);
						}
					}

					i++;
				}
			},

			Count: function () {
				return list.length;
			},

			/* Every listener taken away (an owner destroyed lets them go). */
			Clear: function () {
				list.length = 0;
			}
		};
	},

	/*
	 * The focus moved among elements by the keys of a list: the arrow down (right in a row: Orientation 'horizontal';
	 * left in a page from right to left) to the next, up to the one before, round from the last to the first unless
	 * Wrap is false, Home to the first, End to the last. Gives the element it went to (the key taken), or null for
	 * another key. The element the event came from, or holds it, is where it starts; from none, the first or the last.
	 */
	Rove: function (event, elements, options) {
		var given = options || {};
		var list = Array.prototype.slice.call(elements || []);
		var key = Elemenx.Locale && typeof Elemenx.Locale.Key === 'function' ? Elemenx.Locale.Key(event) : event.key;
		var row = given.Orientation === 'horizontal';
		var wrap = given.Wrap !== false;
		var index = -1;
		var target = null;
		var i;

		for (i = 0; i < list.length && index === -1; i++) {
			if (list[i] === event.target || list[i].contains(event.target))
				index = i;
		}

		if (!list.length) return null;

		if (key === (row ? 'ArrowRight' : 'ArrowDown')) target = index === -1 ? list[0] : index + 1 < list.length ? list[index + 1] : wrap ? list[0] : null;
		else if (key === (row ? 'ArrowLeft' : 'ArrowUp')) target = index === -1 ? list[list.length - 1] : index > 0 ? list[index - 1] : wrap ? list[list.length - 1] : null;
		else if (key === 'Home') target = list[0];
		else if (key === 'End') target = list[list.length - 1];
		else return null;

		event.preventDefault();

		if (target)
			target.focus();

		return target;
	},

	/*
	 * Whether a value changes on and on: a function of the value that tells true while it changed less than quiet
	 * milliseconds (200) after the change before. A gauge fed each frame (a speed, the revolutions of a car) then shows
	 * its value at once: a transition started again every frame cost more than the frame of the page could spare
	 * (0.4 ms each update of a Meter), and lagged behind the value. A value that changes now and then still glides.
	 */
	Live: function (quiet) {
		var wait = quiet === undefined || quiet === null ? 200 : Number(quiet);
		var last = null;
		var at = -Infinity;
		var live = false;

		return function (value) {
			var now;

			if (value === last) return live;

			now = typeof performance !== 'undefined' ? performance.now() : Date.now();
			live = now - at < wait;
			at = now;
			last = value;

			return live;
		};
	}
});
