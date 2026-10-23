/*
 * A presence: of a person (online, away, busy, dnd: do not disturb, offline) or of a connection (online, connecting:
 * a ring that turns while it waits, offline). Status names it; a status of its own is a dot of the muted color. A dot,
 * or with ShowLabel the dot and its name (Label, or the phrase of the status). Size small, medium or large. The dot
 * alone is an image named by its status for screen readers.
 */
Elemenx.Component('Presence', {
	$TemplateURL: 'Presence.html',
	$StyleURL: 'Presence.css',
	$Meta: {
		Group: 'display',
		Icon: 'user',
		Description: 'A presence: of a person (online, away, busy, dnd: do not disturb, offline) or of a connection (online, connecting: a ring that turns while it waits, offline).',
		Props: {
			Status: {Options: ['online', 'away', 'busy', 'dnd', 'offline', 'connecting'], Description: 'online, away, busy, dnd, offline or connecting.'},
			Label: 'The name shown (the phrase of the status by default).',
			ShowLabel: 'Shows the name beside the dot.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'}
		},
		Sample: {ShowLabel: true}
	},
	Status: 'online',
	Label: '',
	ShowLabel: false,
	Size: 'medium',

	$OnCreate: function () {
		/* A status with a phrase of its own. */
		this.Known = function (status) {
			return ['online', 'away', 'busy', 'dnd', 'offline', 'connecting'].indexOf(status) !== -1;
		};
	}
});
