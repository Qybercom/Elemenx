/*
 * A field of several lines of text. Value, Placeholder, Rows (the height in lines), MaxLength. Resize: vertical (the
 * bottom edge, the default), both (the corner) or none; AutoSize grows the field with its text instead. Shape, Name,
 * Disabled, ReadOnly and Invalid as in Input. Events: input (Value, while typing), change (Value, when it is committed).
 */
Elemenx.Component('TextArea', {
	$TemplateURL: 'TextArea.html',
	$StyleURL: 'TextArea.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'text-align-justify',
		Description: 'A field of several lines of text.',
		Events: {
			input: 'The text changed while typing: Value.',
			change: 'The value was committed when the focus left: Value.'
		},
		Props: {
			Label: 'The name of the field for screen readers, when no Field names it.',
			Value: 'The text.',
			Placeholder: 'The text shown while it is empty.',
			Rows: 'The height in lines.',
			MaxLength: 'The longest text.',
			AutoSize: 'Grows with its text.',
			Resize: {Options: ['vertical', 'both', 'none'], Description: 'vertical (the bottom edge), both (the corner) or none.'},
			Shape: 'Its shape: default, or round.',
			Name: 'The name of its value in a form.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			ReadOnly: 'Shows the value without letting it change.',
			Invalid: 'Marks its value as wrong.'
		},
		Sample: {Placeholder: 'Write something', MaxLength: 200}
	},
	Value: '',
	Label: '',
	Placeholder: '',
	Rows: 3,
	MaxLength: null,
	AutoSize: false,
	Resize: 'vertical',
	Shape: 'default',
	Name: null,
	Disabled: false,
	ReadOnly: false,
	Invalid: false,

	$OnReady: function () {
		this.Fit(null, this.$Element().querySelector('textarea'));
	},

	Fit: function (event, node) {
		if (!this.AutoSize || !node) return;

		node.style.height = 'auto';
		node.style.height = node.scrollHeight + 'px';
	},

	Typed: function (event, node) {
		this.Value = node.value;

		this.Fit(event, node);

		this.$Emit('input', this.Value);
	},

	Committed: function () {
		this.$Emit('change', this.Value);
	}
});