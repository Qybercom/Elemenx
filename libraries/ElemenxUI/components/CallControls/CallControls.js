/*
 * The bar of a call: the microphone, the camera (each with the menu of its devices), the screen, the hand, the
 * reactions, the chat, the people, the layout and leaving. It shows the state it is given (Muted, Camera, Sharing,
 * Hand, Chat, People, Layout) and tells what is pressed: mute ({Muted}), camera ({Camera}), share ({Sharing}), hand
 * ({Hand}), chat and people ({Open}), each with the state it asks for; react ({Emoji}), layout ({Layout}), device
 * ({Kind: microphone, speaker or camera, ID}) and leave. Devices: {Microphones, Speakers, Cameras: [{ID, Label}],
 * Microphone, Speaker, Camera (the IDs chosen)}. Reactions: the emoji of its menu. Hide: the buttons left out.
 */
Elemenx.Component('CallControls', {
	$TemplateURL: 'CallControls.html',
	$StyleURL: 'CallControls.css',
	$Meta: {
		Group: 'social',
		Icon: 'call-end',
		Description: 'The bar of a call: the microphone, the camera, the screen, the hand, reactions, the chat, the people, the layout and leaving.',
		Events: {
			mute: 'The microphone button: {Muted}, the state it asks for.',
			camera: 'The camera button: {Camera}, the state it asks for.',
			share: 'The screen button: {Sharing}, the state it asks for.',
			hand: 'The hand button: {Hand}, the state it asks for.',
			react: 'A reaction was chosen: {Emoji}.',
			chat: 'The chat button: {Open}, the state it asks for.',
			people: 'The people button: {Open}, the state it asks for.',
			layout: 'Another layout was chosen: {Layout}.',
			device: 'Another device was chosen: {Kind (microphone, speaker or camera), ID}.',
			leave: 'The leave button was pressed.'
		},
		Props: {
			Muted: 'The microphone is off.',
			Camera: 'The camera is on (true by default).',
			Sharing: 'The screen is shared.',
			Hand: 'The hand is raised.',
			Chat: 'The chat is open.',
			People: 'The list of the people is open.',
			Layout: {Options: ['grid', 'speaker', 'screen'], Description: 'The layout of the stage.'},
			Devices: 'The devices: {Microphones, Speakers, Cameras: [{ID, Label}], Microphone, Speaker, Camera}.',
			Reactions: 'The emoji of the reactions.',
			Hide: 'The buttons left out: mute, camera, share, hand, react, chat, people, layout, leave.'
		},
		Sample: {Muted: true}
	},
	Muted: false,
	Camera: true,
	Sharing: false,
	Hand: false,
	Chat: false,
	People: false,
	Layout: 'grid',
	Devices: null,
	Reactions: ['👍', '👏', '😂', '❤️', '🎉', '😮'],
	Hide: [],

	$OnCreate: function () {
		var self = this;

		/* Whether a button is there (a template calls it). */
		this.Shows = function (hide, name) {
			return (hide || []).indexOf(name) === -1;
		};

		/* The camera off: false, or 'false' from an attribute. */
		this.Off = function (camera) {
			return camera === false || camera === 'false';
		};

		/* The items of a kind of devices, the chosen one checked. */
		this.DeviceItems = function (devices, list, chosen, kind) {
			var items = devices && devices[list] ? devices[list] : [];

			return items.map(function (device) {
				return {ID: kind + ':' + device.ID, Label: device.Label || device.ID, Checked: devices[chosen] === device.ID};
			});
		};

		/* The microphones, and the speakers after a line. */
		this.SoundItems = function (devices) {
			var microphones = self.DeviceItems(devices, 'Microphones', 'Microphone', 'microphone');
			var speakers = self.DeviceItems(devices, 'Speakers', 'Speaker', 'speaker');

			return speakers.length && microphones.length ? microphones.concat([{Separator: true}], speakers) : microphones.concat(speakers);
		};

		this.ReactionItems = function (reactions) {
			return (reactions || []).map(function (emoji) {
				return {ID: 'react:' + emoji, Label: emoji};
			});
		};

		this.LayoutItems = function (layout) {
			return ['grid', 'speaker', 'screen'].map(function (name) {
				return {ID: 'layout:' + name, Label: Elemenx.Locale.Text('ui.call.layouts.' + name), Checked: layout === name};
			});
		};
	},

	Muting: function () {
		this.$Emit('mute', {Muted: !this.Muted});
	},

	Filming: function () {
		this.$Emit('camera', {Camera: this.Off(this.Camera)});
	},

	Shared: function () {
		this.$Emit('share', {Sharing: !this.Sharing});
	},

	Raised: function () {
		this.$Emit('hand', {Hand: !this.Hand});
	},

	Chatted: function () {
		this.$Emit('chat', {Open: !this.Chat});
	},

	Listed: function () {
		this.$Emit('people', {Open: !this.People});
	},

	Left: function () {
		this.$Emit('leave', {});
	},

	/* A choice of one of its menus: a device, a reaction or a layout, by the kind its ID starts with. */
	Picked: function (item) {
		var id = String(item && item.ID || '');
		var at = id.indexOf(':');
		var kind = id.substring(0, at);
		var value = id.substring(at + 1);

		if (kind === 'react') this.$Emit('react', {Emoji: value});
		else if (kind === 'layout') this.$Emit('layout', {Layout: value});
		else if (kind) this.$Emit('device', {Kind: kind, ID: value});
	}
});
