/*
 * The models of forms: the values a form collects and their validation, as the forms of Angular have them. A model is a
 * tree of plain objects, so a Component that keeps it in its state renders it as it changes:
 * - Control(value, validators): a value. Validators is a list of functions (control) -> null or {key: params} (the ones
 *   of Validators), or {Validators, Async, Disabled}: Async are functions (control, callback) that call back (errors or
 *   null) later; while they run the control is pending, and only the answer for its present value counts.
 * - Group({name: node}, validators): a named set of controls, groups and arrays; its validators see the whole group
 *   (Validators.Equal: two fields that must match). Array([node], validators): a list of them (Push, Insert, RemoveAt).
 * Every node has ID (a number of its own: the key of a list in a template), Value (setting it sets the value: a Group takes an object, an Array a list), Errors (null, or the
 * errors of its own validators), Valid, Invalid, Pending, Status (valid, invalid, pending, disabled), Touched, Dirty,
 * Disabled; Get(path) ('address.city', 'items.0' or a list of names), SetValue(value), Patch(value) (the names given
 * only), Reset(value) (back to the first value, or to this one: untouched and clean), Touch() (with all inside: the
 * errors show), Disable(), Enable(), Error(key), Message() (the phrase of its first error), Validate(callback) (calls
 * back (null, {Valid, Errors}) once nothing is pending: errors by the path of each invalid node), OnChange(listener) and
 * OffChange(listener) (listener(node) after a change of a value or a state inside). A disabled node is left out of the
 * value of its group and of its validity.
 * - Validators: Required, RequiredTrue, Email, Min(number), Max(number), MinLength(length), MaxLength(length),
 *   Pattern(expression or text), Equal(name, other) for a group, and Custom(key, test(value, control)).
 * - Message(errors): the phrase of the first error (ui.forms.<key>, ui.forms.invalid for a key without one), or the
 *   text an error gives itself ({key: 'text'}).
 * - The names of fields, as the forms of a server read them: Path(name) gives the parts of user[address][city] (or
 *   user.address.city), items[2][name] and tags[] (['tags', '']: the end of an array). Get takes them too.
 *   Place(group, path, node) puts a node at such a path, making the groups and arrays on the way (an array where the
 *   next part is an index or []): Value is then nested, {user: {address: {city}}, items: [{name}], tags: [...]}, an
 *   array without the places no field filled (items[5] alone is [value]). Detach(node) takes a node out (an array keeps
 *   the places of the others), and the groups and arrays Place made that are empty then.
 * Form and Field use these models: a Form gives Fields their controls by Name and validates them on submit.
 */
Elemenx.Service('Forms', {
	$Meta: {
		Description: 'The models of forms: the values a form collects and their validation, as the forms of Angular have them.',
		Methods: ['Control(value, validators)', 'Group(controls, validators)', 'Array(controls, validators)', 'Message(errors)', 'Path(name)', 'Place(group, path, node)', 'Detach(node)']
	},
	$OnCreate: function () {
		var self = this;

		function empty (value) {
			return value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length);
		}

		this.Validators = {
			Required: function (control) {
				return empty(control.Value) || control.Value === false ? {required: true} : null;
			},

			RequiredTrue: function (control) {
				return control.Value === true ? null : {required: true};
			},

			Email: function (control) {
				return empty(control.Value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(control.Value)) ? null : {email: true};
			},

			Min: function (min) {
				return function (control) {
					return empty(control.Value) || Number(control.Value) >= min ? null : {min: {min: min, actual: Number(control.Value)}};
				};
			},

			Max: function (max) {
				return function (control) {
					return empty(control.Value) || Number(control.Value) <= max ? null : {max: {max: max, actual: Number(control.Value)}};
				};
			},

			MinLength: function (length) {
				return function (control) {
					return empty(control.Value) || control.Value.length >= length ? null : {minLength: {length: length, actual: control.Value.length}};
				};
			},

			MaxLength: function (length) {
				return function (control) {
					return empty(control.Value) || control.Value.length <= length ? null : {maxLength: {length: length, actual: control.Value.length}};
				};
			},

			Pattern: function (pattern) {
				var expression = pattern instanceof RegExp ? pattern : new RegExp('^(?:' + pattern + ')$');

				return function (control) {
					return empty(control.Value) || expression.test(String(control.Value)) ? null : {pattern: {pattern: String(pattern)}};
				};
			},

			/* For a group: the value of name must equal the value of other (a password and its repetition). */
			Equal: function (name, other) {
				return function (group) {
					var first = group.Get(name);
					var second = group.Get(other);

					return !first || !second || first.Value === second.Value ? null : {equal: {name: name, other: other}};
				};
			},

			Custom: function (key, test) {
				return function (control) {
					var errors = {};

					if (test(control.Value, control)) return null;

					errors[key] = true;

					return errors;
				};
			}
		};

		/* The validators of a node: a list, a function, or {Validators, Async, Disabled}. */
		function options (value) {
			if (typeof value === 'function')
				return {Validators: [value], Async: []};

			if (Array.isArray(value))
				return {Validators: value, Async: []};

			value = value || {};

			return {Validators: [].concat(value.Validators || []), Async: [].concat(value.Async || []), Disabled: !!value.Disabled};
		}

		/* The errors of the validators of a node, merged, or null. */
		function run (node, validators) {
			var errors = null;

			validators.forEach(function (validator) {
				var result = validator(node);
				var key;

				for (key in result || {}) {
					if (Object.prototype.hasOwnProperty.call(result, key)) {
						errors = errors || {};
						errors[key] = result[key];
					}
				}
			});

			return errors;
		}

		/* The parts of a node all nodes share; they read their state through this, so a reactive copy tracks it. */
		var base = {
			get Valid () {
				return this.Status === 'valid';
			},

			get Invalid () {
				return this.Status === 'invalid';
			},

			get Pending () {
				return this.Status === 'pending';
			},

			Error: function (key) {
				return this.Errors && Object.prototype.hasOwnProperty.call(this.Errors, key) ? this.Errors[key] : null;
			},

			Message: function () {
				return self.Message(this.Errors);
			},

			Disable: function () {
				this.Disabled = true;

				this.Changed();
			},

			Enable: function () {
				this.Disabled = false;

				this.Changed();
			},

			OnChange: function (listener) {
				this.Listeners.push(listener);
			},

			OffChange: function (listener) {
				var index = this.Listeners.indexOf(listener);
				if (index !== -1)
					this.Listeners.splice(index, 1);
			},

			/* A change here: its listeners, then the ones of the nodes around it. */
			Changed: function () {
				var node = this;

				while (node) {
					node.Listeners.slice().forEach(function (listener) {
						listener(node);
					});

					node = node.Parent;
				}
			},

			Get: function (path) {
				var names = Array.isArray(path) ? path : self.Path(path);
				var node = this;
				var i = 0;

				while (node && i < names.length) {
					node = node.Controls && names[i] !== '' ? node.Controls[names[i]] || null : null;

					i++;
				}

				return node;
			},

			/* Calls back (null, {Valid, Errors}) once nothing inside is pending; Errors by the path of each invalid node. */
			Validate: function (callback) {
				var node = this;
				var errors = {};
				var waited = 0;

				function finish () {
					if (node.Pending && waited < 600) {
						waited++;

						window.setTimeout(finish, 50);

						return;
					}

					collect(node, '');

					callback(null, {Valid: node.Status === 'valid', Errors: errors});
				}

				function collect (item, path) {
					var key;

					if (item.Disabled) return;

					if (item.Errors)
						errors[path] = item.Errors;

					for (key in item.Controls || {}) {
						if (Object.prototype.hasOwnProperty.call(item.Controls, key))
							collect(item.Controls[key], path ? path + '.' + key : String(key));
					}
				}

				finish();
			}
		};

		var sequence = 0;

		/* A node: the shared parts, its own, and an ID of its own (the key of a list of nodes in a template). */
		function make (fields) {
			var node = Object.create(null);
			var key;

			node.ID = ++sequence;

			Object.defineProperties(node, Object.getOwnPropertyDescriptors(base));

			for (key in fields) {
				if (Object.prototype.hasOwnProperty.call(fields, key))
					Object.defineProperty(node, key, Object.getOwnPropertyDescriptor(fields, key));
			}

			return node;
		}

		this.Control = function (value, validators) {
			var settings = options(validators);
			var control = make({
				Kind: 'control',
				Initial: value,
				Stored: value,
				Validators: settings.Validators,
				Async: settings.Async,
				AsyncErrors: null,
				Waiting: 0,
				Sequence: 0,
				Touched: false,
				Dirty: false,
				Disabled: settings.Disabled,
				Parent: null,
				Listeners: [],

				get Value () {
					return this.Stored;
				},

				set Value (next) {
					this.SetValue(next);
				},

				get Errors () {
					return run(this, this.Validators) || this.AsyncErrors;
				},

				get Status () {
					if (this.Disabled)
						return 'disabled';

					if (run(this, this.Validators)) return 'invalid';

					if (this.Waiting)
						return 'pending';

					return this.AsyncErrors ? 'invalid' : 'valid';
				},

				SetValue: function (next) {
					this.Stored = next;
					this.Dirty = true;

					this.Check();
					this.Changed();
				},

				Patch: function (next) {
					this.SetValue(next);
				},

				Reset: function (next) {
					if (arguments.length)
						this.Initial = next;

					this.Stored = this.Initial;
					this.Touched = false;
					this.Dirty = false;

					this.Check();
					this.Changed();
				},

				Touch: function () {
					this.Touched = true;

					this.Changed();
				},

				/* The async validators, once the sync ones pass: only the answer for the value of now counts. */
				Check: function () {
					var control = this;
					var sequence = ++this.Sequence;
					var remaining = this.Async.length;
					var errors = null;

					this.AsyncErrors = null;
					this.Waiting = 0;

					if (!remaining || run(this, this.Validators)) return;

					this.Waiting = remaining;

					this.Async.forEach(function (validator) {
						validator(control, function (result) {
							var key;

							if (sequence !== control.Sequence) return;

							for (key in result || {}) {
								if (Object.prototype.hasOwnProperty.call(result, key)) {
									errors = errors || {};
									errors[key] = result[key];
								}
							}

							control.Waiting--;

							if (!control.Waiting)
								control.AsyncErrors = errors;

							control.Changed();
						});
					});
				}
			});

			control.Check();

			return control;
		};

		/* The shared part of a group and an array: their nodes are in Controls (an object, or a list). */
		function container (kind, controls, validators) {
			var settings = options(validators);
			var node = make({
				Kind: kind,
				Controls: controls,
				Validators: settings.Validators,
				Disabled: settings.Disabled,
				Parent: null,
				Listeners: [],

				get Value () {
					var value = kind === 'array' ? [] : {};
					var controls = this.Controls;

					this.Keys().forEach(function (key) {
						if (controls[key].Disabled) return;

						if (kind === 'array') value.push(controls[key].Value);
						else value[key] = controls[key].Value;
					});

					return value;
				},

				set Value (next) {
					this.SetValue(next);
				},

				get Errors () {
					return run(this, this.Validators);
				},

				get Status () {
					var controls = this.Controls;
					var statuses;

					if (this.Disabled)
						return 'disabled';

					if (run(this, this.Validators)) return 'invalid';

					statuses = this.Keys().map(function (key) {
						return controls[key].Status;
					});

					if (statuses.indexOf('invalid') !== -1) return 'invalid';
					if (statuses.indexOf('pending') !== -1) return 'pending';

					return 'valid';
				},

				get Touched () {
					var controls = this.Controls;

					return this.Keys().some(function (key) {
						return controls[key].Touched;
					});
				},

				get Dirty () {
					var controls = this.Controls;

					return this.Keys().some(function (key) {
						return controls[key].Dirty;
					});
				},

				/* The keys of the nodes: the names of a group; the indexes of an array that hold one (items[5] alone leaves 0 to 4 empty). */
				Keys: function () {
					var keys = [];

					if (kind !== 'array')
						return Object.keys(this.Controls);

					this.Controls.forEach(function (item, index) {
						keys.push(index);
					});

					return keys;
				},

				SetValue: function (next) {
					this.Patch(next);
				},

				/* The values given by name (a group), or in the order of the nodes (an array: its value has no empty places). */
				Patch: function (next) {
					var controls = this.Controls;

					this.Keys().forEach(function (key, order) {
						var at = kind === 'array' ? order : key;
						if (next && Object.prototype.hasOwnProperty.call(next, at))
							controls[key].Patch(next[at]);
					});
				},

				Reset: function (next) {
					var controls = this.Controls;

					this.Keys().forEach(function (key, order) {
						var at = kind === 'array' ? order : key;

						if (next && Object.prototype.hasOwnProperty.call(next, at)) controls[key].Reset(next[at]);
						else controls[key].Reset();
					});
				},

				Touch: function () {
					var controls = this.Controls;

					this.Keys().forEach(function (key) {
						controls[key].Touch();
					});
				},

				/* A node put in: it belongs to this one now. */
				Adopt: function (item) {
					item.Parent = this;

					return item;
				}
			});

			node.Keys().forEach(function (key) {
				controls[key].Parent = node;
			});

			return node;
		}

		this.Group = function (controls, validators) {
			var group = container('group', controls || {}, validators);

			group.Add = function (name, item) {
				this.Controls[name] = this.Adopt(item);

				this.Changed();

				return item;
			};

			group.Remove = function (name) {
				delete this.Controls[name];
				this.Changed();
			};

			return group;
		};

		this.Array = function (controls, validators) {
			var array = container('array', controls || [], validators);

			array.Push = function (item) {
				this.Controls.push(this.Adopt(item));
				this.Changed();

				return item;
			};

			array.Insert = function (index, item) {
				this.Controls.splice(index, 0, this.Adopt(item));
				this.Changed();

				return item;
			};

			array.RemoveAt = function (index) {
				this.Controls.splice(index, 1);
				this.Changed();
			};

			array.Clear = function () {
				this.Controls.splice(0, this.Controls.length);
				this.Changed();
			};

			return array;
		};

		/* Puts a node at a key of a group or an array: '' at the end of an array (tags[]). */
		function put (parent, key, item) {
			if (parent.Kind === 'array') {
				if (key === '')
					return parent.Push(item);

				parent.Controls[Number(key)] = parent.Adopt(item);

				parent.Changed();

				return item;
			}

			return parent.Add(key, item);
		}

		/*
		 * Puts a node at a path of a group (Path: user[address][city], items[2][name], tags[]), making the groups and the
		 * arrays on the way that are not there (an array where the next part is an index or []); they are Made, so
		 * Detach takes them away once empty.
		 */
		this.Place = function (group, path, item) {
			var names = Array.isArray(path) ? path : self.Path(path);
			var node = group;
			var child;
			var i = 0;

			while (i < names.length - 1) {
				child = names[i] === '' ? null : node.Controls[names[i]] || null;

				if (child && !child.Controls)
					throw new Error('Elemenx Forms: ' + names.slice(0, i + 1).join('.') + ' is a value, not a group, in ' + names.join('.'));

				if (!child) {
					child = names[i + 1] === '' || /^\d+$/.test(names[i + 1]) ? self.Array([]) : self.Group({});
					child.Made = true;

					put(node, names[i], child);
				}

				node = child;

				i++;
			}

			return put(node, names[names.length - 1], item);
		};

		/* Takes a node out of its group or array (an array keeps the places of the others), and the Made ones around it that are empty then. */
		this.Detach = function (item) {
			var parent = item.Parent;
			if (!parent) return;

			/* By ID: a node read through the state of a Component is a reactive copy, never the same object. */
			parent.Keys().forEach(function (key) {
				if (parent.Controls[key] && parent.Controls[key].ID === item.ID)
					delete parent.Controls[key];
			});

			item.Parent = null;

			if (parent.Made && !parent.Keys().length) self.Detach(parent);
			else parent.Changed();
		};
	},

	/*
	 * The parts of the name of a field: user[address][city] and user.address.city give ['user', 'address', 'city'],
	 * items[2][name] ['items', '2', 'name'], tags[] ['tags', ''] (the end of an array).
	 */
	Path: function (name) {
		var parts = [];
		var pattern = /\[([^\]]*)\]|([^.[\]]+)/g;
		var match;

		while ((match = pattern.exec(String(name)))) {
			parts.push(match[1] !== undefined ? match[1] : match[2]);
		}

		return parts;
	},

	/* The phrase of the first error: the text an error gives itself, or ui.forms.<key> with its params. */
	Message: function (errors) {
		var key;
		var value;
		var text;

		for (key in errors || {}) {
			if (!Object.prototype.hasOwnProperty.call(errors, key)) continue;

			value = errors[key];

			if (typeof value === 'string') return value;

			text = Elemenx.Locale.Text('ui.forms.' + key, value && typeof value === 'object' ? value : {});

			return text === 'ui.forms.' + key ? Elemenx.Locale.Text('ui.forms.invalid') : text;
		}

		return '';
	}
});
