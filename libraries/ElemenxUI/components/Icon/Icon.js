Elemenx.Component('Icon', {
	$TemplateURL: 'Icon.html',
	Name: '',
	Label: '',

	Glyph: function () {
		var glyphs = {
			add: '+',
			remove: '−',
			check: '✓',
			close: '×',
			left: '←',
			right: '→',
			up: '↑',
			down: '↓'
		};
		return glyphs[this.Name] || this.Label || this.Name;
	}
});