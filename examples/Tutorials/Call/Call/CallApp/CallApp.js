/* The call: a lobby to give a name and a room, then the stage of the room. Everything else is the Room Service. */
Elemenx.Component('CallApp', {
	$TemplateURL: 'CallApp.html',
	$StyleURL: 'CallApp.css',
	Name: '',
	RoomName: 'team',
	State: 'idle',
	Self: null,
	People: [],

	$OnCreate: function () {
		var self = this;

		this.Listener = function (room) {
			self.State = room.State;
			self.Self = room.Self ? {Name: room.Self.Name, Stream: room.Self.Stream, Muted: room.Self.Muted, Camera: room.Self.Camera} : null;
			self.People = room.People;
		};

		this.$Service('Room').OnChange(this.Listener);
	},

	/* Leaving the page leaves the call: the others see the tile go, the camera stops. */
	$OnDestroy: function () {
		this.$Service('Room').OffChange(this.Listener);
		this.$Service('Room').Leave();
	},

	Named: function (value) {
		this.Name = value;
	},

	Roomed: function (value) {
		this.RoomName = value;
	},

	Joined: function (event) {
		if (event && event.preventDefault)
			event.preventDefault();

		if (!this.Name.trim()) return;

		this.$Service('Room').Join(this.Name.trim(), this.RoomName.trim() || 'team');
	},

	Muted: function (event) {
		this.$Service('Room').Mute(event.Muted);
	},

	Filmed: function (event) {
		this.$Service('Room').Camera(event.Camera);
	},

	Left: function () {
		this.$Service('Room').Leave();
	}
});
