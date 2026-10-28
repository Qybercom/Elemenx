/* A Component in a folder of the graph of the Library: a phrase of its dictionary and its Service. */
Elemenx.Component('DiscoveredCard', {
	$Template: '<p class="discovered-card">{{$T(\'discoveryKit.title\')}} {{Number}}</p>',
	Number: 0,

	$OnCreate: function () {
		this.Number = this.$Service('DiscoveredCounter').Next();
	}
});
