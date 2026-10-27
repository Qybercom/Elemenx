/*
 * The live numbers of the shop, from the stream of the server (/api/stream, server-sent events). Start() connects,
 * Pause() closes the stream; a page that is hidden pauses it and takes it up again when it shows. The browser
 * reconnects by itself after a break, and the server goes on after the last tick it sent (after a pause too: the new
 * stream names it). State is connecting, live,
 * reconnecting or paused; Points the visitors of the last minute ({Time, Visitors}), Recent the newest orders, Orders
 * and Revenue their count and sum since the start. OnChange(callback) tells each change, OffChange(callback).
 */
/* The messages of the stream: a tick of JSON is a Protocol.Tick event, anything else Protocol.Invalid. */
Elemenx.Network.Protocol('Shop', {
	Decode: function (text) {
		try {
			return {Type: 'Tick', Data: JSON.parse(text)};
		}
		catch (error) {
			return {Type: 'Invalid', Data: text};
		}
	}
});

Elemenx.Service('Live', {
	Kept: 60,

	$OnCreate: function () {
		var self = this;

		this.Stream = null;
		this.State = 'paused';
		this.Points = [];
		this.Recent = [];
		this.Orders = 0;
		this.Revenue = 0;
		this.Listeners = [];
		this.Wanted = false;
		this.Last = 0;

		/* A hidden tab needs no numbers: the stream waits for the page to show again. */
		document.addEventListener('visibilitychange', function () {
			if (!self.Wanted) return;

			if (document.hidden) self.Close('paused');
			else self.Open();
		});
	},

	Start: function () {
		this.Wanted = true;

		this.Open();
	},

	Pause: function () {
		this.Wanted = false;

		this.Close('paused');
	},

	Open: function () {
		var self = this;

		if (this.Stream) return;

		/* The browser sends the last id itself only when it reconnects; a new stream names it in the URL. */
		this.Stream = this.$Network().SSE({URL: '/api/stream' + (this.Last ? '?after=' + this.Last : ''), Protocol: 'Shop'});

		this.Stream.On('Transport.Open', function () {
			self.Tell('live');
		});

		/* ReadyState 0: the browser tries again by itself. */
		this.Stream.On('Transport.Error', function (event) {
			self.Tell(event.Data.ReadyState === 0 ? 'reconnecting' : 'paused');
		});

		this.Stream.On('Protocol.Tick', function (event) {
			self.Take(event.Data);
		});

		this.State = 'connecting';

		this.Stream.Connect();
		this.Tell(this.State);
	},

	Close: function (state) {
		if (this.Stream) {
			this.Stream.Close();
			this.Stream = null;
		}

		this.Tell(state);
	},

	/* A tick: a point of the chart, and its order if it has one. */
	Take: function (tick) {
		this.Last = tick.ID;
		this.Points = this.Points.concat([{Time: tick.Time, Visitors: tick.Visitors}]).slice(-this.Kept);

		if (tick.Order) {
			this.Recent = [tick.Order].concat(this.Recent).slice(0, 5);
			this.Orders += 1;
			this.Revenue += tick.Order.Amount;
		}

		this.Tell('live');
	},

	Tell: function (state) {
		var self = this;

		this.State = state;

		this.Listeners.slice().forEach(function (callback) {
			callback(self);
		});
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (each) {
			return each !== callback;
		});
	}
});
