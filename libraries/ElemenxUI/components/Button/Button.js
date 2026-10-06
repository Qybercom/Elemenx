Elemenx.Component('Button', {
	$TemplateURL: 'Button.html',
	Label: 'Button',
	Variant: '',
	Icon: '',
	IconRight: '',
	Disabled: false,

	Classes: function () {
		return 'elemenx-button' + (this.Variant ? ' ' + this.Variant : '');
	}
});