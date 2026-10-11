/* The icon of a file name: <FileIcon Name="report.pdf" />. Unknown formats get the plain file icon. */
Elemenx.Component('FileIcon', {
	$TemplateURL: 'FileIcon.html',
	Name: '',
	Size: 16,
	Label: '',
	Formats: [
		'php', 'js', 'jsx', 'cpp', 'hpp', 'c', 'h', 'css', 'py', 'java', 'kt', 'cbl', 'rs', 'ts', 'tsx', 'go',
		'exe', 'lib', 'a', 'o', 'dll', 'jpg', 'png', 'svg', 'webp', 'ico', 'pdf', 'psd', 'ai', 'tiff', 'gif',
		'json', 'jsonl', 'csv', 'xml', 'html', 'yaml', 'ini', 'properties', 'htaccess', 'conf', 'lnk',
		'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'dockerfile', 'zip', 'rar', 'ar', 'tar', 'tar-gz', 'jar',
		'3mf', 'mp3', 'mp4', 'webm', 'avi', 'aac', 'ac3'
	],
	Aliases: {
		jpeg: 'jpg', tif: 'tiff', yml: 'yaml', htm: 'html', tgz: 'tar-gz', mjs: 'js', cjs: 'js', cc: 'cpp', cxx: 'cpp',
		hh: 'hpp', hxx: 'hpp', markdown: 'md', cob: 'cbl', cobol: 'cbl', kts: 'kt', cfg: 'conf'
	},

	$OnCreate: function () {
		var self = this;

		this.IconOf = function (name) {
			var file = String(name || '').toLowerCase().split(/[\\/]/).pop();
			var extension;

			if (file === 'dockerfile' || file.indexOf('dockerfile.') === 0) return 'file-dockerfile';
			if (file === '.htaccess') return 'file-htaccess';
			if (/\.tar\.gz$/.test(file)) return 'file-tar-gz';

			extension = file.indexOf('.') === -1 ? '' : file.substring(file.lastIndexOf('.') + 1);
			extension = self.Aliases[extension] || extension;

			return self.Formats.indexOf(extension) === -1 ? 'file' : 'file-' + extension;
		};
	}
});