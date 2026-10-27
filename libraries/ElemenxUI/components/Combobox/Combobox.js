/*
 * A field that suggests: typing filters Options ([{Value, Label, Hint, Icon, Group, Disabled}]) in a list under it,
 * the labels that start with the text first; arrows and Enter pick, Escape closes and then restores the text.
 * Value is the Value of the picked option. AllowCustom also takes a text that is no option: a "Create" row offers it,
 * and Value becomes the text (create emits it). The search event carries every text typed, so the owner may load
 * Options from a server (Loading shows a spinner; Filter: false keeps the Options as they come). Clearable adds a
 * cross. A text left without a pick goes back to the label of Value (or is taken, with AllowCustom).
 * Events: change (Value), search (the text), create (the text).
 */
Elemenx.Component('Combobox', {
	$TemplateURL: 'Combobox.html',
	$StyleURL: 'Combobox.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'edit',
		Description: 'A field that suggests: typing filters Options ([{Value, Label, Hint, Icon, Group, Disabled}]) in a list under it, the labels that start with the text first; arrows and Enter pick, Escape closes and then restores the text.',
		Events: {
			search: 'The text changed: the text, to load Options from a server.',
			create: 'A text that is no option was taken (AllowCustom): the text.',
			change: 'An option was picked: Value.'
		},
		Props: {
			Options: {Schema: {Value: 'text', Label: 'text', Hint: 'text', Disabled: 'bool'}, Description: 'The options: [{Value, Label, Hint, Icon, Group, Disabled}].'},
			Value: 'The Value of the option picked (or the text, with AllowCustom).',
			Placeholder: 'The text shown while it is empty.',
			Empty: 'The text of the list when nothing matches.',
			CreateLabel: 'The text of the row that creates a value of its own.',
			AllowCustom: 'Takes a text that is no option too.',
			Filter: 'Filters the options by the text; false keeps them as they come (from a server).',
			Loading: 'Shows a spinner in the list.',
			Clearable: 'Adds a button that clears the value.',
			Icon: 'An icon at the start of the field.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Shape: 'Its shape: default, or round.',
			Name: 'The name of its value in a form.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Invalid: 'Marks its value as wrong.'
		},
		Sample: {Placeholder: 'Type to search', AllowCustom: true}
	},
	Options: [],
	Value: null,
	Placeholder: '',
	Empty: '',
	CreateLabel: '',
	AllowCustom: false,
	Filter: true,
	Loading: false,
	Clearable: false,
	Icon: '',
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Disabled: false,
	Invalid: false,
	Text: '',
	Editing: false,
	Open: false,
	Active: 0,

	$OnCreate: function () {
		var self = this;

		this.LabelOf = function (options, value) {
			var option = (options || []).filter(function (entry) {
				return entry.Value === value;
			})[0];
			if (option)
				return option.Label;

			return self.AllowCustom && value != null ? String(value) : '';
		};

		/* The options for the text: the labels that start with it, then the ones that hold it. */
		this.Visible = function (options, text, editing, filter) {
			var query = String(text || '').trim().toLowerCase();
			var starting = [];
			var holding = [];

			if (!editing || !query || filter === false || filter === 'false') return options || [];

			(options || []).forEach(function (option) {
				var label = String(option.Label).toLowerCase();
				var at = label.indexOf(query);

				if (at === 0) starting.push(option);
				else if (at > 0) holding.push(option);
			});

			return starting.concat(holding);
		};

		/*
		 * The rows of the list: group headings, the options (Index: their number for the keys, -1 when disabled) and
		 * the Create row last.
		 */
		this.Entries = function (options, text, editing, filter) {
			var entries = [];
			var index = 0;
			var group = null;

			self.Visible(options, text, editing, filter).forEach(function (option) {
				if (option.Group && option.Group !== group)
					entries.push({Key: 'group:' + option.Group, Heading: option.Group});

				group = option.Group || null;

				entries.push({Key: 'option:' + String(option.Value), Option: option, Index: option.Disabled ? -1 : index});

				if (!option.Disabled)
					index++;
			});

			if (self.Creatable(options, text, editing))
				entries.push({Key: 'create', Create: true, Index: index});

			return entries;
		};

		/* A Create row for a text that no option has. */
		this.Creatable = function (options, text, editing) {
			var query = String(text || '').trim().toLowerCase();

			return !!self.AllowCustom && !!editing && !!query && !(options || []).some(function (option) {
				return String(option.Label).toLowerCase() === query;
			});
		};
	},

	Rows: function () {
		return this.Entries(this.Options, this.Text, this.Editing, this.Filter).filter(function (entry) {
			return entry.Index > -1 && !entry.Heading;
		}).length;
	},

	Typed: function (event, node) {
		this.Text = node.value;
		this.Editing = true;
		this.Open = true;
		this.Active = 0;

		this.$Emit('search', node.value);
	},

	Focus: function (event, node) {
		node.select();
	},

	Key: function (event, node) {
		var rows = this.Rows();

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();

			if (!this.Open) {
				this.Open = true;
				this.Active = 0;

				return;
			}

			if (rows)
				this.Active = (this.Active + (event.key === 'ArrowDown' ? 1 : -1) + rows) % rows;

			this.Show(node);
		}
		else if (event.key === 'Enter') {
			if (!this.Open) return;

			event.preventDefault();

			this.Choose(this.Active, node);
		}
		else if (event.key === 'Escape') {
			if (!this.Open && !this.Editing) return;

			event.preventDefault();
			event.stopPropagation();

			if (this.Open) this.Open = false;
			else this.Restore(node);
		}
		else if (event.key === 'Tab') {
			this.Open = false;
		}
	},

	Show: function (node) {
		var root = node.closest('.elemenx-combobox');

		window.setTimeout(function () {
			var active = root.querySelector('.elemenx-popup .elemenx-option.active');
			if (active)
				active.scrollIntoView({block: 'nearest'});
		}, 0);
	},

	/* The enabled option at a row, or the text for the Create row after them. */
	Choose: function (index, node) {
		var options = this.Visible(this.Options, this.Text, this.Editing, this.Filter).filter(function (option) {
			return !option.Disabled;
		});
		var option = options[index];
		var text = String(this.Text || '').trim();

		if (option) {
			this.Set(option.Value);
		}
		else if (index === options.length && this.Creatable(this.Options, this.Text, this.Editing)) {
			this.Set(text);

			this.$Emit('create', text);
		}
		else {
			return;
		}

		this.Open = false;
		this.Editing = false;
		this.Text = '';

		if (node)
			node.value = this.LabelOf(this.Options, this.Value);
	},

	Set: function (value) {
		if (value === this.Value) return;

		this.Value = value;

		this.$Emit('change', value);
	},

	Restore: function (node) {
		this.Editing = false;
		this.Text = '';

		node.value = this.LabelOf(this.Options, this.Value);
	},

	Blur: function (event, node) {
		var text = String(node.value || '').trim();
		var exact;

		this.Open = false;

		if (!this.Editing) return;

		exact = this.Options.filter(function (option) {
			return String(option.Label).toLowerCase() === text.toLowerCase() && !option.Disabled;
		})[0];

		if (exact) this.Set(exact.Value);
		else if (!text && this.Clearable) this.Set(null);
		else if (text && this.AllowCustom) this.Set(text);

		this.Restore(node);
	},

	Hover: function (event, node) {
		var index = Number(node.getAttribute('data-index'));
		if (index > -1)
			this.Active = index;
	},

	Prevent: function (event) {
		event.preventDefault();
	},

	Pick: function (event, node) {
		var input = node.closest('.elemenx-combobox').querySelector('.elemenx-combobox-control');
		var index = Number(node.getAttribute('data-index'));
		if (index < 0) return;

		this.Choose(index, input);

		input.focus();
	},

	Toggle: function (event, node) {
		var input = node.closest('.elemenx-combobox').querySelector('.elemenx-combobox-control');

		this.Open = !this.Open;
		this.Active = 0;

		input.focus();
	},

	Clear: function (event, node) {
		var input = node.closest('.elemenx-combobox').querySelector('.elemenx-combobox-control');

		event.stopPropagation();

		this.Set(null);
		this.Restore(input);

		input.focus();
	},

	Dismissed: function () {
		this.Open = false;
	}
});
