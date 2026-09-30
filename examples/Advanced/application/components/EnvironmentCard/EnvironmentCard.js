Elemenx.Component('EnvironmentCard', {
	$TemplateURL: 'EnvironmentCard.html',

	$OnCreate: function () {
		this.HasServices = this.services && this.services.length > 0;
	}
});