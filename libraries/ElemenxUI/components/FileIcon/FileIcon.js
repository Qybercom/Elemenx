/* The icon of a file name: <FileIcon Name="report.pdf" />. Unknown formats get the plain file icon. */
Elemenx.Component('FileIcon', {
	$TemplateURL: 'FileIcon.html',
	Name: '',
	Size: 16,
	Label: '',
	Formats: [
		'js', 'jsx', 'ts', 'tsx', 'php', 'cpp', 'hpp', 'c', 'h', 'css', 'html', 'py', 'java', 'kt', 'cbl',
		'rs', 'go', 'exe', 'lib', 'a', 'o', 'dll', 'jpg', 'png', 'svg', 'webp', 'ico', 'gif', 'tiff', 'psd', 'ai', 'pdf',
		'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'json', 'jsonl', 'csv', 'xml', 'yaml', 'ini',
		'properties', 'htaccess', 'conf', 'lnk', 'dockerfile', 'zip', 'rar', 'ar', 'tar', 'tar-gz', 'jar', '3mf', 'mp3',
		'aac', 'ac3', 'mp4', 'webm', 'avi', 'rb', 'swift', 'scala', 'dart', 'lua', 'pl', 'r', 'sql', 'sh', 'bat', 'ps1',
		'cs', 'vb', 'fs', 'm', 'vue', 'svelte', 'scss', 'sass', 'less', 'erl', 'ex', 'hs', 'clj', 'zig', 'asm', 'wasm',
		'toml', 'env', 'lock', 'log', 'gradle', 'makefile', 'cmake', 'proto', 'graphql', 'editorconfig', 'gitignore', '7z',
		'bz2', 'xz', 'gz', 'apk', 'ipa', 'dmg', 'iso', 'deb', 'rpm', 'msi', 'bin', 'img', 'so', 'dylib', 'class', 'odt',
		'ods', 'odp', 'rtf', 'epub', 'pages', 'numbers', 'key', 'tex', 'ics', 'vcf', 'eml', 'jpeg', 'heic', 'avif', 'bmp',
		'raw', 'eps', 'fig', 'sketch', 'xd', 'blend', 'fbx', 'obj', 'stl', 'glb', 'gltf', 'ttf', 'otf', 'woff', 'woff2',
		'flac', 'wav', 'ogg', 'm4a', 'opus', 'mid', 'mkv', 'mov', 'wmv', 'flv', 'srt', 'vtt', 'tsv', 'parquet', 'db',
		'sqlite', 'ipynb', 'xlsm', 'xsd', 'pem', 'crt', 'p12', 'pub', 'ino'
	],
	Aliases: {
		tif: 'tiff', jpe: 'jpeg', midi: 'mid', pfx: 'p12', cer: 'crt', mjs: 'js', cjs: 'js', mts: 'ts', cts: 'ts',
		bash: 'sh', zsh: 'sh', cmd: 'bat', psm1: 'ps1', mm: 'm', exs: 'ex', hrl: 'erl', cljs: 'clj', s: 'asm',
		tgz: 'tar-gz', db3: 'sqlite', yml: 'yaml', htm: 'html', cc: 'cpp', cxx: 'cpp', hh: 'hpp', hxx: 'hpp',
		markdown: 'md', cob: 'cbl', cobol: 'cbl', kts: 'kt', cfg: 'conf', pde: 'ino'
	},

	$OnCreate: function () {
		var self = this;

		this.IconOf = function (name) {
			var file = String(name || '').toLowerCase().split(/[\\/]/).pop();
			var extension;

			if (file === 'dockerfile' || file.indexOf('dockerfile.') === 0) return 'file-dockerfile';
			if (file === 'makefile' || file === 'gnumakefile') return 'file-makefile';
			if (file === 'cmakelists.txt') return 'file-cmake';
			if (file === '.env' || file.indexOf('.env.') === 0) return 'file-env';
			if (file === '.htaccess' || file === '.gitignore' || file === '.editorconfig') return 'file-' + file.substring(1);
			if (/\.tar\.gz$/.test(file)) return 'file-tar-gz';
			if (/\.lock$/.test(file) || file === 'package-lock.json') return 'file-lock';

			extension = file.indexOf('.') === -1 ? '' : file.substring(file.lastIndexOf('.') + 1);
			extension = self.Aliases[extension] || extension;

			return self.Formats.indexOf(extension) === -1 ? 'file' : 'file-' + extension;
		};
	}
});