/*
 * The filters of a collection, by its facets: Facets [{ID, Label, Type, Field, Options: [{Value, Label}], Min, Max,
 * Step, Unit, Collapsed}], each of a Type: options (any of the values checked, the default), choice (one of them, or
 * any), range (from Min to Max: two numbers), rating (that score or more) or toggle (only the items that have it).
 * Value holds what is chosen, {ID: [values] | value | [from, to] | true}. With Items, a facet without Options takes the
 * values its Field has in them (an array of genres counts each), and each option tells how many items it would leave
 * with the other facets as they are; filter emits the items left. Field is the name of the field of an item (a path:
 * info.year), the ID of the facet without. The chips over the facets show what is chosen and take it away; Clear() and
 * the button empty them all. Limit options show (8), the others under "Show all"; a facet of more than 12 options
 * has a field that finds them. Filter(items) gives the items Value leaves. Events: change (Value), filter (the items).
 */
Elemenx.Component('FacetFilter', {
	$TemplateURL: 'FacetFilter.html',
	$StyleURL: 'FacetFilter.css',
	$Meta: {
		Group: 'data',
		Icon: 'filter',
		Description: 'The filters of a collection by its facets: values to check, a choice, a range, a rating, a toggle; with the count each would leave and chips of what is chosen.',
		Events: {
			change: 'What is chosen changed: Value.',
			filter: 'The items left (with Items).'
		},
		Methods: ['Filter(items)', 'Clear()'],
		Props: {
			Facets: 'The facets: [{ID, Label, Type, Field, Options: [{Value, Label}], Min, Max, Step, Unit, Collapsed}].',
			Value: 'What is chosen: {ID: [values] | value | [from, to] | true}.',
			Items: 'The items of the collection, for the counts and the filter event.',
			Limit: 'The options shown before Show all (8).',
			Chips: 'Shows the chips of what is chosen.',
			Label: 'The name of the filters for screen readers.'
		},
		Sample: {Facets: [{ID: 'genre', Label: 'Genre', Options: [{Value: 'drama', Label: 'Drama'}, {Value: 'comedy', Label: 'Comedy'}]}, {ID: 'year', Label: 'Year', Type: 'range', Min: 1990, Max: 2025}], Value: {genre: ['drama']}}
	},
	Facets: [],
	Value: {},
	Items: null,
	Limit: 8,
	Chips: true,
	Label: '',
	Open: {},
	Searches: {},
	Shown: {},
	Last: '',

	$OnReady: function () {
		this.Emit(false);
	},

	$OnProps: function (changed) {
		if (!changed || changed.Items || changed.Value || changed.Facets)
			this.Emit(false);
	},

	/* The value of a field of an item, by a path (info.year). */
	Read: function (item, path) {
		return String(path || '').split('.').reduce(function (value, key) {
			return value === null || value === undefined ? value : value[key];
		}, item);
	},

	FieldOf: function (facet) {
		return facet.Field || facet.ID;
	},

	TypeOf: function (facet) {
		return ['options', 'choice', 'range', 'rating', 'toggle'].indexOf(facet.Type) === -1 ? 'options' : facet.Type;
	},

	Chosen: function (facet) {
		var value = (this.Value || {})[facet.ID];
		var type = this.TypeOf(facet);
		if (type === 'options')
			return Array.isArray(value) ? value : value === undefined || value === null || value === '' ? [] : [value];

		if (type === 'range')
			return Array.isArray(value) ? value : [null, null];

		if (type === 'toggle')
			return value === true;

		return value === undefined ? null : value;
	},

	/* Whether something is chosen in a facet. */
	Active: function (facet) {
		var chosen = this.Chosen(facet);
		var type = this.TypeOf(facet);
		if (type === 'options')
			return chosen.length > 0;

		if (type === 'range')
			return this.Bound(chosen[0]) !== null || this.Bound(chosen[1]) !== null;

		if (type === 'toggle') return chosen;

		return chosen !== null && chosen !== '';
	},

	Bound: function (value) {
		return value === null || value === undefined || value === '' || isNaN(Number(value)) ? null : Number(value);
	},

	/* Whether an item is left by a facet as it is chosen. */
	Passes: function (item, facet) {
		var field = this.Read(item, this.FieldOf(facet));
		var values = Array.isArray(field) ? field : [field];
		var chosen = this.Chosen(facet);
		var type = this.TypeOf(facet);
		var from;
		var to;

		if (!this.Active(facet)) return true;

		if (type === 'options')
			return values.some(function (value) {
				return chosen.map(String).indexOf(String(value)) !== -1;
			});

		if (type === 'choice')
			return values.map(String).indexOf(String(chosen)) !== -1;

		if (type === 'toggle')
			return values.some(Boolean);

		from = type === 'range' ? this.Bound(chosen[0]) : this.Bound(chosen);
		to = type === 'range' ? this.Bound(chosen[1]) : null;

		return values.some(function (value) {
			var number = Number(value);

			return value !== null && value !== undefined && !isNaN(number) && (from === null || number >= from) && (to === null || number <= to);
		});
	},

	/* The items a Value leaves, the facet skip left out (for the counts of its own options). */
	Filter: function (items, skip) {
		var self = this;
		var facets = this.Facets || [];

		return (items || []).filter(function (item) {
			return facets.every(function (facet) {
				return facet.ID === skip || self.Passes(item, facet);
			});
		});
	},

	/* The options of a facet: its own, or the values its field has in the Items, in the order they first come. */
	Choices: function (facet) {
		var self = this;
		var seen = {};
		var list = [];

		if (facet.Options && facet.Options.length)
			return facet.Options.map(function (option) {
				return typeof option === 'object' ? option : {Value: option, Label: String(option)};
			});

		(this.Items || []).forEach(function (item) {
			var field = self.Read(item, self.FieldOf(facet));

			(Array.isArray(field) ? field : [field]).forEach(function (value) {
				if (value === null || value === undefined || value === '' || seen[value]) return;

				seen[value] = true;

				list.push({Value: value, Label: String(value)});
			});
		});

		return list;
	},

	/* How many items an option of a facet would leave, the other facets as they are; null without Items. */
	Count: function (facet, option) {
		var self = this;
		var type = this.TypeOf(facet);

		if (!this.Items) return null;

		return this.Filter(this.Items, facet.ID).filter(function (item) {
			var field = self.Read(item, self.FieldOf(facet));
			var values = Array.isArray(field) ? field : [field];

			if (type === 'rating')
				return values.some(function (value) {
					return Number(value) >= Number(option.Value);
				});

			return values.map(String).indexOf(String(option.Value)) !== -1;
		}).length;
	},

	/* The options a facet shows: found by its field of search, the first Limit unless all are shown. */
	Visible: function (facet) {
		var search = String(this.Searches[facet.ID] || '').toLowerCase();
		var list = this.Choices(facet).filter(function (option) {
			return !search || String(option.Label).toLowerCase().indexOf(search) !== -1;
		});

		return this.Shown[facet.ID] || search ? list : list.slice(0, Math.max(1, Number(this.Limit) || 8));
	},

	Hidden: function (facet) {
		return this.Shown[facet.ID] || this.Searches[facet.ID] ? 0 : Math.max(0, this.Choices(facet).length - Math.max(1, Number(this.Limit) || 8));
	},

	/* The scores of a rating facet: its Options, or 4, 3, 2 and 1 of 5 (8 to 5 of 10). */
	Scores: function (facet) {
		var max = Number(facet.Max) || 5;

		if (facet.Options && facet.Options.length) return this.Choices(facet);

		return (max > 5 ? [8, 7, 6, 5] : [4, 3, 2, 1]).map(function (value) {
			return {Value: value, Label: value + '+'};
		});
	},

	Expanded: function (facet) {
		return this.Open[facet.ID] === undefined ? !facet.Collapsed : this.Open[facet.ID];
	},

	/* The chips: one for each value chosen, {Facet, Value, Label}. */
	Tags: function () {
		var self = this;
		var tags = [];

		(this.Facets || []).forEach(function (facet) {
			var chosen = self.Chosen(facet);
			var type = self.TypeOf(facet);
			var label = function (value) {
				var found = self.Choices(facet).filter(function (option) {
					return String(option.Value) === String(value);
				})[0];

				return found ? found.Label : String(value);
			};

			if (!self.Active(facet)) return;

			if (type === 'options') chosen.forEach(function (value) {
				tags.push({Facet: facet.ID, Value: value, Label: facet.Label + ': ' + label(value), Key: facet.ID + ':' + value});
			});
			else if (type === 'range') tags.push({Facet: facet.ID, Value: null, Label: facet.Label + ': ' + (self.Bound(chosen[0]) === null ? '…' : chosen[0]) + ' – ' + (self.Bound(chosen[1]) === null ? '…' : chosen[1]) + (facet.Unit ? ' ' + facet.Unit : ''), Key: facet.ID});
			else if (type === 'toggle') tags.push({Facet: facet.ID, Value: null, Label: facet.Label, Key: facet.ID});
			else tags.push({Facet: facet.ID, Value: null, Label: facet.Label + ': ' + (type === 'rating' ? chosen + '+' : label(chosen)), Key: facet.ID});
		});

		return tags;
	},

	/* A new Value: change, and with Items the items it leaves. */
	Set: function (id, value) {
		var next = JSON.parse(JSON.stringify(this.Value || {}));

		if (value === null || value === undefined || (Array.isArray(value) && !value.length)) delete next[id];
		else next[id] = value;

		this.Value = next;

		this.$Emit('change', JSON.parse(JSON.stringify(next)));
		this.Emit(true);
	},

	Emit: function (always) {
		var text;

		if (!this.Items) return;

		text = JSON.stringify(this.Value || {}) + '|' + (this.Items || []).length;

		if (!always && text === this.Last) return;

		this.Last = text;

		this.$Emit('filter', this.Filter(this.Items));
	},

	Clear: function () {
		this.Value = {};

		this.$Emit('change', {});
		this.Emit(true);

		return this;
	},

	FacetOf: function (event) {
		var node = event.target.closest('[data-facet]');
		var id = node ? node.getAttribute('data-facet') : '';

		return (this.Facets || []).filter(function (facet) {
			return String(facet.ID) === id;
		})[0] || null;
	},

	/* The option of an event: its value as the facet has it (a number stays a number). */
	OptionOf: function (facet, event) {
		var text = event.target.closest('[data-value]').getAttribute('data-value');
		var found = this.Choices(facet).concat(this.TypeOf(facet) === 'rating' ? this.Scores(facet) : []).filter(function (option) {
			return String(option.Value) === text;
		})[0];

		return found ? found.Value : text;
	},

	Checked: function (event) {
		var facet = this.FacetOf(event);
		var value = this.OptionOf(facet, event);
		var chosen = this.Chosen(facet).filter(function (each) {
			return String(each) !== String(value);
		});

		this.Set(facet.ID, event.target.checked ? chosen.concat([value]) : chosen);
	},

	Picked: function (event) {
		var facet = this.FacetOf(event);

		this.Set(facet.ID, event.target.value === '' ? null : this.OptionOf(facet, event));
	},

	Switched: function (event) {
		this.Set(this.FacetOf(event).ID, event.target.checked ? true : null);
	},

	Ranged: function (event) {
		var facet = this.FacetOf(event);
		var chosen = this.Chosen(facet).slice();
		var index = event.target.getAttribute('data-bound') === 'to' ? 1 : 0;

		chosen[index] = this.Bound(event.target.value);

		this.Set(facet.ID, chosen[0] === null && chosen[1] === null ? null : chosen);
	},

	Removed: function (event) {
		var node = event.target.closest('[data-tag]');
		var facet = (this.Facets || []).filter(function (each) {
			return String(each.ID) === node.getAttribute('data-facet');
		})[0];
		var value = node.getAttribute('data-value');

		if (this.TypeOf(facet) === 'options') this.Set(facet.ID, this.Chosen(facet).filter(function (each) {
			return String(each) !== value;
		}));
		else this.Set(facet.ID, null);
	},

	Toggled: function (event) {
		var facet = this.FacetOf(event);
		var open = {};
		var key;

		for (key in this.Open) {
			if (Object.prototype.hasOwnProperty.call(this.Open, key))
				open[key] = this.Open[key];
		}

		open[facet.ID] = !this.Expanded(facet);

		this.Open = open;
	},

	Searched: function (event) {
		var searches = JSON.parse(JSON.stringify(this.Searches));

		searches[this.FacetOf(event).ID] = event.target.value;

		this.Searches = searches;
	},

	ShowAll: function (event) {
		var shown = JSON.parse(JSON.stringify(this.Shown));

		shown[this.FacetOf(event).ID] = true;

		this.Shown = shown;
	}
});
