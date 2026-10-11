/*
 * Picks files by dialog or drag and drop; it does not upload them. Variant: dropzone, inline, gallery or avatar.
 * Files: [{ID, Name, Size, Type, URL, File}], URL is an object URL preview for images.
 * Events: change (Array of File), reject ([{Name, Reason}]) for files refused by Accept, MaxSize or MaxFiles.
 */
Elemenx.Component('FileUpload', {
	$TemplateURL: 'FileUpload.html',
	$StyleURL: 'FileUpload.css',
	Variant: 'dropzone',
	Accept: '',
	Multiple: true,
	MaxSize: null,
	MaxFiles: null,
	Label: 'Drop files here or click to browse',
	Hint: '',
	Disabled: false,
	Invalid: false,
	Files: [],
	Errors: [],
	Dragging: false,
	Depth: 0,

	$OnCreate: function () {
		this.FormatSize = function (bytes) {
			if (bytes < 1024)
				return bytes + ' B';

			if (bytes < 1024 * 1024)
				return (bytes / 1024).toFixed(bytes < 10240 ? 1 : 0) + ' KB';

			return (bytes / 1024 / 1024).toFixed(1) + ' MB';
		};
	},

	$OnDestroy: function () {
		var i = 0;

		while (i < this.Files.length) {
			if (this.Files[i].URL)
				URL.revokeObjectURL(this.Files[i].URL);

			i++;
		}
	},

	Accepts: function (file) {
		var rules = String(this.Accept || '').split(',');
		var name = file.name.toLowerCase();
		var type = (file.type || '').toLowerCase();
		var rule;
		var i = 0;

		if (!this.Accept) return true;

		while (i < rules.length) {
			rule = rules[i].trim().toLowerCase();

			if (rule.charAt(0) === '.' && name.substring(name.length - rule.length) === rule) return true;
			if (rule.substring(rule.length - 2) === '/*' && type.indexOf(rule.substring(0, rule.length - 1)) === 0) return true;
			if (rule === type) return true;

			i++;
		}

		return false;
	},

	Add: function (list) {
		var single = this.Variant === 'avatar' || !this.Multiple;
		var files = single ? [] : this.Files.slice();
		var errors = [];
		var limit = single ? 1 : (this.MaxFiles ? Number(this.MaxFiles) : Infinity);
		var file;
		var i = 0;

		if (this.Disabled) return;

		while (i < list.length) {
			file = list[i];

			if (!this.Accepts(file)) {
				errors.push({Name: file.name, Reason: 'type'});
			}
			else if (this.MaxSize && file.size > Number(this.MaxSize)) {
				errors.push({Name: file.name, Reason: 'size'});
			}
			else if (files.length >= limit) {
				errors.push({Name: file.name, Reason: 'count'});
			}
			else {
				files.push({
					ID: Math.random().toString(36).substring(2, 10),
					Name: file.name,
					Size: file.size,
					Type: file.type,
					URL: /^image\//.test(file.type) ? URL.createObjectURL(file) : '',
					File: file
				});
			}

			i++;
		}

		if (single && files.length)
			this.Release(this.Files);

		if (!single || files.length)
			this.Files = files;

		this.Errors = errors.map(function (error) {
			return error.Name + (error.Reason === 'type' ? ': this file type is not accepted' : error.Reason === 'size' ? ': the file is too large' : ': too many files');
		});

		if (errors.length)
			this.$Emit('reject', errors);

		this.Changed();
	},

	Release: function (files) {
		var i = 0;

		while (i < files.length) {
			if (files[i].URL)
				URL.revokeObjectURL(files[i].URL);

			i++;
		}
	},

	Changed: function () {
		this.$Emit('change', this.Files.map(function (item) {
			return item.File;
		}));
	},

	Browse: function (event, node) {
		if (!this.Disabled)
			node.closest('.elemenx-upload').querySelector('input[type="file"]').click();
	},

	ZoneKey: function (event, node) {
		if (event.key !== 'Enter' && event.key !== ' ') return;

		event.preventDefault();

		this.Browse(event, node);
	},

	Chosen: function (event, node) {
		this.Add(node.files);

		node.value = '';
	},

	Remove: function (event, node) {
		var index = Number(node.getAttribute('data-index'));
		var files = this.Files.slice();

		event.stopPropagation();

		this.Release(files.splice(index, 1));

		this.Files = files;
		this.Errors = [];

		this.Changed();
	},

	DragEnter: function (event) {
		event.preventDefault();

		this.Depth++;
		this.Dragging = !this.Disabled;
	},

	DragOver: function (event) {
		event.preventDefault();

		if (event.dataTransfer)
			event.dataTransfer.dropEffect = this.Disabled ? 'none' : 'copy';
	},

	DragLeave: function () {
		this.Depth = Math.max(0, this.Depth - 1);

		if (!this.Depth)
			this.Dragging = false;
	},

	Dropped: function (event) {
		event.preventDefault();

		this.Depth = 0;
		this.Dragging = false;

		if (event.dataTransfer && event.dataTransfer.files)
			this.Add(event.dataTransfer.files);
	}
});