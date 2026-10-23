/*
 * The icon of a file by its name: <FileIcon Name="report.pdf" />, from the set files (Icons.File): about 170 formats
 * and their other extensions, double extensions (.tar.gz) and well-known names (Dockerfile, Makefile, .gitignore).
 * Unknown formats get the plain file icon. Size in pixels (16); Label names it for screen readers.
 */
Elemenx.Component('FileIcon', {
	$TemplateURL: 'FileIcon.html',
	$Meta: {
		Group: 'display',
		Icon: 'file',
		Description: 'The icon of a file by its name: <FileIcon Name="report.pdf" />, from the set files (Icons.File): about 170 formats and their other extensions, double extensions (.tar.gz) and well-known names (Dockerfile, Makefile, .gitignore).',
		Props: {
			Name: 'The name of the file (report.pdf): its format picks the icon.',
			Size: 'The size in pixels.',
			Label: 'The name of the icon for screen readers.'
		},
		Sample: {Size: 40}
	},
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
