/*
 * An invitation to a call, as a messenger shows it: the picture and the name of who calls, what kind of call, and the
 * buttons to accept it (with the camera too when Video) or to decline it. In a card of Native.Notify (Component
 * CallInvite, Look elemenx, Bare, Priority high, Timeout 0, a Sound with Loop) its Notification takes the choice:
 * the notification event with the Action accept, accept-video or decline. Alone in a page its events are accept
 * ({Video}) and decline. Name, Image (the URL of the picture; none: the avatar of the name), Text (the kind of the call,
 * Incoming call by default), Video.
 */
Elemenx.Component('CallInvite', {
	$TemplateURL: 'CallInvite.html',
	$StyleURL: 'CallInvite.css',
	$Meta: {
		Group: 'social',
		Icon: 'phone',
		Description: 'An invitation to a call: who calls, and the buttons to accept or decline it.',
		Events: ['accept', 'decline'],
		Props: {
			Name: 'Who calls.',
			Image: 'The URL of a picture of who calls; none: the avatar of the name.',
			Text: 'The kind of the call; Incoming call by default.',
			Video: 'A video call: a button accepts it with the camera.',
			Notification: 'The notification it is in (Native.Notify): it takes the choice.'
		},
		Sample: {Name: 'Ada Lovelace', Video: true}
	},
	Name: '',
	Image: '',
	Text: '',
	Video: false,
	Notification: null,

	Choose: function (action) {
		this.$Emit(action === 'decline' ? 'decline' : 'accept', {Video: action === 'accept-video'});

		if (this.Notification && typeof this.Notification.Choose === 'function')
			this.Notification.Choose(action);
	},

	Accepted: function () {
		this.Choose('accept');
	},

	AcceptedVideo: function () {
		this.Choose('accept-video');
	},

	Declined: function () {
		this.Choose('decline');
	}
});
