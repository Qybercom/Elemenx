/*
 * The layout of the selected element of a designer of pages (the Designer Service), what every element has whatever
 * its kind: its margin and its padding on a box of the box model, a field for each side (12 gives 12px; the four sides
 * become one shorthand: 8px, 8px 16px...), its width and height with their least and greatest, and in a flex container
 * the direction, the wrap, the alignment of the items across (align-items) and along (justify-content) as buttons with
 * icons, and the gap. A choice pressed again is taken away. Every change goes to the Designer at once (SetStyle).
 */
Elemenx.Component('DesignerStyle', {
	$TemplateURL: 'DesignerStyle.html',
	$StyleURL: 'DesignerStyle.css',
	$Meta: {
		Group: 'tools',
		Icon: 'layout',
		Description: 'The layout of the selected element of a designer of pages: its box, its sizes and its flex.'
	},
	Version: 0,

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');

		function changed () {
			self.Version++;
		}

		/* What it listens to: not state, so it renders nothing. */
		this.Own = function () {
			return changed;
		};

		this.Current = function (version) {
			var id = version >= 0 ? designer.Selected() : null;
			var node = id ? designer.Find(id) : null;

			return node && node.Kind !== 'text' ? node : null;
		};

		this.Value = function (node, property) {
			return node && node.Style ? node.Style[property] || '' : '';
		};

		/* A side of a shorthand (0 top, 1 right, 2 bottom, 3 left), as CSS reads 1, 2, 3 or 4 values. */
		this.Side = function (node, property, side) {
			return self.Sides(self.Value(node, property))[side];
		};

		this.Flex = function (node) {
			var kind = node ? designer.Kind(node.Kind) : null;

			return !!kind && !!kind.Flex;
		};

		/* Whether the items of a flex container go across: its own direction, or the flow of its kind. */
		this.Row = function (node) {
			var direction = self.Value(node, 'flex-direction');
			var kind = node ? designer.Kind(node.Kind) : null;

			return direction ? direction.indexOf('row') === 0 : !!kind && kind.Flow === 'row';
		};

		/* The choices of a property: [{Value, Icon, Label, Active}], the icons drawn for the direction of the items. */
		this.Choices = function (node, property, language) {
			var row = self.Row(node);
			var value = self.Value(node, property);
			var lists = {
				'flex-direction': [['row', 'arrow-right'], ['column', 'arrow-down'], ['row-reverse', 'arrow-left'], ['column-reverse', 'arrow-up']],
				'flex-wrap': [['nowrap', 'remove'], ['wrap', 'flex-wrap']],
				'align-items': [['stretch', row ? 'align-stretch-vertical' : 'align-stretch-horizontal'], ['flex-start', row ? 'align-top' : 'align-left'], ['center', row ? 'align-center-vertical' : 'align-center-horizontal'], ['flex-end', row ? 'align-bottom' : 'align-right'], ['baseline', 'align-baseline']],
				'justify-content': [['flex-start', 'justify-start'], ['center', 'justify-center'], ['flex-end', 'justify-end'], ['space-between', 'justify-between'], ['space-around', 'justify-around'], ['space-evenly', 'justify-evenly']]
			};

			return language !== undefined ? lists[property].map(function (entry) {
				return {Value: entry[0], Icon: entry[1], Label: entry[0], Active: entry[0] === value, Turned: property === 'justify-content' && !row};
			}) : [];
		};

		this.Sizes = function () {
			return ['width', 'height', 'min-width', 'max-width', 'min-height', 'max-height'];
		};

		designer.OnChange(changed);

		Elemenx.Locale.OnChange(changed);

		designer.Load();
	},

	$OnDestroy: function () {
		this.$Service('Designer').OffChange(this.Own());

		Elemenx.Locale.OffChange(this.Own());
	},

	/* The four sides of a shorthand: '8px 16px' is 8px 16px 8px 16px. */
	Sides: function (value) {
		var parts = String(value || '').trim().split(/\s+/).filter(Boolean);
		if (!parts.length)
			return ['', '', '', ''];

		if (parts.length === 1)
			return [parts[0], parts[0], parts[0], parts[0]];

		if (parts.length === 2)
			return [parts[0], parts[1], parts[0], parts[1]];

		if (parts.length === 3)
			return [parts[0], parts[1], parts[2], parts[1]];

		return parts.slice(0, 4);
	},

	/* The shortest shorthand of four sides; an empty side is 0 beside the others, and four empty ones are none. */
	Join: function (sides) {
		var values = sides.map(function (side) {
			return side || '0';
		});

		if (!sides.join('')) return '';

		if (values[0] === values[1] && values[1] === values[2] && values[2] === values[3]) return values[0];

		if (values[0] === values[2] && values[1] === values[3]) return values[0] + ' ' + values[1];

		if (values[1] === values[3])
			return values[0] + ' ' + values[1] + ' ' + values[2];

		return values.join(' ');
	},

	/* A length typed as a number is in pixels. */
	Length: function (value) {
		value = String(value || '').trim();

		return /^-?\d+(\.\d+)?$/.test(value) && value !== '0' ? value + 'px' : value;
	},

	Sided: function (event, node) {
		var designer = this.$Service('Designer');
		var id = designer.Selected();
		var property = node.getAttribute('data-property');
		var sides = this.Sides(designer.Find(id).Style ? designer.Find(id).Style[property] : '');

		sides[Number(node.getAttribute('data-side'))] = this.Length(node.value);

		designer.SetStyle(id, property, this.Join(sides));
	},

	Sized: function (value, control) {
		this.$Service('Designer').SetStyle(this.$Service('Designer').Selected(), control.Name, this.Length(value));
	},

	/* A choice pressed: its value, or none when it was the one set. */
	Chosen: function (event, node) {
		var designer = this.$Service('Designer');
		var id = designer.Selected();
		var property = node.getAttribute('data-property');
		var value = node.getAttribute('data-value');
		var current = designer.Find(id).Style ? designer.Find(id).Style[property] : '';

		designer.SetStyle(id, property, current === value ? '' : value);
	}
});
