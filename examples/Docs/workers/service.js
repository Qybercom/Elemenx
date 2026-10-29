/*
 * The service worker of the examples of the Docs: Elemenx.ServiceWorker starts it with Elemenx loaded and its name
 * and channel set (ElemenxWorkerName, ElemenxWorkerChannel). It answers every message on its channel.
 */
var socket = Elemenx.Messaging();

socket.On(ElemenxWorkerChannel, function (message) {
	socket.Send(message.Source, {Type: 'pong', Worker: ElemenxWorkerName, Time: new Date().toISOString()});
});

self.addEventListener('install', function () {
	self.skipWaiting();
});
