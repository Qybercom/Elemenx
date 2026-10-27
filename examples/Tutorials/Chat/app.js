/*
 * A chat: rooms, their messages, a name to write under. The messages go to the other tabs of the browser at once
 * (Elemenx.Messaging over a BroadcastChannel) and stay in its storage; a real chat sends them through its server,
 * with a WebSocket, and nothing else changes.
 */
Elemenx.Application('Talk', {
	$Title: 'Talk',
	$Component: 'App',
	$Root: 'Chat',
	$Mount: 'body',
	$Use: ['ElemenxUI']
});
