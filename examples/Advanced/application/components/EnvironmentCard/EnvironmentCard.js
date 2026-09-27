Elemenx.Component('EnvironmentCard', {
	TemplateURL: 'EnvironmentCard.html',

	ElemenxOnCreate: function () {
		this.HasServices = this.services && this.services.length > 0;
	}
});