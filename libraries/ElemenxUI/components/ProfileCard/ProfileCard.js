/*
 * The card of a person: a Cover (an image, or Color), the Avatar (or initials) with its Status (online, away, busy or
 * offline), Name (Verified), Role, Bio, Stats ([{Label, Value}]; numbers are shortened: 12.4K) and the buttons Follow
 * (Following) and Message. Layout: card, or compact (one row for lists: avatar, name, role and Follow). Variant and Href
 * as in Card. The default slot adds content under the bio.
 * Events: follow ({Following}), message.
 */
Elemenx.Component('ProfileCard', {
	$TemplateURL: 'ProfileCard.html',
	$StyleURL: 'ProfileCard.css',
	$Meta: {
		Group: 'social',
		Icon: 'user',
		Description: 'The card of a person: a Cover (an image, or Color), the Avatar (or initials) with its Status (online, away, busy or offline), Name (Verified), Role, Bio, Stats ([{Label, Value}]; numbers are shortened: 12.4K) and the buttons Follow (Following) and Message.',
		Container: true,
		Events: ['follow', 'message'],
		Props: {
			Name: 'The name of the person.',
			Role: 'The role under the name.',
			Bio: 'A few words about the person.',
			Avatar: 'The URL of the picture (initials without one).',
			Cover: 'The URL of the cover picture.',
			Color: 'The color of the cover without a picture.',
			Status: 'online, away, busy or offline.',
			Verified: 'Marks the person as verified.',
			Stats: 'The counts: [{Label, Value}] (12.4K).',
			Follow: 'Shows the Follow button.',
			Following: 'The reader follows the person.',
			Message: 'Shows the Message button.',
			Layout: {Options: ['card', 'compact'], Description: 'card, or compact (one row for lists).'},
			Variant: 'Its look, as in Card.',
			Href: 'Makes the card a link.',
			FollowLabel: 'The text of the Follow button.',
			FollowingLabel: 'The text of the button while following.',
			MessageLabel: 'The text of the Message button.',
			VerifiedLabel: 'The name of the verified mark.'
		},
		Sample: {Name: 'Ada Lovelace', Role: 'Analyst', Bio: 'Writes the notes on the engine.', Status: 'online', Verified: true, Stats: [{Label: 'Posts', Value: 312}, {Label: 'Followers', Value: 12400}, {Label: 'Following', Value: 87}]}
	},
	Name: '',
	Role: '',
	Bio: '',
	Avatar: '',
	Cover: '',
	Color: '',
	Status: '',
	Verified: false,
	Stats: [],
	Follow: true,
	Following: false,
	Message: true,
	Layout: 'card',
	Variant: 'outlined',
	Href: '',
	FollowLabel: '',
	FollowingLabel: '',
	MessageLabel: '',
	VerifiedLabel: '',
	StatusLabels: {online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline'},

	$OnCreate: function () {
		var format = this.$Service('Format');

		this.Format = function () {
			return format;
		};

		/* A number of a stat is shortened (12.4K); text stays as it is. */
		this.Stat = function (value) {
			return typeof value === 'number' ? format.Count(value) : value;
		};

		this.Initials = function (name) {
			return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) {
				return part.charAt(0).toUpperCase();
			}).join('');
		};
	},

	Toggle: function () {
		this.Following = !this.Following;

		this.$Emit('follow', {Following: this.Following});
	},

	Write: function () {
		this.$Emit('message', {Name: this.Name});
	}
});
