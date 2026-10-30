/*
 * The kinds of the objects of a game, made of three axes: what a kind extends (Extends, one base), what it can do
 * (Traits: {Name: params}, each the data of a system of the scene: Orbit, Surface, Model, Mover...) and what it is made
 * of (Parts: [{ID, Kind, Position, Rotation, Traits...}], each an object of its own, placed in its parent). The same
 * rules merge them as the Components of the framework merge their layers: the later wins a value, Traits merge by their
 * name and then by their fields, Parts by their ID.
 * - Define(name, kind) registers a kind {Extends, Traits, Parts, Values} (Values: the plain fields of its objects:
 *   Name, Team, Radius...); Get(name) returns it as it was given, Has(name), Names().
 * - Resolve(name) returns a kind made whole: {Name, Chain (its bases, the farthest first), Traits, Parts, Values}.
 * - Make(kind, props) makes an object of a kind: {ID, Kind, Values, Traits, Parts: [objects]}; props are fields of its
 *   own ({ID, Name, Team...}), Traits of its own over the ones of its kind and Parts of its own over the parts of the
 *   kind (by ID; a part {ID, Removed: true} takes one away). A part of an object has the address parent/part.
 * - Field(object, name) finds a field in any case (radius is Radius) among its Values and the params of its Traits,
 *   or the name of a trait and its field together (surfacetype is the Type of Surface): {Trait, Name} or null;
 *   Fields(kind) lists them.
 * - Diff(object) is what a saved game keeps: the kind and what differs from it ({ID, Kind, Values, Traits, Parts});
 *   Restore(saved) makes the object again.
 * Kinds that are not defined throw: 'Elemenx Kinds: unknown kind <name>'; a kind that extends itself through others:
 * 'Elemenx Kinds: <name> extends itself: a, b, a'. The same functions run in Node: they read no page.
 */
Elemenx.Service('Kinds', {
	$Meta: {
		Description: 'The kinds of the objects of a game: what they extend, what they can do (Traits) and what they are made of (Parts).',
		Methods: ['Define(name, kind)', 'Get(name)', 'Has(name)', 'Names()', 'Resolve(name)', 'Make(kind, props)', 'Field(object, name)', 'Fields(kind)', 'Diff(object)', 'Restore(saved)']
	},

	$OnCreate: function () {
		this.Registry = {};
	},

	Define: function (name, kind) {
		if (typeof name !== 'string' || !name || !kind || typeof kind !== 'object')
			throw new Error('Elemenx Kinds: Define expects (name, kind)');

		if (!this.Registry)
			this.Registry = {};

		this.Registry[name] = kind;

		return name;
	},

	Get: function (name) {
		return this.Registry && this.Registry[name] ? this.Registry[name] : null;
	},

	Has: function (name) {
		return !!this.Get(name);
	},

	Names: function () {
		return Object.keys(this.Registry || {});
	},

	/* A copy that a change of an object cannot carry back to its kind. */
	Copy: function (value) {
		return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
	},

	/* Traits of two layers: the later wins a field of a trait it names, a trait false takes it away. */
	MergeTraits: function (under, over) {
		var result = this.Copy(under || {});

		Object.keys(over || {}).forEach(function (name) {
			if (over[name] === false || over[name] === null) {
				delete result[name];

				return;
			}

			result[name] = Object.assign({}, result[name] || {}, over[name] === true ? {} : over[name]);
		});

		return result;
	},

	/* Parts of two layers, by their ID: the later one changes a part it names, {ID, Removed: true} takes it away. */
	MergeParts: function (under, over) {
		var self = this;
		var result = (under || []).map(function (part) {
			return self.Copy(part);
		});

		(over || []).forEach(function (part, index) {
			var id = part.ID !== undefined ? String(part.ID) : 'part-' + (result.length + index);
			var found = result.filter(function (each) {
				return String(each.ID) === id;
			})[0];

			/* Taken away: and the mark kept when it is not here yet, for a layer under this one (the kind of an object). */
			if (part.Removed) {
				result = result.filter(function (each) {
					return String(each.ID) !== id;
				});

				if (!found)
					result.push({ID: id, Removed: true});

				return;
			}

			if (!found) {
				result.push(Object.assign(self.Copy(part), {ID: id}));

				return;
			}

			Object.keys(part).forEach(function (key) {
				if (key === 'Traits') found.Traits = self.MergeTraits(found.Traits, part.Traits);
				else if (key === 'Parts') found.Parts = self.MergeParts(found.Parts, part.Parts);
				else found[key] = self.Copy(part[key]);
			});
		});

		return result;
	},

	Resolve: function (name, chain) {
		var self = this;
		var kind = this.Get(name);
		var path = (chain || []).concat([name]);
		var base;

		if (!kind)
			throw new Error('Elemenx Kinds: unknown kind ' + name);

		if (kind.Extends && path.indexOf(kind.Extends) !== -1)
			throw new Error('Elemenx Kinds: ' + path[0] + ' extends itself: ' + path.concat([kind.Extends]).join(', '));

		base = kind.Extends ? this.Resolve(kind.Extends, path) : {Name: '', Chain: [], Traits: {}, Parts: [], Values: {}};

		return {
			Name: name,
			Chain: base.Chain.concat(kind.Extends ? [kind.Extends] : []),
			Traits: self.MergeTraits(base.Traits, kind.Traits),
			Parts: self.MergeParts(base.Parts, kind.Parts),
			Values: Object.assign(self.Copy(base.Values), self.Copy(kind.Values || {}))
		};
	},

	/*
	 * An object of a kind. props: its ID and the fields of its own, Traits and Parts of its own over the ones of the
	 * kind; the parts become objects too, their IDs parent/part.
	 */
	Make: function (kind, props) {
		var self = this;
		var given = props || {};
		var resolved = kind ? this.Resolve(kind) : {Name: '', Chain: [], Traits: {}, Parts: [], Values: {}};
		var id = given.ID !== undefined && given.ID !== null && given.ID !== '' ? String(given.ID) : (kind || 'object') + '-' + Math.random().toString(36).slice(2, 8);
		var values = this.Copy(resolved.Values);
		var object;

		Object.keys(given).forEach(function (key) {
			if (key !== 'ID' && key !== 'Kind' && key !== 'Traits' && key !== 'Parts')
				values[key] = self.Copy(given[key]);
		});

		object = {
			ID: id,
			Kind: kind || '',
			Values: values,
			Traits: this.MergeTraits(resolved.Traits, given.Traits),
			Parts: []
		};

		object.Parts = this.MergeParts(resolved.Parts, given.Parts).filter(function (part) {
			return !part.Removed;
		}).map(function (part) {
			var child = self.Make(part.Kind || '', Object.assign({}, part, {ID: id + '/' + part.ID}));

			child.Part = String(part.ID);

			return child;
		});

		return object;
	},

	/* The fields of a kind: its values and the params of its traits, {name in lower case: {Trait, Name}}. */
	Fields: function (kind) {
		var resolved = typeof kind === 'string' ? this.Resolve(kind) : kind || {};
		var fields = {};

		Object.keys(resolved.Values || {}).forEach(function (name) {
			fields[name.toLowerCase()] = {Trait: '', Name: name};
		});

		Object.keys(resolved.Traits || {}).forEach(function (trait) {
			Object.keys(resolved.Traits[trait] || {}).forEach(function (name) {
				if (!fields[name.toLowerCase()])
					fields[name.toLowerCase()] = {Trait: trait, Name: name};

				/* The name of the trait and of its field together, for two traits of a field of the same name (SurfaceType). */
				fields[(trait + name).toLowerCase()] = {Trait: trait, Name: name};
			});
		});

		return fields;
	},

	Field: function (object, name) {
		return this.Fields(object)[String(name).toLowerCase()] || null;
	},

	/* What differs between two values, deep: undefined when nothing does. */
	Difference: function (base, value) {
		var self = this;
		var result;

		if (JSON.stringify(base) === JSON.stringify(value)) return undefined;

		if (!base || !value || typeof base !== 'object' || typeof value !== 'object' || Array.isArray(base) || Array.isArray(value)) return this.Copy(value);

		result = {};

		Object.keys(value).forEach(function (key) {
			var changed = self.Difference(base[key], value[key]);
			if (changed !== undefined)
				result[key] = changed;
		});

		Object.keys(base).forEach(function (key) {
			if (!(key in value))
				result[key] = null;
		});

		return Object.keys(result).length ? result : undefined;
	},

	/* What an object keeps of its own against the object its kind makes: a saved game holds only this. */
	Diff: function (object) {
		return this.DiffFrom(object, this.Make(object.Kind, {ID: object.ID}));
	},

	DiffFrom: function (object, pristine) {
		var self = this;
		var saved = {ID: object.ID, Kind: object.Kind};
		var values = this.Difference(pristine.Values, object.Values);
		var traits = this.Difference(pristine.Traits, object.Traits);
		var parts = [];
		var kept = {};

		if (values)
			saved.Values = values;

		if (traits)
			saved.Traits = traits;

		(object.Parts || []).forEach(function (part) {
			var from = (pristine.Parts || []).filter(function (each) {
				return each.Part === part.Part;
			})[0];
			var own = from && from.Kind === part.Kind ? self.DiffFrom(part, from) : self.Diff(part);

			kept[part.Part] = true;
			own.ID = part.Part;

			if (from && from.Kind === part.Kind)
				delete own.Kind;

			if (!from || from.Kind !== part.Kind || Object.keys(own).length > 1)
				parts.push(own);
		});

		(pristine.Parts || []).forEach(function (part) {
			if (!kept[part.Part])
				parts.push({ID: part.Part, Removed: true});
		});

		if (parts.length)
			saved.Parts = parts;

		return saved;
	},

	Restore: function (saved) {
		return this.RestoreOn(this.Make(saved.Kind || '', {ID: saved.ID}), saved);
	},

	/* A saved difference applied to the object of its kind; a part not of the kind is made of its own kind. */
	RestoreOn: function (object, saved) {
		var self = this;

		object.Values = this.Apply(object.Values, saved.Values);
		object.Traits = this.Apply(object.Traits, saved.Traits);

		(saved.Parts || []).forEach(function (part) {
			var id = String(part.ID);
			var at = -1;
			var made;

			object.Parts.forEach(function (each, index) {
				if (each.Part === id)
					at = index;
			});

			if (part.Removed) {
				if (at !== -1)
					object.Parts.splice(at, 1);

				return;
			}

			if (at !== -1 && part.Kind === undefined) {
				self.RestoreOn(object.Parts[at], part);

				return;
			}

			made = self.Restore(Object.assign({}, part, {ID: object.ID + '/' + id}));
			made.Part = id;

			if (at !== -1) object.Parts[at] = made;
			else object.Parts.push(made);
		});

		return object;
	},

	/* A difference applied to a value: null takes a field away. */
	Apply: function (base, change) {
		var self = this;
		var result = this.Copy(base || {});

		Object.keys(change || {}).forEach(function (key) {
			if (change[key] === null) delete result[key];
			else if (change[key] && typeof change[key] === 'object' && !Array.isArray(change[key]) && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) result[key] = self.Apply(result[key], change[key]);
			else result[key] = self.Copy(change[key]);
		});

		return result;
	}
});
