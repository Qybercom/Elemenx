/*
 * A live telemetry board: a race car, a server cluster or a spaceship, their channels up to 120 times a second over a
 * WebSocket, drawn at most once a frame. The FPS, the packets and the updates of each second show on the board.
 */
Elemenx.Application('Telemetry', {
	$Title: 'Elemenx Telemetry',
	$Component: 'TelemetryBoard',
	$Root: 'Telemetry',
	$Mount: 'body',
	$Use: ['ElemenxUI']
});
