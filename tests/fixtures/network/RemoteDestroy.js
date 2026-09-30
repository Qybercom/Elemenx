window.RemoteDestroyLoads = (window.RemoteDestroyLoads || 0) + 1;

Elemenx.Component('RemoteDestroy', {
	$Template: '<span class="remote-destroy">DESTROY:{{value}}</span>',
	$OnCreate: function () {
		window.RemoteDestroyHits = (window.RemoteDestroyHits || 0) + 1;
	}
});