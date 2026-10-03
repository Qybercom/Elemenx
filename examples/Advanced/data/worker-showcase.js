var socket=Elemenx.Messaging();

socket.On(ElemenxWorkerChannel,function (event) {
	var data=event.Data || {};
	if (data.Command!=='ping') return;
	socket.Send(event.Source,{
		Type:'pong',
		Value:data.Value,
		WorkerName:ElemenxWorkerName,
		Channel:ElemenxWorkerChannel
	});
});