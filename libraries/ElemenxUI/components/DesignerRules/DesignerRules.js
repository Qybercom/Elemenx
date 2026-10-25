/*
 * The rules of CSS of the selected element of a designer of pages (the Designer Service), by their context: who (this
 * element, every element of its kind, or those inside an element of the kind around it), when (always, :hover,
 * :focus-visible, :active, :disabled), where (every width, a tablet, a phone) and in which scheme (both, light, dark).
 * The properties of the rule of the context are rows of a name and a value (a token of the theme,
 * var(--elemenx-accent), is offered as one, with the value it takes on the canvas: in the scheme of the context, or in
 * the light and the dark one; a value that holds a token shows what it comes to under it); a property added makes the
 * rule, the last one taken away removes it. The rules that reach the element in other contexts are listed under them, a
 * press goes to one. The rules go into the template as a <style>.
 */
Elemenx.Component('DesignerRules', {
	$TemplateURL: 'DesignerRules.html',
	$StyleURL: 'DesignerRules.css',
	$Meta: {
		Group: 'tools',
		Icon: 'code',
		Description: 'The rules of CSS of the selected element of a designer of pages, by who, when, where and which scheme.'
	},
	Version: 0,
	Who: 'node',
	When: '',
	Where: '',
	Scheme: '',
	Property: '',
	Value: '',

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');

		function changed () {
			self.Version++;
		}

		function text (key, params) {
			return Elemenx.Locale.Text('ui.designer.rules.' + key, params);
		}

		function options (values, prefix) {
			return values.map(function (value) {
				return {Value: value, Label: text(prefix + (value || 'all'))};
			});
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

		/* The kind around a node that has a class of its own: the parent of a rule within. */
		this.Around = function (node) {
			var parent = node ? designer.Parent(node.ID) : null;

			while (parent && parent.ID !== 'root' && !designer.RootClass(parent.ID)) {
				parent = designer.Parent(parent.ID);
			}

			return parent && parent.ID !== 'root' ? parent : null;
		};

		/* The context of the fields: {Who, Node, Class, Parent, State, Width, Theme}. */
		this.Context = function (node, who, when, where, scheme) {
			var around = self.Around(node);

			return {Who: who, Node: node.ID, Class: designer.RootClass(node.ID), Parent: around ? designer.RootClass(around.ID) : '', State: when, Width: where, Theme: scheme};
		};

		this.Whos = function (node, version) {
			var around = version >= 0 ? self.Around(node) : null;
			var result = [{Value: 'node', Label: text('node')}];

			if (designer.RootClass(node.ID))
				result.push({Value: 'kind', Label: text('kind', {name: designer.Label(node.Kind)})});

			if (around && designer.RootClass(node.ID))
				result.push({Value: 'within', Label: text('within', {name: designer.Label(node.Kind), parent: designer.Label(around.Kind)})});

			return result;
		};

		this.Whens = function (language) {
			return language !== undefined ? options(['', 'hover', 'focus-visible', 'active', 'disabled'], 'when-') : [];
		};

		this.Wheres = function (language) {
			return language !== undefined ? options(['', 'tablet', 'phone'], 'where-') : [];
		};

		this.Schemes = function (language) {
			return language !== undefined ? options(['', 'light', 'dark'], 'scheme-') : [];
		};

		/* The properties of the rule of the context: [{Name, Value}]. */
		this.Props = function (node, who, when, where, scheme, version) {
			var rule = version >= 0 ? designer.Rule(self.Context(node, who, when, where, scheme)) : null;

			return rule ? Object.keys(rule.Props).map(function (name) {
				return {Name: name, Value: rule.Props[name]};
			}) : [];
		};

		/* The rules that reach the node in any context, named by it: [{Index, Text, Active}]. */
		this.Others = function (node, who, when, where, scheme, version) {
			var own = designer.RootClass(node.ID);

			return version >= 0 ? designer.Rules().map(function (rule, index) {
				return {Rule: rule, Index: index};
			}).filter(function (entry) {
				var rule = entry.Rule;

				return !rule.Raw && (rule.Who === 'node' ? rule.Node === node.ID : !!own && rule.Class === own);
			}).map(function (entry) {
				var rule = entry.Rule;
				var parts = [rule.Who === 'node' ? text('node') : rule.Who === 'kind' ? text('kind', {name: designer.Label(node.Kind)}) : text('within', {name: designer.Label(node.Kind), parent: rule.Parent})];

				if (rule.State)
					parts.push(':' + rule.State);

				if (rule.Width)
					parts.push(text('where-' + rule.Width));

				if (rule.Theme)
					parts.push(text('scheme-' + rule.Theme));

				return {Index: entry.Index, Text: parts.join(' · ') + ' (' + Object.keys(rule.Props).length + ')', Active: rule.Who === who && (rule.State || '') === when && (rule.Width || '') === where && (rule.Theme || '') === scheme};
			}) : [];
		};

		/* Texts as the options of a Combobox. */
		this.Options = function (values) {
			return values.map(function (value) {
				return {Value: value, Label: value};
			});
		};

		/* The names of the properties offered, and the tokens of the theme as values (any other text is taken too). */
		this.Properties = function () {
			return self.Options(['color', 'background', 'background-color', 'border', 'border-color', 'border-radius', 'border-width', 'box-shadow', 'opacity', 'font-size', 'font-weight', 'font-family', 'font-style', 'line-height', 'letter-spacing', 'text-align', 'text-transform', 'text-decoration', 'white-space', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'margin', 'padding', 'gap', 'display', 'flex', 'flex-direction', 'flex-wrap', 'align-items', 'align-self', 'justify-content', 'order', 'position', 'top', 'right', 'bottom', 'left', 'z-index', 'overflow', 'cursor', 'transform', 'transition', 'outline', 'filter', 'aspect-ratio', 'object-fit', 'visibility']);
		};

		this.Tokens = function (scheme) {
			return ['accent', 'accent-text', 'text', 'text-muted', 'background', 'surface', 'surface-hover', 'border', 'border-strong', 'success', 'warning', 'danger', 'info', 'radius-small', 'radius', 'radius-large', 'radius-pill', 'font-size-small', 'font-size', 'font-size-large', 'shadow-small', 'control-small', 'control', 'control-large'].map(function (name) {
				var value = 'var(--elemenx-' + name + ')';

				return {Value: value, Label: value, Hint: self.Computed(value, scheme)};
			});
		};

		/*
		 * The value a token of the theme (name: accent) takes in a scheme (light or dark, '' as it is) on the page of the
		 * canvas, where the page is, not in the theme of the builder around it.
		 */
		this.Resolve = function (name, scheme) {
			var host = document.querySelector('.elemenx-designer-page') || document.body;
			var probe = document.createElement('span');
			var value;

			if (scheme)
				probe.setAttribute('data-scheme', scheme);

			probe.hidden = true;

			host.appendChild(probe);

			value = window.getComputedStyle(probe).getPropertyValue('--elemenx-' + name).trim();

			host.removeChild(probe);

			return value;
		};

		/*
		 * What a value that holds tokens comes to: each token by its value in the scheme of the context, or in the light and
		 * the dark one when they differ (light · dark); '' for a value without a token.
		 */
		this.Computed = function (value, scheme) {
			var text = String(value || '');
			var names = text.match(/var\(--elemenx-[\w-]+\)/g);
			var light;
			var dark;

			function resolved (mode) {
				return text.replace(/var\(--elemenx-([\w-]+)\)/g, function (all, name) {
					return self.Resolve(name, mode) || all;
				});
			}

			if (!names) return '';

			if (scheme)
				return resolved(scheme);

			light = resolved('light');
			dark = resolved('dark');

			return light === dark ? light : light + ' · ' + dark;
		};

		designer.OnChange(changed);

		Elemenx.Locale.OnChange(changed);

		designer.Load();
	},

	$OnDestroy: function () {
		this.$Service('Designer').OffChange(this.Own());

		Elemenx.Locale.OffChange(this.Own());
	},

	Rule: function () {
		var designer = this.$Service('Designer');

		return this.Context(designer.Find(designer.Selected()), this.Who, this.When, this.Where, this.Scheme);
	},

	/* A field of the context changed: the select names it. */
	Contexted: function (value, control) {
		this[control.Name] = value || '';
	},

	/* The value of a property of the rule changed: its Combobox is named by the property. */
	Valued: function (value, control) {
		this.$Service('Designer').SetRule(this.Rule(), control.Name, value);
	},

	Removed: function (event, node) {
		this.$Service('Designer').SetRule(this.Rule(), node.getAttribute('data-property'), '');
	},

	PropertyChosen: function (value) {
		this.Property = value || '';
	},

	/* The value of the new property: chosen or typed, it adds the property when it has a name. */
	ValueChosen: function (value) {
		this.Value = value || '';

		this.Added();
	},

	/* A property added to the rule of the context, the fields of the new one emptied. */
	Added: function () {
		if (!String(this.Property).trim() || !String(this.Value).trim()) return;

		this.$Service('Designer').SetRule(this.Rule(), this.Property, this.Value);

		this.Property = '';
		this.Value = '';
	},

	/* A rule of the list pressed: its context in the fields. */
	Picked: function (event, node) {
		var rule = this.$Service('Designer').Rules()[Number(node.getAttribute('data-index'))];
		if (!rule) return;

		this.Who = rule.Who;
		this.When = rule.State || '';
		this.Where = rule.Width || '';
		this.Scheme = rule.Theme || '';
	}
});
