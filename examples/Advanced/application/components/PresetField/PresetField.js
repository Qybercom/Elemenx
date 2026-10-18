/* A Field with an Input of a format (Preset): the message of a wrong value shows under it. */
Elemenx.Component('PresetField', {
	$TemplateURL: 'PresetField.html',
	Label: '',
	Preset: '',
	Country: '',
	Min: null,
	Max: null,
	Placeholder: '',
	Error: '',
	Value: '',

	Checked: function (result) {
		this.Error = result.Message;
	},

	Changed: function (value) {
		this.Value = value;
	}
});
