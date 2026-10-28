/*
 * The tracks of an album or of a playlist: Items [{ID, Number, Title, Artist, Album, Duration (seconds), Explicit,
 * Disabled}], each a row with its number (or, for the Current one, its bars while Playing), its title and artist, its
 * album (Columns album) and its length; the total of them under the list. A press or Enter plays a track (the play
 * event), the arrow keys go from row to row; a press on the current one while it plays pauses it (the pause event).
 * Columns lists the optional columns: album, artist (on their own line without). Events: play (the track), pause (the
 * track).
 */
Elemenx.Component('TrackList', {
	$TemplateURL: 'TrackList.html',
	$StyleURL: 'TrackList.css',
	$Meta: {
		Group: 'media',
		Icon: 'list-ordered',
		Description: 'The tracks of an album or of a playlist: their numbers, titles, artists and lengths, the one playing marked; a press plays one.',
		Events: {
			play: 'A track was chosen: the track.',
			pause: 'The track playing was pressed: the track.'
		},
		Props: {
			Items: 'The tracks: [{ID, Number, Title, Artist, Album, Duration, Explicit, Disabled}].',
			Current: 'The ID of the track playing (or paused).',
			Playing: 'The current track is playing.',
			Columns: 'The optional columns: album, artist.',
			Total: 'Shows the count and the total length under the list.',
			Label: 'The name of the list for screen readers.'
		},
		Sample: {Items: [{ID: 1, Title: 'Morning Tide', Artist: 'Elemenx Quartet', Duration: 214}, {ID: 2, Title: 'Lantern', Artist: 'Elemenx Quartet', Duration: 187, Explicit: true}], Current: 1, Playing: true}
	},
	Items: [],
	Current: null,
	Playing: false,
	Columns: [],
	Total: true,
	Label: '',

	/* A length in seconds as 3:05, or 1:02:09 past an hour. */
	Time: function (seconds) {
		var total = Math.max(0, Math.round(Number(seconds) || 0));
		var hours = Math.floor(total / 3600);
		var minutes = Math.floor(total % 3600 / 60);
		var rest = total % 60;

		return (hours ? hours + ':' + (minutes < 10 ? '0' : '') : '') + minutes + ':' + (rest < 10 ? '0' : '') + rest;
	},

	Length: function () {
		return (this.Items || []).reduce(function (sum, track) {
			return sum + (Number(track.Duration) || 0);
		}, 0);
	},

	Shows: function (column) {
		return (typeof this.Columns === 'string' ? this.Columns.split(/[\s,]+/) : this.Columns || []).indexOf(column) !== -1;
	},

	IsCurrent: function (track) {
		return this.Current !== null && this.Current !== undefined && String(track.ID) === String(this.Current);
	},

	TrackOf: function (event) {
		var row = event.target.closest('[data-track]');
		var id = row ? row.getAttribute('data-track') : null;

		return (this.Items || []).filter(function (track) {
			return String(track.ID) === id;
		})[0] || null;
	},

	Choose: function (track) {
		if (!track || track.Disabled) return;

		if (this.IsCurrent(track) && this.Playing) {
			this.$Emit('pause', track);

			return;
		}

		this.$Emit('play', track);
	},

	Pressed: function (event) {
		this.Choose(this.TrackOf(event));
	},

	Key: function (event) {
		var rows = Array.prototype.slice.call(this.$Element().querySelectorAll('.elemenx-track'));
		var index = rows.indexOf(event.target);
		var next = null;

		if (index === -1) return;

		if (event.key === 'Enter' || event.key === ' ') this.Choose(this.TrackOf(event));
		else if (event.key === 'ArrowDown') next = rows[index + 1];
		else if (event.key === 'ArrowUp') next = rows[index - 1];
		else if (event.key === 'Home') next = rows[0];
		else if (event.key === 'End') next = rows[rows.length - 1];
		else return;

		event.preventDefault();

		if (next)
			next.focus();
	}
});
