Elemenx.Component('EnvironmentCard', {
	TemplateURL: 'EnvironmentCard.html',

	ElemenxOnCreate: function () {
		this.State.HasServices = this.State.services && this.State.services.length > 0;
	}
});