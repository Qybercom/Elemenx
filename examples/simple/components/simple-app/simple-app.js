Elemenx.Component('SimpleApp', {
	TemplateURL: 'simple-app.html',

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