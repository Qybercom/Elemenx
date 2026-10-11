Elemenx.Component('Icon', {
	$TemplateURL: 'Icon.html',
	$StyleURL: 'Icon.css',
	Name: '',
	Size: 16,
	Label: '',
	Sprite: '',
	Spin: false,

	$OnCreate: function () {
		var library;

		if (this.Sprite) return;

		library = Elemenx.Library('ElemenxUI');

		this.Sprite = String(library && library.$Root || '').replace(/\/$/, '') + '/icons.svg';
	}
});