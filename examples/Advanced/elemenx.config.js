module.exports={
	Application:'application',
	Entry:'app.js',
	Index:'index.html',
	Output:'dist',
	Server:{
		DevelopmentPort:4173,
		ProductionPort:4175,
		Compression:true,
		CompressionThreshold:1024,
		Request:function (request,response,pathname) {
			if (pathname === '/elemenx-network-stream') {
				response.writeHead(200,{
					'Content-Type':'application/x-ndjson; charset=utf-8',
					'Cache-Control':'no-cache, no-transform',
					'Connection':'keep-alive'
				});
				var sequence=0;
				var timer=setInterval(function () {
					sequence++;
					response.write(JSON.stringify({sequence:sequence,message:'Elemenx Stream packet #' + sequence}) + '\n');
					if (sequence >= 3) { clearInterval(timer); timer=null; response.end(); }
				},250);
				request.on('close',function () { if (timer) { clearInterval(timer); timer=null; } });
				return true;
			}
			if (pathname === '/elemenx-network-longpolling') {
				var closed=false;
				var timer=setTimeout(function () {
					if (closed) return;
					timer=null;
					response.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-cache'});
					response.end(JSON.stringify({message:'Elemenx LongPolling event',time:Date.now()}));
				},250);
				response.on('close',function () { closed=true; if (timer) { clearTimeout(timer); timer=null; } });
				return true;
			}
			if (pathname !== '/elemenx-network-sse') return false;
			response.writeHead(200,{
				'Content-Type':'text/event-stream; charset=utf-8',
				'Cache-Control':'no-cache, no-transform',
				'Connection':'keep-alive'
			});
			var sequence=0;
			var timer=setInterval(function () {
				sequence++;
				response.write('id: ' + sequence + '\n');
				response.write('data: ' + JSON.stringify({sequence:sequence,message:'Elemenx SSE event #' + sequence}) + '\n\n');
				if (sequence >= 3) { clearInterval(timer); timer=null; }
			},250);
			request.on('close',function () { if (timer) { clearInterval(timer); timer=null; } });
			return true;
		},
		WebSocket:{
			Path:'/elemenx-network-showcase',
			Message:function (connection,message) {
				var packet;
				try { packet=JSON.parse(message); } catch (error) { return; }
				if (!packet || packet.url !== '/api/media' || !packet.data) return;
				connection.Send(JSON.stringify({response:'/api/media',data:{status:200,correlationID:packet.data.correlationID}}));
				connection.Send(JSON.stringify({event:'/api/media',data:packet.data}));
			}
		}
	}
};