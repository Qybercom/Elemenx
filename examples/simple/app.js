Elemenx.Component('SimpleApp', {
	Template: '<main><h1>{{Title}}</h1><p>Counter: <b>{{Count}}</b></p><button data-ref="Increment">Increment</button></main>',

	ElemenxOnCreate: function () {
		var component = this;

		this.Batch(function (state) {
			state.Title = 'Hello from Elemenx';
			state.Count = 0;
		});

		this.Ref('Increment').addEventListener('click', function () {
			component.Batch(function (state) {
				state.Count++;
			});
		});
	}
});

Elemenx.Application('SimpleExample', {
	Component: 'SimpleApp',
	Mount: '#app'
});