/*
 * A video call for a few people: a room to join by its name, the videos on a CallStage, the microphone and the camera
 * on its controls. The browsers find each other through the WebSocket of the server and then talk directly (WebRTC).
 * The project of the tutorial on video calls.
 */
Elemenx.Application('Call', {
	$Title: 'Call',
	$Component: 'CallApp',
	$Root: 'Call',
	$Mount: 'body',
	$Use: ['ElemenxUI']
});
