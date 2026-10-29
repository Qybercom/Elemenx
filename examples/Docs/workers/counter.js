/*
 * The worker of the examples of the Docs: it runs with Elemenx loaded (Elemenx.WebWorker does it) and answers on
 * its channel (ElemenxWorkerChannel). {Command: 'count', To} counts to To, off the page, and answers with the sum;
 * {Command: 'ping'} answers pong.
 */
var socket = Elemenx.Messaging();

socket.On(ElemenxWorkerChannel, function (message) {
	var data = message.Data || {};
	var sum = 0;
	var i = 0;
	var started = Date.now();

	if (data.Command === 'ping') {
		socket.Send(message.Source, {Type: 'pong', Worker: ElemenxWorkerName});

		return;
	}

	if (data.Command !== 'count') return;

	while (i <= data.To) {
		sum += i;

		i++;
	}

	socket.Send(message.Source, {Type: 'sum', Sum: sum, Elapsed: Date.now() - started, Worker: ElemenxWorkerName});
});
