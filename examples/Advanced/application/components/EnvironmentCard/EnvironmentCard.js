Elemenx.Component('EnvironmentCard', {
	TemplateURL: 'EnvironmentCard.html',

	ElemenxOnCreate: function () {
		this.State.HasServices = this.State.Services && this.State.Services.length > 0;
	}
});