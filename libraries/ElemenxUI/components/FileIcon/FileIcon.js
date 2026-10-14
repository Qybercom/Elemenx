/*
 * The icon of a file name: <FileIcon Name="report.pdf" />, from the files set (Icons.File). Unknown formats get the
 * plain file icon.
 */
Elemenx.Component('FileIcon', {
	$TemplateURL: 'FileIcon.html',
	Name: '',
	Size: 16,
	Label: '',

	$OnCreate: function () {
		var icons = this.$Service('Icons');

		this.IconOf = function (name) {
			return icons.File(name);
		};
	}
});
