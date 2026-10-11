Elemenx.Component('Button', {
	$TemplateURL: 'Button.html',
	$StyleURL: 'Button.css',
	Label: '',
	Variant: 'secondary',
	Size: 'medium',
	Shape: 'default',
	Icon: '',
	IconRight: '',
	Type: 'button',
	Title: '',
	Disabled: false,
	Loading: false,
	Block: false,
	Pressed: null,

	Clicked: function (event) {
		this.$Emit('click', event);
	}
});