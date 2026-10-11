/*
 * Options: [{Value, Label, Hint, Icon, Group, Disabled}]. Value is the Value of the selected option or null.
 * Searchable adds a filter field; Clearable lets the user reset the value.
 */
Elemenx.Component('Select', {
	$TemplateURL: 'Select.html',
	Options: [],
	Value: null,
	Placeholder: 'Select…',
	Empty: 'Nothing found',
	Icon: '',
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Searchable: false,
	Clearable: false,
	Disabled: false,
	Invalid: false,
	Open: false,
	Filter: '',
	Active: -1,

	$OnCreate: function () {
		this.Find = function (options, value) {
			var i = 0;

			while (i < options.length) {
				if (options[i].Value === value) return options[i];

				i++;
			}

			return null;
		};

		this.Visible = function (options, filter) {
			var query = String(filter || '').toLowerCase();
			if (!query)
				return options;

			return options.filter(function (option) {
				return String(option.Label).toLowerCase().indexOf(query) !== -1;
			});
		};
	},

	Toggle: function (event, node) {
		if (this.Disabled) return;

		if (this.Open) {
			this.Open = false;

			return;
		}

		this.Show(node);
	},

	Show: function (node) {
		var list;
		var i = 0;

		this.Filter = '';
		this.Open = true;
		this.Active = -1;
		list = this.Visible(this.Options, '');

		while (i < list.length) {
			if (list[i].Value === this.Value)
				this.Active = i;

			i++;
		}

		if (this.Active === -1)
			this.Move(1);

		this.Reveal(node);
	},

	Reveal: function (node) {
		var root = node.closest('.elemenx-select');
		var searchable = this.Searchable;

		window.setTimeout(function () {
			var search = root.querySelector('.elemenx-popup-search input');
			var active = root.querySelector('.elemenx-popup .elemenx-option.active');

			if (searchable && search)
				search.focus();

			if (active)
				active.scrollIntoView({block: 'nearest'});
		}, 0);
	},

	Move: function (direction) {
		var list = this.Visible(this.Options, this.Filter);
		var index = this.Active;
		var steps = 0;

		while (steps < list.length) {
			index = (index + direction + list.length) % list.length;

			if (!list[index].Disabled) {
				this.Active = index;

				return;
			}

			steps++;
		}

		this.Active = -1;
	},

	Key: function (event, node) {
		var root = node.closest('.elemenx-select');
		var active;

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();

			if (!this.Open) {
				this.Show(node);

				return;
			}

			this.Move(event.key === 'ArrowDown' ? 1 : -1);

			active = root.querySelector('.elemenx-option[data-index="' + this.Active + '"]');

			if (active)
				active.scrollIntoView({block: 'nearest'});
		}
		else if (event.key === 'Enter' || (event.key === ' ' && !this.Searchable)) {
			event.preventDefault();

			if (this.Open) this.Choose(this.Active, root);
			else this.Show(node);
		}
		else if (event.key === 'Tab') {
			this.Open = false;
		}
	},

	Search: function (event, node) {
		this.Filter = node.value;
		this.Active = -1;

		this.Move(1);
	},

	Hover: function (event, node) {
		this.Active = Number(node.getAttribute('data-index'));
	},

	Prevent: function (event) {
		event.preventDefault();
	},

	Pick: function (event, node) {
		this.Choose(Number(node.getAttribute('data-index')), node.closest('.elemenx-select'));
	},

	Choose: function (index, root) {
		var option = this.Visible(this.Options, this.Filter)[index];
		if (!option || option.Disabled) return;

		this.Value = option.Value;
		this.Open = false;

		this.$Emit('change', this.Value);

		root.querySelector('.elemenx-select-trigger').focus();
	},

	Clear: function (event) {
		event.stopPropagation();

		this.Value = null;

		this.$Emit('change', null);
	},

	Dismissed: function (event) {
		this.Open = false;

		if (event.detail.Reason === 'escape')
			event.target.closest('.elemenx-select').querySelector('.elemenx-select-trigger').focus();
	}
});