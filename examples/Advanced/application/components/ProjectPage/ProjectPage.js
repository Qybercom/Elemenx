Elemenx.Component('ProjectPage', {
	$TemplateURL: 'ProjectPage.html',
	$Title: 'Project - Elemenx',
	
	$OnReady: function () {
		this.$Title('Project "' + this.$Params.id + '" - Elemenx');
	}
});