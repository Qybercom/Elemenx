/*
 * A select of several options. Options: [{Value, Label, Hint, Icon, Group, Disabled}]; Value is the list of the Values
 * selected. Display: chips (the chosen options as removable tags in the field) or count ("3 selected"). Searchable (on
 * by default) adds a filter field; SelectAll adds an option that toggles every enabled option. The list stays open while
 * options are toggled. Placeholder, Empty, Size, Shape, Disabled and Invalid as in Select. Events: change (the list).
 */
Elemenx.Component('MultiSelect', {
	$TemplateURL: 'MultiSelect.html',
	$Meta: {
		Group: 'inputs',
		Icon: 'edit',
		Description: 'A select of several options.',
		Events: ['change'],
		Props: {
			Options: 'The options: [{Value, Label, Hint, Icon, Group, Disabled}].',
			Value: 'The Values chosen.',
			Placeholder: 'The text shown while it is empty.',
			Empty: 'The text when the filter finds nothing.',
			Display: {Options: ['chips', 'count'], Description: 'chips (removable tags) or count (3 selected).'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Shape: 'Its shape: default, or round.',
			Searchable: 'Adds a filter field to the list.',
			SelectAll: 'Adds an option that toggles every one.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Invalid: 'Marks its value as wrong.'
		},
		Sample: {Placeholder: 'Pick colors', SelectAll: true}
	},
	Options: [],
	Value: [],
	Placeholder: '',
	Empty: '',
	Display: 'chips',
	Size: 'medium',
	Shape: 'default',
	Searchable: true,
	SelectAll: false,
	Disabled: false,
	Invalid: false,
	Open: false,
	Filter: '',
	Active: -1,

	$OnCreate: function () {
		this.Has = function (value, item) {
			return (value || []).indexOf(item) !== -1;
		};

		this.Selected = function (options, value) {
			return options.filter(function (option) {
				return (value || []).indexOf(option.Value) !== -1;
			});
		};

		this.Visible = function (options, filter) {
			var query = String(filter || '').toLowerCase();
			if (!query)
				return options;

			return options.filter(function (option) {
				return String(option.Label).toLowerCase().indexOf(query) !== -1;
			});
		};

		this.AllSelected = function (options, value) {
			var enabled = options.filter(function (option) {
				return !option.Disabled;
			});

			return enabled.length > 0 && enabled.every(function (option) {
				return (value || []).indexOf(option.Value) !== -1;
			});
		};
	},

	Toggle: function (event, node) {
		if (this.Disabled) return;

		this.Open = !this.Open;
		this.Filter = '';
		this.Active = -1;

		if (this.Open)
			this.Reveal(node);
	},

	Reveal: function (node) {
		var root = node.closest('.elemenx-select');
		var searchable = this.Searchable;

		window.setTimeout(function () {
			var search = root.querySelector('.elemenx-popup-search input');
			if (searchable && search)
				search.focus();
		}, 0);
	},

	Set: function (value) {
		this.Value = value;

		this.$Emit('change', value.slice());
	},

	Flip: function (option) {
		var value = (this.Value || []).slice();
		var index;

		if (!option || option.Disabled) return;

		index = value.indexOf(option.Value);

		if (index === -1) value.push(option.Value);
		else value.splice(index, 1);

		this.Set(value);
	},

	FlipAll: function () {
		var all = this.AllSelected(this.Options, this.Value);
		var value = all ? [] : this.Options.filter(function (option) {
			return !option.Disabled;
		}).map(function (option) {
			return option.Value;
		});

		this.Set(value);
	},

	Pick: function (event, node) {
		var option = this.Visible(this.Options, this.Filter)[Number(node.getAttribute('data-index'))];
		if (option)
			this.Flip(option);
	},

	Remove: function (event, node) {
		var option = this.Selected(this.Options, this.Value)[Number(node.getAttribute('data-index'))];

		event.stopPropagation();

		if (option)
			this.Flip(option);
	},

	Hover: function (event, node) {
		this.Active = Number(node.getAttribute('data-index'));
	},

	Prevent: function (event) {
		event.preventDefault();
	},

	Search: function (event, node) {
		this.Filter = node.value;
		this.Active = 0;
	},

	Key: function (event, node) {
		var list = this.Visible(this.Options, this.Filter);
		var root = node.closest('.elemenx-select');
		var active;

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();

			if (!this.Open) {
				this.Toggle(event, node);

				return;
			}

			this.Active = list.length ? (this.Active + (event.key === 'ArrowDown' ? 1 : list.length - 1) + list.length) % list.length : -1;

			active = root.querySelector('.elemenx-option[data-index="' + this.Active + '"]');

			if (active)
				active.scrollIntoView({block: 'nearest'});
		}
		else if (event.key === 'Enter' || (event.key === ' ' && event.target.tagName !== 'INPUT')) {
			event.preventDefault();

			if (!this.Open) this.Toggle(event, node);
			else if (list[this.Active]) this.Flip(list[this.Active]);
		}
		else if (event.key === 'Backspace' && event.target.tagName !== 'INPUT' && (this.Value || []).length) {
			this.Set(this.Value.slice(0, -1));
		}
		else if (event.key === 'Tab') {
			this.Open = false;
		}
	},

	Dismissed: function (event) {
		this.Open = false;

		if (event.detail.Reason === 'escape')
			event.target.closest('.elemenx-select').querySelector('.elemenx-select-trigger').focus();
	}
});