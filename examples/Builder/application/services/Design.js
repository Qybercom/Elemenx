/*
 * The document of the builder: a tree of nodes, each a kind of the palette with its props, its text and its children,
 * under a root (the page). It changes through its methods only, each change kept in the history (Undo, Redo) and in the
 * storage of the browser, and listeners hear of every change (OnChange).
 *
 * - A node is {ID, Kind, Props, Text, Slot, Children}: Slot is the named slot of its parent it goes to (its attribute
 *   slot), '' for the default one. Kinds() lists the kinds of the palette by group; Kind(id) is one: {ID, Group, Icon,
 *   Tag, Container, Text, Flow, Props (the first values), Fields ([{Name, Type, Options}]), Slots (the named ones)};
 *   Slots(id) are the named slots of the parent of a node, Label(kind) the name of a kind in the language of the page.
 * - Insert(kind, parent, index), Move(id, parent, index), Remove(id), Duplicate(id), Set(id, name, value), Clear().
 * - Template() is the document as a template of Elemenx (what the builder exports); Template(true) the same for the
 *   canvas, every node in an element that names it (data-builder-id), and an empty container holding a place to drop.
 * - Import(text) reads a template back: the kinds of the palette where an element is one, and any other element as it is.
 */
Elemenx.Service('Design', {
	StorageKey: 'elemenx-builder:document',

	$OnCreate: function () {
		var self = this;
		var next = 1;
		var listeners = [];
		var past = [];
		var future = [];
		var root = {ID: 'root', Kind: 'root', Props: {}, Text: '', Children: []};
		var typing = {Key: '', Time: 0};

		/* The names of the components of an imported template, by the name HTML gives their elements (elemenx-c-<name>). */
		var named = {};
		var prefix = 'elemenx-c-';

		function list (text) {
			return String(text || '').split(',').map(function (item) {
				return item.trim();
			}).filter(Boolean);
		}

		function quote (text) {
			return String(text).replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
		}

		/* The options of a list field as an expression: [{Value: 'One', Label: 'One'}, ...]. */
		function options (text, value, label) {
			return '[' + list(text).map(function (item) {
				return '{' + value + ': \'' + quote(item) + '\', ' + label + ': \'' + quote(item) + '\'}';
			}).join(', ') + ']';
		}

		/*
		 * The kinds of the palette. A kind of classes (Base) is an element of the classes of ElemenxUI: its fields with a
		 * Class are its modifiers (a switch adds the class it names; a choice adds its value, after the Class when that is
		 * a prefix ending with -); its other fields are attributes. Items (a list field) of a kind with Inner become its
		 * children: the items of a list, the cells of a table. The components of the Library come from the Palette
		 * Service; the kinds of their own here (a card, a field...) take the other props of their component from it too.
		 */
		var sizes = ['', 'fill', 'fill-fixed', 'non-fill'];
		var kinds = [
			{ID: 'screen', Group: 'layout', Icon: 'monitor', Tag: 'div', Base: 'elemenx-screen', Container: true, Props: {}, Fields: []},
			{ID: 'row', Group: 'layout', Icon: 'columns', Tag: 'div', Base: 'elemenx-container', Container: true, Flow: 'row', Props: {Wrap: true, Centered: false, Sizing: '', Block: false}, Fields: [{Name: 'Wrap', Type: 'bool', Class: 'wrappable'}, {Name: 'Centered', Type: 'bool', Class: 'centered'}, {Name: 'Sizing', Type: 'select', Options: sizes, Class: true}, {Name: 'Block', Type: 'bool', Class: 'block'}]},
			{ID: 'column', Group: 'layout', Icon: 'list', Tag: 'div', Base: 'elemenx-column', Container: true, Props: {Sizing: ''}, Fields: [{Name: 'Sizing', Type: 'select', Options: sizes, Class: true}]},
			{ID: 'grid', Group: 'layout', Icon: 'grid', Tag: 'div', Base: 'elemenx-container grid', Container: true, Flow: 'row', Props: {}, Fields: []},
			{ID: 'panel', Group: 'layout', Icon: 'layout', Tag: 'div', Base: 'elemenx-panel', Container: true, Props: {Padding: ''}, Fields: [{Name: 'Padding', Type: 'select', Options: ['', 'compact', 'spacious'], Class: true}]},
			{ID: 'card', Group: 'layout', Icon: 'layout', Tag: 'Card', Container: true, Props: {Title: 'Card', Text: '', Variant: 'outlined'}, Fields: [{Name: 'Title', Type: 'text'}, {Name: 'Text', Type: 'text'}, {Name: 'Variant', Type: 'select', Options: ['outlined', 'elevated', 'flat', 'filled'], Default: 'outlined'}]},
			{ID: 'section', Group: 'layout', Icon: 'panel-left', Tag: 'Section', Container: true, Props: {Title: 'Section', Collapsible: false}, Fields: [{Name: 'Title', Type: 'text'}, {Name: 'Collapsible', Type: 'bool'}]},
			{ID: 'divider', Group: 'layout', Icon: 'remove', Tag: 'div', Base: 'elemenx-divider', Props: {Vertical: false}, Fields: [{Name: 'Vertical', Type: 'bool', Class: 'vertical'}]},
			{ID: 'spacer', Group: 'layout', Icon: 'more', Tag: 'span', Base: 'elemenx-spacer', Props: {}, Fields: []},
			{ID: 'gamepanel', Group: 'layout', Icon: 'trophy', Tag: 'div', Base: 'elemenx-game-panel', Container: true, Props: {Light: false}, Fields: [{Name: 'Light', Type: 'bool', Class: 'light'}]},

			{ID: 'heading', Group: 'text', Icon: 'heading', Tag: 'h2', Text: 'Heading', Props: {Level: '2'}, Fields: [{Name: 'Level', Type: 'select', Options: ['1', '2', '3', '4', '5', '6']}],
				TagOf: function (props) {
					return 'h' + (props.Level || '2');
				}},
			{ID: 'paragraph', Group: 'text', Icon: 'text-align-left', Tag: 'p', Base: '', Optional: 'elemenx-text', Text: 'A paragraph of text.', Props: {Size: '', Tone: '', Strong: false, Mono: false}, Fields: [{Name: 'Size', Type: 'select', Options: ['', 'small', 'large'], Class: true}, {Name: 'Tone', Type: 'select', Options: ['', 'muted', 'success', 'warning', 'danger'], Class: true}, {Name: 'Strong', Type: 'bool', Class: 'strong'}, {Name: 'Mono', Type: 'bool', Class: 'mono'}]},
			{ID: 'textstyle', Group: 'text', Icon: 'text-color', Tag: 'div', Base: '', Text: 'Title', Props: {Style: 'title'}, Fields: [{Name: 'Style', Type: 'select', Options: ['title', 'subtitle', 'eyebrow', 'caption', 'footnote', 'label'], Class: 'elemenx-'}]},
			{ID: 'callout', Group: 'text', Icon: 'info', Tag: 'div', Base: 'elemenx-callout', Text: 'Something worth knowing.', Props: {Tone: ''}, Fields: [{Name: 'Tone', Type: 'select', Options: ['', 'neutral', 'success', 'warning', 'danger'], Class: true}]},
			{ID: 'link', Group: 'text', Icon: 'link', Tag: 'a', Base: 'elemenx-link', Text: 'A link', Props: {Href: '#'}, Fields: [{Name: 'Href', Type: 'text'}]},
			{ID: 'badge', Group: 'text', Icon: 'bell', Tag: 'span', Base: 'elemenx-badge', Text: '3', Props: {Tone: '', Dot: false}, Fields: [{Name: 'Tone', Type: 'select', Options: ['', 'accent', 'info', 'success', 'warning', 'danger'], Class: true}, {Name: 'Dot', Type: 'bool', Class: 'dot'}]},
			{ID: 'kbd', Group: 'text', Icon: 'grid', Tag: 'kbd', Base: 'elemenx-kbd', Text: 'Ctrl', Props: {}, Fields: []},
			{ID: 'code', Group: 'text', Icon: 'code', Tag: 'pre', Base: 'elemenx-code', Text: 'var answer = 42;', Props: {}, Fields: []},
			{ID: 'bullets', Group: 'text', Icon: 'list-bulleted', Tag: 'ul', Base: 'elemenx-ul', Props: {Items: 'One, Two, Three', Check: false}, Fields: [{Name: 'Items', Type: 'list'}, {Name: 'Check', Type: 'bool', Class: 'check'}],
				Inner: function (props) {
					return list(props.Items).map(function (item) {
						return '<li>' + text(item) + '</li>';
					});
				}},
			{ID: 'numbers', Group: 'text', Icon: 'list-ordered', Tag: 'ol', Base: 'elemenx-ol', Props: {Items: 'One, Two, Three', Outline: false}, Fields: [{Name: 'Items', Type: 'list'}, {Name: 'Outline', Type: 'bool', Class: 'outline'}],
				Inner: function (props) {
					return list(props.Items).map(function (item) {
						return '<li>' + text(item) + '</li>';
					});
				}},
			{ID: 'chips', Group: 'text', Icon: 'tag', Tag: 'div', Base: 'elemenx-chips', Props: {Items: 'Design, Code, Docs'}, Fields: [{Name: 'Items', Type: 'list'}],
				Inner: function (props) {
					return list(props.Items).map(function (item) {
						return '<span class="elemenx-chip">' + text(item) + '</span>';
					});
				}},
			{ID: 'table', Group: 'text', Icon: 'table', Tag: 'table', Base: 'elemenx-table', Props: {Columns: 'Name, Role, Since', Rows: 3, Bordered: false, Striped: false, Compact: false, Sticky: false}, Fields: [{Name: 'Columns', Type: 'list'}, {Name: 'Rows', Type: 'number'}, {Name: 'Bordered', Type: 'bool', Class: 'bordered'}, {Name: 'Striped', Type: 'bool', Class: 'striped'}, {Name: 'Compact', Type: 'bool', Class: 'compact'}, {Name: 'Sticky', Type: 'bool', Class: 'sticky'}],
				Inner: function (props) {
					var columns = list(props.Columns);
					var rows = [];
					var i = 0;

					while (i < Math.max(0, Number(props.Rows) || 0)) {
						rows.push('\t<tr>' + columns.map(function () {
							return '<td>—</td>';
						}).join('') + '</tr>');

						i++;
					}

					return ['<thead>', '\t<tr>' + columns.map(function (column) {
						return '<th>' + text(column) + '</th>';
					}).join('') + '</tr>', '</thead>', '<tbody>'].concat(rows, ['</tbody>']);
				}},
			{ID: 'stats', Group: 'text', Icon: 'list', Tag: 'dl', Base: 'elemenx-game-stats', Props: {Items: 'Attack: 1017, Defense: 1162', Double: false}, Fields: [{Name: 'Items', Type: 'list'}, {Name: 'Double', Type: 'bool', Class: 'double'}],
				Inner: function (props) {
					return list(props.Items).map(function (item) {
						var parts = item.split(':');

						return '<dt>' + text(parts[0].trim()) + '</dt><dd>' + text(parts.slice(1).join(':').trim()) + '</dd>';
					});
				}},
			{ID: 'document', Group: 'text', Icon: 'file-text', Tag: 'div', Base: 'elemenx-document', Container: true, Props: {}, Fields: []},

			{ID: 'field', Group: 'inputs', Icon: 'edit', Tag: 'Field', Container: true, Props: {Label: 'Label', Hint: ''}, Fields: [{Name: 'Label', Type: 'text'}, {Name: 'Hint', Type: 'text'}]},
			{ID: 'input', Group: 'inputs', Icon: 'edit', Tag: 'Input', Props: {Placeholder: 'Text', Type: 'text'}, Fields: [{Name: 'Placeholder', Type: 'text'}, {Name: 'Type', Type: 'select', Options: ['text', 'email', 'password', 'search', 'tel', 'url'], Default: 'text'}]},
			{ID: 'textarea', Group: 'inputs', Icon: 'text-align-justify', Tag: 'TextArea', Props: {Placeholder: '', Rows: 3}, Fields: [{Name: 'Placeholder', Type: 'text'}, {Name: 'Rows', Type: 'number'}]},
			{ID: 'select', Group: 'inputs', Icon: 'chevrons-up-down', Tag: 'Select', Props: {Placeholder: 'Choose', Options: 'One, Two, Three'}, Fields: [{Name: 'Placeholder', Type: 'text'}, {Name: 'Options', Type: 'list'}]},
			{ID: 'checkbox', Group: 'inputs', Icon: 'check', Tag: 'Checkbox', Props: {Label: 'Check me', Checked: false}, Fields: [{Name: 'Label', Type: 'text'}, {Name: 'Checked', Type: 'bool'}]},
			{ID: 'toggle', Group: 'inputs', Icon: 'sliders', Tag: 'Toggle', Props: {Label: 'Switch me', Checked: false}, Fields: [{Name: 'Label', Type: 'text'}, {Name: 'Checked', Type: 'bool'}]},
			{ID: 'radio', Group: 'inputs', Icon: 'list-bulleted', Tag: 'RadioGroup', Props: {Options: 'One, Two', Variant: 'default'}, Fields: [{Name: 'Options', Type: 'list'}, {Name: 'Variant', Type: 'select', Options: ['default', 'horizontal', 'tile', 'segmented'], Default: 'default'}]},
			{ID: 'slider', Group: 'inputs', Icon: 'sliders', Tag: 'Slider', Props: {Value: 50, Min: 0, Max: 100}, Fields: [{Name: 'Value', Type: 'number'}, {Name: 'Min', Type: 'number'}, {Name: 'Max', Type: 'number'}]},
			{ID: 'date', Group: 'inputs', Icon: 'calendar', Tag: 'DateInput', Props: {Placeholder: ''}, Fields: [{Name: 'Placeholder', Type: 'text'}]},

			{ID: 'button', Group: 'buttons', Icon: 'launcher', Tag: 'Button', Props: {Label: 'Button', Variant: 'secondary', Size: 'medium', Icon: '', Block: false}, Fields: [{Name: 'Label', Type: 'text'}, {Name: 'Variant', Type: 'select', Options: ['primary', 'secondary', 'ghost', 'danger', 'link'], Default: 'secondary'}, {Name: 'Size', Type: 'select', Options: ['small', 'medium', 'large', 'giant'], Default: 'medium'}, {Name: 'Icon', Type: 'text'}, {Name: 'Block', Type: 'bool'}]},
			{ID: 'buttongroup', Group: 'buttons', Icon: 'columns', Tag: 'ButtonGroup', Container: true, Flow: 'row', Props: {Attached: false}, Fields: [{Name: 'Attached', Type: 'bool'}]},

			{ID: 'icon', Group: 'display', Icon: 'star', Tag: 'Icon', Props: {Name: 'star', Size: 24}, Fields: [{Name: 'Name', Type: 'text'}, {Name: 'Size', Type: 'number'}]},
			{ID: 'avatar', Group: 'display', Icon: 'user', Tag: 'Avatar', Props: {Name: 'Ada Lovelace', Size: 'medium', Status: ''}, Fields: [{Name: 'Name', Type: 'text'}, {Name: 'Size', Type: 'select', Options: ['small', 'medium', 'large'], Default: 'medium'}, {Name: 'Status', Type: 'select', Options: ['', 'online', 'away', 'busy', 'offline']}]},
			{ID: 'image', Group: 'display', Icon: 'image', Tag: 'Image', Props: {Src: '', Alt: '', Ratio: '16:9'}, Fields: [{Name: 'Src', Type: 'text'}, {Name: 'Alt', Type: 'text'}, {Name: 'Ratio', Type: 'text'}]},
			{ID: 'progress', Group: 'display', Icon: 'loader', Tag: 'Progress', Props: {Value: 40, Variant: 'bar'}, Fields: [{Name: 'Value', Type: 'number'}, {Name: 'Variant', Type: 'select', Options: ['bar', 'ring'], Default: 'bar'}]},
			{ID: 'rating', Group: 'display', Icon: 'star-filled', Tag: 'Rating', Props: {Value: 3}, Fields: [{Name: 'Value', Type: 'number'}]},
			{ID: 'spinner', Group: 'display', Icon: 'loader', Tag: 'Spinner', Props: {}, Fields: []},
			{ID: 'tabs', Group: 'display', Icon: 'panel-bottom', Tag: 'Tabs', Props: {Tabs: 'One, Two, Three'}, Fields: [{Name: 'Tabs', Type: 'list'}]},
			{ID: 'empty', Group: 'display', Icon: 'folder-open', Tag: 'EmptyState', Props: {Title: 'Nothing here', Description: '', Icon: 'folder-open'}, Fields: [{Name: 'Title', Type: 'text'}, {Name: 'Description', Type: 'text'}, {Name: 'Icon', Type: 'text'}]},

			/* Not in the palette: what an imported template holds besides the kinds above, kept as it is. */
			{ID: 'element', Group: '', Icon: 'code', Tag: 'div', Container: true, Props: {Tag: 'div', Attributes: ''}, Fields: [{Name: 'Tag', Type: 'text'}, {Name: 'Attributes', Type: 'text'}]},
			{ID: 'text', Group: '', Icon: 'text-color', Tag: '', Text: '', Props: {}, Fields: []}
		];

		var byID = {};

		var palette = self.$Service('Palette');

		/* The components of the Library, and the props of their components for the kinds of their own here. */
		kinds = kinds.concat(palette.Kinds);

		kinds.forEach(function (kind) {
			byID[kind.ID] = kind;

			if (kind.Component || !palette.Fields[kind.Tag]) return;

			kind.Slots = palette.Slots[kind.Tag] || [];

			palette.Fields[kind.Tag].forEach(function (field) {
				if (kind.Fields.some(function (own) {
					return own.Name.toLowerCase() === field.Name.toLowerCase();
				})) return;

				kind.Fields.push(field);

				kind.Props[field.Name] = field.Default;
			});
		});

		/* The values of the list fields as the expressions of the props they become. */
		var lists = {
			Select: function (text) {
				return options(text, 'Value', 'Label');
			},
			RadioGroup: function (text) {
				return options(text, 'Value', 'Label');
			},
			Tabs: function (text) {
				return options(text, 'ID', 'Label');
			}
		};

		function clone (value) {
			return JSON.parse(JSON.stringify(value));
		}

		function find (node, id) {
			var i = 0;
			var found;

			if (node.ID === id) return node;

			while (i < node.Children.length) {
				found = find(node.Children[i], id);

				if (found)
					return found;

				i++;
			}

			return null;
		}

		function parentOf (node, id) {
			var i = 0;
			var found;

			while (i < node.Children.length) {
				if (node.Children[i].ID === id) return node;

				found = parentOf(node.Children[i], id);

				if (found)
					return found;

				i++;
			}

			return null;
		}

		function renumber (node) {
			node.ID = 'n' + next++;

			node.Children.forEach(renumber);

			return node;
		}

		function highest (node) {
			var number = Number(String(node.ID).substring(1)) || 0;

			node.Children.forEach(function (child) {
				number = Math.max(number, highest(child));
			});

			return number;
		}

		function create (kind) {
			var definition = byID[kind];

			return {ID: 'n' + next++, Kind: kind, Props: clone(definition.Props), Text: definition.Text || '', Slot: '', Children: []};
		}

		function save () {
			try {
				window.localStorage.setItem(self.StorageKey, JSON.stringify(root));
			}
			catch (error) {
				return;
			}
		}

		function changed () {
			save();

			listeners.slice().forEach(function (listener) {
				listener(self);
			});
		}

		/* Keeps the document as it was before a change, for Undo. */
		function remember () {
			typing.Key = '';

			past.push(JSON.stringify(root));

			if (past.length > 100)
				past.shift();

			future = [];
		}

		function escape (text) {
			return String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}

		function text (value) {
			return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{\{/g, '{{ \'{{\' }}');
		}

		/* The classes of a node of a kind of classes: its Base, then its modifiers (and Optional with them). */
		function classes (definition, props) {
			var result = [];
			var modifiers = [];

			if (definition.Base === undefined) return '';

			definition.Fields.forEach(function (field) {
				var value = props[field.Name];
				if (!field.Class || !value) return;

				if (field.Type === 'bool') modifiers.push(field.Class);
				else modifiers.push((field.Class === true ? '' : field.Class) + value);
			});

			if (definition.Base)
				result.push(definition.Base);

			if (modifiers.length && definition.Optional)
				result.push(definition.Optional);

			return result.concat(modifiers).join(' ');
		}

		/*
		 * The props a list of classes gives a kind of classes, and how many of the classes it took; null when a class is
		 * not its own (the element is kept as it is, so nothing of it is lost).
		 */
		function unclass (definition, names) {
			var props = {};
			var taken = 0;
			var known = (definition.Base ? definition.Base.split(' ') : []).concat(definition.Optional ? [definition.Optional] : []);
			var lost = false;

			names.forEach(function (name) {
				var found = false;

				if (!name || known.indexOf(name) !== -1) return;

				definition.Fields.forEach(function (field) {
					var prefix = field.Class === true ? '' : field.Class;

					if (found || !field.Class) return;

					if (field.Type === 'bool' && field.Class === name) {
						props[field.Name] = true;
						found = true;
					}
					else if (field.Type === 'select' && name.indexOf(prefix) === 0 && field.Options.indexOf(name.substring(prefix.length)) !== -1) {
						props[field.Name] = name.substring(prefix.length);
						found = true;
					}
				});

				if (found) taken++;
				else lost = true;
			});

			return lost ? null : {Props: props, Taken: taken};
		}

		/*
		 * The attributes of a node: its classes, then its props (a number, a list or an expression as a binding; a prop
		 * at its default, or false or empty without one, left out). The modifiers of a kind of classes are classes, its
		 * other fields attributes of HTML; the fields of a kind with Inner are its children. The attributes of an imported
		 * element stay as they are, but on the canvas, where its bindings, events and directives would name a state that
		 * is not there.
		 */
		function attributes (node, definition, canvas) {
			var result = [];
			var names = classes(definition, node.Props);
			var kept;

			if (node.Slot && !canvas)
				result.push('slot="' + escape(node.Slot) + '"');

			if (names)
				result.push('class="' + names + '"');

			if (node.Kind === 'element' && node.Props.Attributes) {
				kept = canvas ? (node.Props.Attributes.match(/[^\s=]+(="[^"]*")?/g) || []).filter(function (attribute) {
					return !/^[[(*.]/.test(attribute);
				}).join(' ') : node.Props.Attributes;

				if (kept)
					result.push(kept);
			}

			definition.Fields.forEach(function (field) {
				var value = node.Props[field.Name];
				var name = definition.Base === undefined ? field.Name : field.Name.toLowerCase();

				if (field.Class || definition.TagOf || definition.Inner || node.Kind === 'element') return;

				if (value === null || value === undefined) return;

				if (field.Default !== undefined ? value === field.Default : value === '' || value === false) return;

				if (field.Type === 'json') {
					if (String(value).trim())
						result.push('[' + field.Name.toLowerCase() + ']="' + escape(String(value).trim()) + '"');

					return;
				}

				if (field.Type === 'list') {
					result.push('[' + field.Name.toLowerCase() + ']="' + escape(lists[definition.Tag](value)) + '"');

					return;
				}

				if (field.Type === 'number') {
					result.push('[' + field.Name.toLowerCase() + ']="' + (Number(value) || 0) + '"');

					return;
				}

				result.push(name + '="' + escape(value === true ? 'true' : value === false ? 'false' : value) + '"');
			});

			return result.length ? ' ' + result.join(' ') : '';
		}

		function tagOf (node, definition) {
			if (node.Kind === 'element')
				return node.Props.Tag || 'div';

			return definition.TagOf ? definition.TagOf(node.Props) : definition.Tag;
		}

		/* Whether a node is text, or an element of text (<b>, <a>...) holding only such nodes: it stays on the line of its parent. */
		function inline (node) {
			if (node.Kind === 'text') return true;

			return node.Kind === 'element' && /^(a|abbr|b|br|code|em|i|kbd|mark|s|small|span|strong|sub|sup|u)$/.test(node.Props.Tag) && node.Children.every(inline);
		}

		/* A node on one line, without indentation: text, or an element of text with its content. */
		function line (node) {
			var definition = byID[node.Kind] || byID.element;
			var tag = tagOf(node, definition);

			if (node.Kind === 'text') return text(node.Text);

			return '<' + tag + attributes(node, definition, false) + '>' + node.Children.map(line).join(' ') + '</' + tag + '>';
		}

		function render (node, depth, canvas, empty) {
			var definition = byID[node.Kind] || byID.element;
			var indent = new Array(depth + 1).join('\t');
			var tag = tagOf(node, definition);
			var open;
			var inner;
			var markup;

			if (node.Kind === 'text') {
				markup = indent + text(node.Text);
			}
			else if (!canvas && node.Kind === 'element' && node.Children.length && node.Children.every(inline)) {
				markup = indent + '<' + tag + attributes(node, definition, false) + '>' + node.Children.map(line).join(' ') + '</' + tag + '>';
			}
			else {
				open = '<' + tag + attributes(node, definition, canvas);
				inner = definition.Inner ? definition.Inner(node.Props).map(function (child) {
					return indent + '\t' + child;
				}) : node.Children.map(function (child) {
					return render(child, depth + 1, canvas, empty);
				});

				if (canvas && definition.Container && !node.Children.length)
					inner.push(indent + '\t<div class="builder-empty">' + text(empty) + '</div>');

				if (node.Text) markup = indent + open + '>' + text(node.Text) + '</' + tag + '>';
				else if (inner.length) markup = indent + open + '>\n' + inner.join('\n') + '\n' + indent + '</' + tag + '>';
				else markup = indent + open + (/^[A-Z]/.test(tag) ? ' />' : '></' + tag + '>');
			}

			if (!canvas)
				return markup;

			/* On the canvas the slot of a node is on its wrapper, the child of the component that places it. */
			return indent + '<div class="builder-node" data-builder-id="' + node.ID + '"' + (node.Slot ? ' slot="' + escape(node.Slot) + '"' : '') + '>\n' + markup + '\n' + indent + '</div>';
		}

		/* A value of an imported binding: a number, true or false, or the labels of a list of options. */
		function binding (expression) {
			var labels = [];
			var pattern = /Label\s*:\s*'((?:[^'\\]|\\.)*)'/g;
			var match;

			expression = expression.trim();

			if (/^-?\d+(\.\d+)?$/.test(expression)) return Number(expression);

			if (expression === 'true' || expression === 'false') return expression === 'true';

			match = pattern.exec(expression);
			while (match) {
				labels.push(match[1].replace(/\\(.)/g, '$1'));

				match = pattern.exec(expression);
			}

			return labels.join(', ');
		}

		/* The kind of an imported element: one of the palette, or none (it is kept as an element). */
		function kindOf (element) {
			var tag = element.tagName.toLowerCase();
			var classes = (element.getAttribute('class') || '').split(/\s+/).filter(Boolean);
			var found = null;
			var score = -1;

			if (tag.indexOf(prefix) === 0) {
				tag = tag.substring(prefix.length);

				kinds.forEach(function (kind) {
					if (!found && kind.Group && /^[A-Z]/.test(kind.Tag) && kind.Tag.toLowerCase() === tag)
						found = kind.ID;
				});

				return found;
			}

			if (/^h[1-6]$/.test(tag)) return 'heading';

			/* A kind of classes of this tag whose Base the element has and whose modifiers are all its other classes. */
			kinds.forEach(function (kind) {
				var base = kind.Base ? kind.Base.split(' ') : [];
				var match;

				if (kind.Base === undefined || !kind.Group || kind.Tag !== tag || !base.every(function (name) {
					return classes.indexOf(name) !== -1;
				})) return;

				match = unclass(kind, classes);

				if (!match || (!base.length && !match.Taken && kind.ID !== 'paragraph')) return;

				if (base.length * 10 + match.Taken > score) {
					found = kind.ID;
					score = base.length * 10 + match.Taken;
				}
			});

			return found;
		}

		/* The name of an element in the template it came from: a component keeps the letters it was written with. */
		function nameOf (element) {
			var tag = element.tagName.toLowerCase();

			return tag.indexOf(prefix) === 0 ? named[tag] || tag.substring(prefix.length) : tag;
		}

		function read (element) {
			var kind = kindOf(element);
			var node;
			var definition;
			var classes;
			var kept = [];
			var values;

			if (!kind) {
				node = create('element');

				node.Props.Tag = nameOf(element);
				node.Slot = element.getAttribute('slot') || '';

				Array.prototype.forEach.call(element.attributes, function (attribute) {
					if (attribute.name !== 'slot')
						kept.push(attribute.name + '="' + escape(attribute.value) + '"');
				});

				node.Props.Attributes = kept.join(' ');
				node.Children = children(element);

				return node;
			}

			node = create(kind);
			node.Slot = element.getAttribute('slot') || '';
			definition = byID[kind];
			classes = (element.getAttribute('class') || '').split(/\s+/);

			if (kind === 'heading')
				node.Props.Level = element.tagName.substring(1);

			/* A kind of classes: its modifiers from the classes (each one off unless the element has it), its children from Read. */
			if (definition.Base !== undefined) {
				definition.Fields.forEach(function (field) {
					if (field.Class)
						node.Props[field.Name] = field.Type === 'bool' ? false : '';
				});

				values = unclass(definition, classes.filter(Boolean)).Props;

				Object.keys(values).forEach(function (name) {
					node.Props[name] = values[name];
				});
			}

			if (definition.Inner) {
				values = items(definition, element);

				Object.keys(values).forEach(function (name) {
					node.Props[name] = values[name];
				});
			}

			if (!definition.TagOf && !definition.Inner) {
				definition.Fields.forEach(function (field) {
					var name = field.Name.toLowerCase();

					if (field.Class) return;

					/* A prop the element does not set has the default of its component, not the first value of the palette. */
					if (field.Default !== undefined) node.Props[field.Name] = field.Default;
					else node.Props[field.Name] = field.Type === 'bool' ? false : field.Type === 'number' ? null : '';

					Array.prototype.forEach.call(element.attributes, function (attribute) {
						var key = attribute.name.toLowerCase();

						if (key === name) node.Props[field.Name] = field.Type === 'bool' ? attribute.value !== 'false' : field.Type === 'number' ? Number(attribute.value) || 0 : attribute.value;
						else if (key === '[' + name + ']') node.Props[field.Name] = field.Type === 'json' ? attribute.value : binding(attribute.value);
					});
				});
			}

			if (definition.Text !== undefined) node.Text = element.textContent.trim();
			else if (definition.Container) node.Children = children(element);

			return node;
		}

		/* The children of a kind with Inner read back into its fields: the items of a list, the columns and rows of a table. */
		function items (definition, element) {
			var texts = function (selector) {
				return Array.prototype.map.call(element.querySelectorAll(selector), function (node) {
					return node.textContent.trim();
				});
			};

			if (definition.ID === 'table')
				return {Columns: texts('th').join(', '), Rows: element.querySelectorAll('tbody tr').length};

			if (definition.ID === 'stats')
				return {Items: texts('dt').map(function (name, index) {
					return name + ': ' + (texts('dd')[index] || '');
				}).join(', ')};

			return {Items: texts(definition.ID === 'chips' ? '.elemenx-chip' : 'li').join(', ')};
		}

		function children (element) {
			var result = [];

			Array.prototype.forEach.call(element.childNodes, function (child) {
				var node;

				if (child.nodeType === 1) {
					result.push(read(child));

					return;
				}

				if (child.nodeType === 3 && child.nodeValue.trim()) {
					node = create('text');
					node.Text = child.nodeValue.trim();

					result.push(node);
				}
			});

			return result;
		}

		this.Kinds = function () {
			return palette.Groups.map(function (group) {
				return {ID: group, Kinds: kinds.filter(function (kind) {
					return kind.Group === group;
				})};
			});
		};

		this.Kind = function (id) {
			return byID[id] || null;
		};

		/* The name of a kind in the language of the page: a component of the Library by its own name. */
		/* The named slots of the parent of a node, where it may go instead of the default slot. */
		this.Slots = function (id) {
			var parent = parentOf(root, id);
			var kind = parent && byID[parent.Kind];

			return kind && kind.Slots ? kind.Slots : [];
		};

		this.Label = function (id) {
			var kind = byID[id];

			return kind && kind.Component ? kind.ID : Elemenx.Locale.Text('builder.kinds.' + id);
		};

		this.Root = function () {
			return root;
		};

		this.Find = function (id) {
			return find(root, id);
		};

		this.Parent = function (id) {
			return parentOf(root, id);
		};

		/* Whether a node may hold children: the root and the containers. */
		this.Container = function (id) {
			var node = find(root, id);

			return !!node && (node.Kind === 'root' || !!(byID[node.Kind] && byID[node.Kind].Container));
		};

		/* Whether id is the node within or one inside it (a node cannot move into itself). */
		this.Within = function (id, within) {
			var node = find(root, within);

			return !!node && !!find(node, id);
		};

		this.Insert = function (kind, parent, index) {
			var target = find(root, parent || 'root');
			var node;

			if (!byID[kind] || !target || !this.Container(target.ID)) return null;

			remember();

			node = create(kind);

			target.Children.splice(index === undefined || index < 0 ? target.Children.length : Math.min(index, target.Children.length), 0, node);

			changed();

			return node.ID;
		};

		this.Move = function (id, parent, index) {
			var node = find(root, id);
			var from = parentOf(root, id);
			var target = find(root, parent || 'root');
			var at;

			if (!node || !from || !target || !this.Container(target.ID) || find(node, target.ID)) return false;

			at = from.Children.indexOf(node);

			if (from === target && (index === at || index === at + 1)) return false;

			remember();

			from.Children.splice(at, 1);

			if (from === target && index > at)
				index--;

			target.Children.splice(index === undefined || index < 0 ? target.Children.length : Math.min(index, target.Children.length), 0, node);

			changed();

			return true;
		};

		this.Remove = function (id) {
			var from = parentOf(root, id);
			if (!from)
				return false;

			remember();

			from.Children.splice(from.Children.indexOf(find(root, id)), 1);

			changed();

			return true;
		};

		this.Duplicate = function (id) {
			var node = find(root, id);
			var from = parentOf(root, id);
			var copy;

			if (!node || !from) return null;

			remember();

			copy = renumber(clone(node));

			from.Children.splice(from.Children.indexOf(node) + 1, 0, copy);

			changed();

			return copy.ID;
		};

		/*
		 * Sets a prop of a node, its Text with the name Text (for a kind that has text of its own) or its Slot with the
		 * name Slot; the changes of one prop typed in a row are one step of Undo.
		 */
		this.Set = function (id, name, value) {
			var node = find(root, id);
			var text = name === 'Text' && byID[node ? node.Kind : ''] && byID[node.Kind].Text !== undefined;
			var key = id + ' ' + name;
			var now = Date.now();

			if (!node || (text ? node.Text : name === 'Slot' ? node.Slot || '' : node.Props[name]) === value) return;

			if (typing.Key !== key || now - typing.Time > 1500)
				remember();

			typing.Key = key;
			typing.Time = now;

			if (text) node.Text = value;
			else if (name === 'Slot') node.Slot = value;
			else node.Props[name] = value;

			changed();
		};

		this.Clear = function () {
			if (!root.Children.length) return;

			remember();

			root.Children = [];

			changed();
		};

		this.CanUndo = function () {
			return past.length > 0;
		};

		this.CanRedo = function () {
			return future.length > 0;
		};

		this.Undo = function () {
			if (!past.length) return;

			typing.Key = '';

			future.push(JSON.stringify(root));

			root = JSON.parse(past.pop());

			changed();
		};

		this.Redo = function () {
			if (!future.length) return;

			typing.Key = '';

			past.push(JSON.stringify(root));

			root = JSON.parse(future.pop());

			changed();
		};

		/* The document as a template; for the canvas (canvas true) every node is wrapped and an empty container says so. */
		this.Template = function (canvas, empty) {
			return root.Children.map(function (node) {
				return render(node, 0, !!canvas, empty || '');
			}).join('\n');
		};

		/* Reads a template into the document, in place of what it held; false when the text holds no element. */
		this.Import = function (source) {
			var template = document.createElement('template');
			var nodes;
			var elements;

			/*
			 * HTML reads the name of an element in small letters, and some of them as its own (<Image> as <img>, <Section>
			 * as <section>): a component (a name with a capital) is read under a name of its own, elemenx-c-<name>. A
			 * self-closed element (<Input />) is closed as HTML closes it: <Input></Input>.
			 */
			named = {};

			template.innerHTML = String(source || '').replace(/<(\/?)([A-Z][\w-]*)/g, function (all, slash, tag) {
				named[prefix + tag.toLowerCase()] = tag;

				return '<' + slash + prefix + tag;
			}).replace(/<([A-Za-z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)\s*\/>/g, function (all, tag, rest) {
				return /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/.test(tag) ? all : '<' + tag + rest + '></' + tag + '>';
			});
			nodes = children(template.content);
			elements = nodes.filter(function (node) {
				return node.Kind !== 'text';
			});

			if (!elements.length) return false;

			remember();

			root.Children = nodes;

			changed();

			return true;
		};

		this.OnChange = function (listener) {
			listeners.push(listener);
		};

		this.OffChange = function (listener) {
			var index = listeners.indexOf(listener);
			if (index !== -1)
				listeners.splice(index, 1);
		};

		try {
			if (window.localStorage.getItem(this.StorageKey))
				root = JSON.parse(window.localStorage.getItem(this.StorageKey));
		}
		catch (error) {
			root = {ID: 'root', Kind: 'root', Props: {}, Text: '', Children: []};
		}

		next = highest(root) + 1;
	}
});
