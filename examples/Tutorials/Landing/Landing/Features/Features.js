/* What the product does: a card for each feature, from a list. */
Elemenx.Component('Features', {
	$TemplateURL: 'Features.html',
	Items: [
		{Icon: 'link', Title: 'Linked notes', Text: 'Write [[a name]] and the note is linked, both ways.'},
		{Icon: 'search', Title: 'Search that remembers', Text: 'Find a note by a word you only half remember.'},
		{Icon: 'cloud', Title: 'Works offline', Text: 'Every note is on your device first, synced when you are online.'},
		{Icon: 'lock', Title: 'Private', Text: 'Your notes are encrypted before they leave the device.'}
	]
});
