/*
 * Notes that work offline: kept in the browser first (IndexedDB), the changes queued in an outbox, synced with the
 * server when the network is there. The project of the tutorial on offline sync.
 */
Elemenx.Application('Notes', {
	$Title: 'Notes',
	$Component: 'NotesApp',
	$Root: 'Notes',
	$Mount: 'body',
	$Use: ['ElemenxUI']
});
