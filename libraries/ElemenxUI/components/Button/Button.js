Elemenx.Component('Button', {
	$TemplateURL: 'Button.html',
	Label: '',
	Variant: 'secondary',
	Size: 'medium',
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