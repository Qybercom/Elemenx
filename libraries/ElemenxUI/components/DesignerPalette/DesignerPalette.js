/*
 * The palette of a designer of pages (the Designer Service): the kinds it can place, by group, with a search. A kind
 * pressed goes into the selected element when that is a container, after it otherwise, and at the end of the page
 * without a selection, and is selected; a kind dragged (*draggable, type elemenx-designer-kind) goes where a
 * DesignerCanvas takes it. Its tip (*tip) is its name in bold and the description its Component declares in $Meta.
 * Events: add (the new ID).
 */
Elemenx.Component('DesignerPalette', {
	$TemplateURL: 'DesignerPalette.html',
	$StyleURL: 'DesignerPalette.css',
	$Meta: {
		Group: 'tools',
		Icon: 'add',
		Description: 'The palette of a designer of pages: its kinds by group, with a search.',
		Events: ['add'],
		Props: {
			Query: 'The text of the search: the kinds whose name holds it.'
		}
	},
	Query: '',
	Version: 0,

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');

		function changed () {
			self.Version++;
		}

		/* What the palette listens to: not state, so it renders nothing. */
		this.Own = function () {
			return changed;
		};

		/* The groups with their kinds, the ones whose name holds the text of the search (query). */
		this.Groups = function (version, query) {
			var text = String(query || '').trim().toLowerCase();

			return version >= 0 ? designer.Kinds().map(function (group) {
				return {
					ID: group.ID,
					Label: designer.GroupLabel(group.ID),
					Kinds: group.Kinds.map(function (kind) {
						var label = designer.Label(kind.ID);

						return {ID: kind.ID, Icon: kind.Icon, Label: label, Hint: designer.Hint(kind.ID)};
					}).filter(function (kind) {
						return !text || kind.Label.toLowerCase().indexOf(text) !== -1 || kind.ID.toLowerCase().indexOf(text) !== -1;
					})
				};
			}).filter(function (group) {
				return group.Kinds.length > 0;
			}) : [];
		};

		designer.OnChange(changed);

		Elemenx.Locale.OnChange(changed);

		designer.Load();
	},

	$OnDestroy: function () {
		this.$Service('Designer').OffChange(this.Own());

		Elemenx.Locale.OffChange(this.Own());
	},

	Searched: function (value) {
		this.Query = value;
	},

	Added: function (event, node) {
		var designer = this.$Service('Designer');
		var kind = node.getAttribute('data-kind');
		var selected = designer.Selected();
		var parent;
		var id;

		if (selected && designer.Container(selected)) {
			id = designer.Insert(kind, selected);
		}
		else if (selected) {
			parent = designer.Parent(selected);
			id = designer.Insert(kind, parent.ID, parent.Children.indexOf(designer.Find(selected)) + 1);
		}
		else {
			id = designer.Insert(kind, 'root');
		}

		designer.Select(id);

		this.$Emit('add', id);
	}
});
