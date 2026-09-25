Elemenx.Component('ProjectPage', {
	TemplateURL: 'ProjectPage.html',
	Title: 'Project - Elemenx',
	
	ElemenxOnComponentReady: function () {
		this.Title('Project "' + this.Params.id + '" - Elemenx');
	}
});