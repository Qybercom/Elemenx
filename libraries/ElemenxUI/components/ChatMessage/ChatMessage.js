/*
 * One message of a Chat. Text, or the default slot for rich content. Own puts the message on the reader's side.
 * Avatar is an image URL; without it the initials of Author are shown. Position places the message in a run of
 * messages from one author: single, first, middle or last. The author name shows on the first message of a run and
 * the avatar on the last (the newest) one. Status: sending, sent, read or error.
 */
Elemenx.Component('ChatMessage', {
	$TemplateURL: 'ChatMessage.html',
	$StyleURL: 'ChatMessage.css',
	Author: '',
	Avatar: '',
	Text: '',
	Time: '',
	Own: false,
	Position: 'single',
	Status: '',

	$OnCreate: function () {
		this.Initials = function (name) {
			return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) {
				return part.charAt(0).toUpperCase();
			}).join('');
		};

		this.StatusIcon = function (status) {
			return {sending: 'clock', sent: 'check', read: 'check', error: 'error'}[status] || '';
		};
	}
});