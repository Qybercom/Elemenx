Elemenx.Component('RouterLabPage', {
	TemplateURL: 'RouterLabPage.html',
	Title: 'Router lab - Elemenx',
	ReadyCount: 0,

	ElemenxOnReady: function () {
		this.ReadyCount++;
	},

	GoNext: function () {
		var id = Number(this.Params.id || 0) + 1;
		this.Router().Go('/router/' + id + '?mode=push#step-' + id);
	},

	ReplaceCurrent: function () {
		var id = Number(this.Params.id || 0) + 10;
		this.Router().Replace('/router/' + id + '?mode=replace#step-' + id);
	},

	Back: function () {
		this.Router().Back();
	},

	Forward: function () {
		this.Router().Forward();
	},

	Home: function () {
		this.Router().Go('/');
	}
});