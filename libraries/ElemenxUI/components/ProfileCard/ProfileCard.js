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
