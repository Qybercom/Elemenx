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