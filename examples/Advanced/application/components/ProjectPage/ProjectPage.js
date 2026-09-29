Elemenx.Component('ProjectPage', {
	TemplateURL: 'ProjectPage.html',
	Title: 'Project - Elemenx',
	
	ElemenxOnReady: function () {
		this.Title('Project "' + this.Params.id + '" - Elemenx');
	}
});