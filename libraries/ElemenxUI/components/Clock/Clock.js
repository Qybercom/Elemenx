/*
 * The time now: digital (the time as the language of the page writes it) or analog (a face with hands). TimeZone
 * shows the time of a zone of the IANA (Europe/Paris), and Label names it under the time (a city); Seconds shows the
 * seconds; Hour12 forces 12 or 24 hours (by default, the one of the language). ShowDate adds the date under a
 * digital clock. It moves once a second, and stops while it sleeps (Cache).
 */
Elemenx.Component('Clock', {
	$TemplateURL: 'Clock.html',
	$StyleURL: 'Clock.css',
	$Meta: {
		Group: 'display',
		Icon: 'clock',
		Description: 'The time now: digital or analog, of a time zone.',
		Props: {
			Mode: {Options: ['digital', 'analog'], Description: 'digital (the time as text) or analog (a face with hands).'},
			TimeZone: 'A time zone of the IANA (Europe/Paris); the one of the device by default.',
			Seconds: 'Shows the seconds.',
			Hour12: 'true for 12 hours, false for 24; the one of the language by default.',
			ShowDate: 'Shows the date under a digital clock.',
			Label: 'A name under the time (a city).',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'}
		},
		Sample: {Seconds: true}
	},
	Mode: 'digital',
	TimeZone: '',
	Seconds: false,
	Hour12: null,
	ShowDate: false,
	Label: '',
	Size: 'medium',
	Now: 0,

	$OnCreate: function () {
		var self = this;
		var own = {Timer: 0, Zones: {}};

		this.Own = function () {
			return own;
		};

		this.Now = Date.now();

		/* The options of Intl of the time zone and the hours: a zone the browser does not know is the one of the device. */
		function options (extra) {
			var result = {};
			var key;

			if (self.TimeZone && known(self.TimeZone))
				result.timeZone = self.TimeZone;

			if (self.Hour12 !== null && self.Hour12 !== '' && self.Hour12 !== undefined)
				result.hour12 = self.Hour12 === true || self.Hour12 === 'true';

			for (key in extra) {
				if (Object.prototype.hasOwnProperty.call(extra, key))
					result[key] = extra[key];
			}

			return result;
		}

		/* Whether the browser knows a time zone: one it does not know is the one of the device. */
		function known (zone) {
			if (!Object.prototype.hasOwnProperty.call(own.Zones, zone)) {
				try {
					new Intl.DateTimeFormat('en', {timeZone: zone}).format(0);

					own.Zones[zone] = true;
				}
				catch (error) {
					own.Zones[zone] = false;
				}
			}

			return own.Zones[zone];
		}

		function format (now, extra) {
			return new Intl.DateTimeFormat(Elemenx.Locale.Language(), options(extra)).format(new Date(now));
		}

		this.Time = function (now, seconds) {
			return format(now, seconds && seconds !== 'false' ? {hour: 'numeric', minute: '2-digit', second: '2-digit'} : {hour: 'numeric', minute: '2-digit'});
		};

		this.Day = function (now) {
			return format(now, {weekday: 'short', day: 'numeric', month: 'long'});
		};

		/* The angles of the hands, in degrees: {Hour, Minute, Second}, from the hours, minutes and seconds of the zone. */
		this.Hands = function (now) {
			var parts = {};

			new Intl.DateTimeFormat('en-GB', options({hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false})).formatToParts(new Date(now)).forEach(function (part) {
				parts[part.type] = Number(part.value);
			});

			return {
				Hour: (parts.hour % 12 + parts.minute / 60) * 30,
				Minute: (parts.minute + parts.second / 60) * 6,
				Second: parts.second * 6
			};
		};

		this.Marks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
	},

	$OnReady: function () {
		this.Start();
	},

	/* Every second, at the turn of the second. */
	Start: function () {
		var self = this;
		var own = this.Own();

		this.Stop();

		own.Timer = window.setTimeout(function () {
			self.Now = Date.now();

			self.Start();
		}, 1000 - Date.now() % 1000 + 5);
	},

	Stop: function () {
		var own = this.Own();
		if (own.Timer)
			window.clearTimeout(own.Timer);

		own.Timer = 0;
	},

	$OnSleep: function () {
		this.Stop();
	},

	$OnWake: function () {
		this.Now = Date.now();

		this.Start();
	},

	$OnDestroy: function () {
		this.Stop();
	}
});
