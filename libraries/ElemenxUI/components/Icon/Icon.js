Elemenx.Component('Icon', {
	$TemplateURL: 'Icon.html',
	Name: '',
	Label: '',

	Href: function () {
		var library = Elemenx.Library('ElemenxUI');
		var root = library ? library.$Root || library.Root : '';

		return String(root || '').replace(/\/$/, '') + '/icons.svg#' + this.Name;
	}
});