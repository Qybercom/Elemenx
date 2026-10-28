/*
 * The board of the telemetry: the channels of the scene in their groups, each drawn by its kind (a dial, a bar, a
 * number, a sparkline, a signal, a lamp), the rate of the feed (1 to 120 packets a second), and what the page does:
 * the frames it draws a second (FPS), the packets it receives and the updates it shows. The rules of a fast board:
 * - the packets stay out of the state (the Feed keeps the latest one);
 * - once a frame (requestAnimationFrame) the latest packet goes into the state in one assignment, so many packets
 *   between two frames cost one render, and every binding reads the same Values;
 * - the histories of the sparklines are buffers of a fixed length (90 values), and the log keeps its last 30 lines;
 * - an update waits what the frame of the one before took past a frame: the board takes half of the page at most.
 * The scene gives the board a theme of its own: the car darcula, the ship scifi (Theme.Scope).
 */
Elemenx.Component('TelemetryBoard', {
	$TemplateURL: 'TelemetryBoard.html',
	$StyleURL: 'TelemetryBoard.css',
	Scene: 'car',
	Hz: 20,
	Paused: false,
	Groups: [],
	Values: {},
	Series: {},
	Lit: {},
	Log: [],
	Stats: {Fps: 0, Updates: 0, Packets: 0},
	Scenes: [{Value: 'car', Label: 'Race car'}, {Value: 'cluster', Label: 'Server cluster'}, {Value: 'ship', Label: 'Spaceship'}],
	Themes: {car: 'darcula', cluster: null, ship: 'scifi'},

	$OnCreate: function () {
		var self = this;
		var own = {Frame: 0, Seq: -1, History: {}, Lit: {}, Frames: 0, Updates: 0, Received: 0, Since: 0, Next: 0, Last: 0, Drew: false};

		this.Own = function () {
			return own;
		};

		/* A new scene: its channels in their groups, the histories and the alarms started again. */
		this.Listed = function (channels) {
			var groups = [];
			var byName = {};

			channels.forEach(function (item) {
				if (!byName[item.Group]) {
					byName[item.Group] = {Name: item.Group, Channels: []};

					groups.push(byName[item.Group]);
				}

				byName[item.Group].Channels.push(item);
			});

			own.History = {};
			own.Lit = {};
			own.Seq = -1;

			self.Groups = groups;
			self.Values = {};
			self.Series = {};
			self.Lit = {};
			self.Log = [];
		};
	},

	$OnReady: function () {
		var self = this;
		var own = this.Own();
		var feed = this.$Service('Feed');

		feed.OnChannels(this.Listed);
		feed.Connect();

		this.Themed();

		own.Since = performance.now();

		function frame (now) {
			own.Frames++;

			/*
			 * At most half of the time of the page goes to the board. A frame with an update lasts its script and the
			 * layout and the painting that follow; what it took past a frame, the next update waits (a frame of 40 ms:
			 * 23 ms more). A fast computer draws each frame; a busy one skips some, and the packets, the input and the
			 * rest of the page still get their turn, instead of a queue that grows behind the board.
			 */
			if (own.Drew) {
				own.Next = now + Math.max(0, now - own.Last - 17);
				own.Drew = false;
			}

			if (!self.Paused && feed.Latest && feed.Seq !== own.Seq && now >= own.Next) {
				self.Draw(feed.Latest);

				own.Drew = true;
			}

			own.Last = now;

			/* Once a second, what the page did in it. */
			if (now - own.Since >= 1000) {
				self.Stats = {Fps: Math.round(own.Frames * 1000 / (now - own.Since)), Updates: Math.round(own.Updates * 1000 / (now - own.Since)), Packets: Math.round((feed.Received - own.Received) * 1000 / (now - own.Since))};

				own.Frames = 0;
				own.Updates = 0;
				own.Received = feed.Received;
				own.Since = now;
			}

			own.Frame = window.requestAnimationFrame(frame);
		}

		own.Frame = window.requestAnimationFrame(frame);
	},

	$OnDestroy: function () {
		window.cancelAnimationFrame(this.Own().Frame);

		this.$Service('Feed').OffChannels(this.Listed);
	},

	/* The latest packet into the state: the buffers of the sparklines, the lamps and the alarms, then one assignment of each. */
	Draw: function (packet) {
		var self = this;
		var own = this.Own();
		var series = {};
		var lit = {};
		var lines = [];

		own.Seq = packet.Seq;
		own.Updates++;

		this.Groups.forEach(function (group) {
			group.Channels.forEach(function (item) {
				var value = packet.Values[item.ID];
				var on = item.Kind === 'lamp' ? value > 0.5 : item.Alarm !== null && value >= item.Alarm;
				var history;

				if (item.Kind === 'spark') {
					history = own.History[item.ID] = own.History[item.ID] || [];

					history.push(value);

					if (history.length > 90)
						history.shift();

					series[item.ID] = history.slice();
				}

				if (on && !own.Lit[item.ID] && item.Kind !== 'lamp')
					lines.push({ID: packet.Seq + '-' + item.ID, Time: new Date(packet.Time).toLocaleTimeString(), Text: item.Label + ' at ' + self.Text(item, value)});

				own.Lit[item.ID] = on;
				lit[item.ID] = on;
			});
		});

		this.Values = packet.Values;
		this.Series = series;
		this.Lit = lit;

		if (lines.length)
			this.Log = lines.reverse().concat(this.Log).slice(0, 30);
	},

	Text: function (item, value) {
		if (value === undefined || value === null) return '–';

		return (item.ID === 'gear' ? String(value) : Number(value).toFixed(item.Max - item.Min > 50 ? 0 : 1)) + (item.Unit ? ' ' + item.Unit : '');
	},

	Picked: function (value) {
		this.Scene = value;

		this.$Service('Feed').Scene(value);
		this.Themed();
	},

	/* The theme of the scene on the board alone, whatever the page shows. */
	Themed: function () {
		this.$Service('Theme').Scope(this.$Element(), this.Themes[this.Scene] || null);
	},

	Rated: function (value) {
		this.Hz = value;

		this.$Service('Feed').Rate(value);
	},

	Toggle: function () {
		this.Paused = !this.Paused;
	}
});
