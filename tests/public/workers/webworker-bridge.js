var socket = Elemenx.Messaging();

socket.On(ElemenxWorkerChannel, function (event) {
	var data = event.Data || {};

	if (data.Command === 'ping') {
		socket.Send(event.Source, {
			Type: 'pong',
			Value: data.Value,
			WorkerName: ElemenxWorkerName,
			Channel: ElemenxWorkerChannel
		});

		return;
	}

	if (data.Command === 'buffer') {
		var buffer = data.Buffer;

		socket.Send(event.Source, {
			Type: 'buffer',
			Length: buffer ? buffer.byteLength : -1
		});

		return;
	}

	if (data.Command === 'close-socket') {
		socket.Destroy();
	}
});

self.addEventListener('message', function (event) {
	var packet = event.data;
	if (!packet || packet.ElemenxRawTest !== true) return;

	postMessage({
		ElemenxRawTest: true,
		Value: packet.Value
	});
});