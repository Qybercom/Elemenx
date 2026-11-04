/*
 * The helpers the Components and the Services of ElemenxUI share, so each is written once: the text of a body without
 * the indentation of its template (BodyText), the first day of a week (FirstDay), and a list of listeners that tells
 * each of them apart (Listeners). An Application may use them too; its own Services keep their names.
 */
Elemenx.Service('ElemenxHelpers', {
	$Meta: {
		Description: 'The helpers the Components and the Services of ElemenxUI share: the text of a body, the first day of a week, a list of listeners.',
		Methods: ['BodyText(node)', 'FirstDay(setting, locale)', 'Listeners()']
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
	}
});
