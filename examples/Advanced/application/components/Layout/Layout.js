Elemenx.Component('Layout', {
	TemplateURL: 'Layout.html',
	StyleURL: 'Layout.css',

	ElemenxOnCreate: function () {
		var component = this;
		var storage = this.Storage.Local.Namespace('AdvancedExample');
		var theme = storage.Get('Theme') || 'light';

		this.Batch(function (state) {
			state.Theme = theme === 'dark' ? 'Dark' : 'Light';
		});
		
		document.body.setAttribute('data-theme', theme);

		this.Ref('Theme').addEventListener('click', function () {
			theme = theme === 'dark' ? 'light' : 'dark';
			
			document.body.setAttribute('data-theme', theme);
			
			storage.Set('Theme', theme);
			
			component.Batch(function (state) {
				state.Theme = theme === 'dark' ? 'Dark' : 'Light';
			});
		});
	}
});