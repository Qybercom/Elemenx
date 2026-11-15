/*
 * SystemData: a star system as data (docs/SPACE-FORMAT.md): its passport, its tree of orbits (the objects of a Scene of
 * space, each with its Parent: a star, a barycentre of stars and black holes, a planet, a moon, a ring, a belt, a black
 * hole, a wormhole, a station... to any depth), what was changed of it, and the data of its bodies (planets of the planet
 * format, PlanetData).
 * - Seeded(seed, options): the objects of a system of a seed (Astronomy.Generate), as a Scene has them.
 * - Make(source, settings): the data of a system: source {Seed} (made of it again whenever it is read: Origin generated)
 *   or {Objects} (written: Origin authored); settings {ID, Name}. data is {Manifest, Objects (of an authored one), Edits
 *   {Overrides: {id: {Values, Traits, Parent}}, Removed: [id], Added: [objects]}, Bodies: {id: planet data}}.
 * - Objects(data, key): its objects as a Scene draws them (System: {Objects}), its edits over what it was made of; a body
 *   with data (Manifest.Bodies: {id: {URL} or {Part: true}}) has the Data of its Surface named: the URL of its planet, or
 *   BodyKey(key, id), the key under which its planet is given to ScenePlanet (UseBodies).
 * - FromRecipe(recipe, settings) and Recipe(data, key): a system of the recipe of a Scene of space (Scene.Save, what
 *   SceneEditor edits: its seed, its Added, Removed and Overrides as its edits, its cosmos, time and cutscenes in its
 *   passport, Manifest.Scene) and back (Scene.Load).
 * - Edit(data, id, changes), Add(data, object), Remove(data, id): what is changed of it, written by the next Write.
 * - SetBody(data, id, planet), Body(data, id, callback(error, planet)): the planet of a body, kept in the system (its
 *   parts in the store of the system, each with Body: id) or of its URL.
 * - UseBodies(key, data, callback(error, keys)): the planets of its bodies given to ScenePlanet under their keys.
 * - Use(key, data), DataOf(key): systems kept under a key (a Scene names one: System='{"Data": key or URL}').
 * - Open(source, callback(error, data)): of what Make gave, a store of parts (PlanetData), the bytes or a Blob of its
 *   file, or the URL of its file; Write(data, store, callback, whole): its parts that changed (all with whole); Save(data)
 *   and Pack(data, callback): the bytes of its file (a zip: system.json, objects.json, edits.json, bodies/<id>/...).
 * Parts: {Kind: 'system'}, {Kind: 'tree'}, {Kind: 'edits'}; the parts of the planet of a body with Body: id.
 */
Elemenx.Service('SystemData', {
	$Meta: {
		Description: 'A star system as data: its passport, its tree of orbits to any depth, what was changed of it and the planets of its bodies, read and written by parts.',
		Methods: ['Seeded(seed, options)', 'Make(source, settings)', 'FromRecipe(recipe, settings)', 'Recipe(data, key)', 'Objects(data, key)', 'Edit(data, id, changes)', 'Add(data, object)', 'Remove(data, id)', 'SetBody(data, id, planet)', 'Body(data, id, callback)', 'BodyKey(key, id)', 'UseBodies(key, data, callback)', 'Use(key, data)', 'DataOf(key)', 'Open(source, callback)', 'Write(data, store, callback, whole)', 'Save(data)', 'Pack(data, callback)']
	},

	Sets: {},

	Seeded: function (seed, options) {
		return this.$Service('Astronomy').Generate(seed, options).Bodies.map(function (body) {
			if (body.Type === 'star')
				return {ID: body.ID, Kind: 'star', Parent: '', Values: {Name: body.Name}, Traits: {Star: {Mass: body.Mass, Radius: body.Radius, Temperature: body.Temperature}}};

			if (body.Type === 'belt' && body.Kind === 'ring')
				return {ID: body.ID, Kind: 'ring', Parent: body.Parent, Values: {Name: body.Name}, Traits: {Ring: {Inner: body.Inner, Outer: body.Outer}}};

			if (body.Type === 'belt')
				return {ID: body.ID, Kind: 'belt', Parent: body.Parent, Values: {Name: body.Name}, Traits: {Belt: {Inner: body.Inner, Outer: body.Outer, Count: body.Count}}};

			return {ID: body.ID, Kind: body.Parent === 'star' ? 'planet' : 'moon', Parent: body.Parent, Values: {Name: body.Name}, Traits: {Orbit: body.Orbit, Body: {Radius: body.Radius, Day: body.Day, Tilt: body.Tilt || 0}, Surface: {Type: body.Kind}}};
		});
	},

	/* A tree written with Children: each object with its Parent, in a list. */
	Flat: function (objects) {
		var list = [];

		function put (spec, parent) {
			var copy = {};

			Object.keys(spec).forEach(function (key) {
				if (key !== 'Children')
					copy[key] = spec[key];
			});

			if (copy.Parent === undefined || copy.Parent === null)
				copy.Parent = parent || '';

			list.push(copy);

			(spec.Children || []).forEach(function (child) {
				put(child, copy.ID);
			});
		}

		(objects || []).forEach(function (spec) {
			put(spec, '');
		});

		return list;
	},

	Make: function (source, settings) {
		var given = source || {};
		var told = settings || {};
		var seeded = given.Seed !== undefined && given.Seed !== null && given.Seed !== '' && !given.Objects;

		return {
			Manifest: {
				Format: 'elemenx-system',
				Version: 1,
				ID: String(told.ID || (seeded ? 'system-' + given.Seed : 'system')),
				Name: String(told.Name || told.ID || (seeded ? given.Seed : 'System')),
				Seed: seeded ? String(given.Seed) : '',
				Origin: seeded ? {Kind: 'generated', Seed: String(given.Seed), Options: given.Options || {}} : {Kind: 'authored'},
				Bodies: {}
			},
			Objects: seeded ? null : this.Flat(given.Objects),
			Edits: {Overrides: {}, Removed: [], Added: []},
			Bodies: {}
		};
	},

	/* The key of the planet of a body of the system under key, as ScenePlanet keeps it. */
	BodyKey: function (key, id) {
		return 'system:' + key + ':' + id;
	},

	Objects: function (data, key) {
		var manifest = data.Manifest;
		var edits = data.Edits || {};
		var removed = {};
		var self = this;
		var list = manifest.Origin && manifest.Origin.Kind === 'generated' ? this.Seeded(manifest.Origin.Seed, manifest.Origin.Options) : (data.Objects || []).map(function (spec) {
			return JSON.parse(JSON.stringify(spec));
		});

		(edits.Removed || []).forEach(function (id) {
			removed[id] = true;
		});

		list = list.concat((edits.Added || []).map(function (spec) {
			return JSON.parse(JSON.stringify(spec));
		})).filter(function (spec) {
			return !removed[spec.ID];
		});

		return list.map(function (spec) {
			var over = (edits.Overrides || {})[spec.ID];

			if (over) {
				spec.Values = Object.assign({}, spec.Values || {}, over.Values || {});
				spec.Traits = Object.assign({}, spec.Traits || {});

				Object.keys(over.Traits || {}).forEach(function (name) {
					spec.Traits[name] = Object.assign({}, spec.Traits[name] || {}, over.Traits[name]);
				});

				if (over.Parent !== undefined)
					spec.Parent = over.Parent;
			}

			/* A body with data: the planet of its Surface named by it. */
			return self.Bodied(spec, manifest, key);
		});
	},

	/*
	 * A system of the recipe of a Scene of space (Scene.Save, what SceneEditor edits): of its seed, its edits over it
	 * (Added, Removed, Overrides), its cosmos, its time and its cutscenes in its passport (Scene); settings as Make's.
	 */
	FromRecipe: function (recipe, settings) {
		var given = recipe || {};
		var data = this.Make(given.Seed !== undefined && given.Seed !== null && given.Seed !== '' ? {Seed: given.Seed} : {Objects: []}, settings);

		data.Edits = {Overrides: JSON.parse(JSON.stringify(given.Overrides || {})), Removed: (given.Removed || []).slice(), Added: JSON.parse(JSON.stringify(given.Added || []))};
		data.Manifest.Scene = {Cosmos: given.Cosmos === undefined ? null : given.Cosmos, Time: Number(given.Time) || 0, Cutscenes: given.Cutscenes || null};

		return data;
	},

	/*
	 * The recipe of a Scene of a system (Scene.Load): its seed, what it was written of and its edits as the Added, Removed
	 * and Overrides of a scene; a body with data with its planet named (key, as Objects).
	 */
	Recipe: function (data, key) {
		var self = this;
		var manifest = data.Manifest;
		var scene = manifest.Scene || {};
		var edits = data.Edits || {};
		var origin = manifest.Origin || {};
		/*
		 * Regression: a system made of a seed with options (the mass of the star of a galaxy) was opened as of its seed
		 * alone, the Seed of a Scene taking none: another star. Such a one comes as its objects, its edits on them.
		 */
		var told = origin.Kind === 'generated' && origin.Options && Object.keys(origin.Options).length > 0;
		var added = (told ? this.Objects(data, key) : (data.Objects || []).concat(edits.Added || [])).map(function (spec) {
			return self.Bodied(JSON.parse(JSON.stringify(spec)), manifest, key);
		});
		var recipe = {Version: 1, Seed: origin.Kind === 'generated' && !told ? origin.Seed : '', Cosmos: scene.Cosmos === undefined ? null : scene.Cosmos, Time: Number(scene.Time) || 0, Travels: [], Added: added, Removed: told ? [] : (edits.Removed || []).slice(), Overrides: told ? {} : JSON.parse(JSON.stringify(edits.Overrides || {}))};

		if (scene.Cutscenes)
			recipe.Cutscenes = JSON.parse(JSON.stringify(scene.Cutscenes));

		return recipe;
	},

	/* An object of a body with data: its planet named in its Surface (the URL of its file, or BodyKey). */
	Bodied: function (spec, manifest, key) {
		var body = (manifest.Bodies || {})[spec.ID];
		var traits;

		if (!body)
			return spec;

		traits = spec.Traits = Object.assign({}, spec.Traits || {});
		traits.Surface = Object.assign({}, traits.Surface || {}, {Planet: Object.assign({}, typeof (traits.Surface || {}).Planet === 'object' && traits.Surface.Planet || {}, {Data: body.URL || this.BodyKey(key, spec.ID)}, body.Levels !== undefined ? {Levels: body.Levels} : {})});

		return spec;
	},

	/* The edits of a system: what is changed of an object, an object added, one taken away. */
	Edit: function (data, id, changes) {
		var over = data.Edits.Overrides[id] = data.Edits.Overrides[id] || {};

		Object.keys(changes || {}).forEach(function (key) {
			if (key === 'Values' || key === 'Traits') over[key] = Object.assign({}, over[key] || {}, changes[key]);
			else over[key] = changes[key];
		});

		this.Mark(data, {Kind: 'edits'});
	},

	Add: function (data, object) {
		data.Edits.Added = data.Edits.Added.filter(function (spec) {
			return spec.ID !== object.ID;
		}).concat([JSON.parse(JSON.stringify(object))]);
		data.Edits.Removed = data.Edits.Removed.filter(function (id) {
			return id !== object.ID;
		});

		this.Mark(data, {Kind: 'edits'});
	},

	Remove: function (data, id) {
		data.Edits.Added = data.Edits.Added.filter(function (spec) {
			return spec.ID !== id;
		});

		if (data.Edits.Removed.indexOf(id) === -1)
			data.Edits.Removed.push(id);

		this.Mark(data, {Kind: 'edits'});
	},

	Mark: function (data, part) {
		this.$Service('PlanetData').Mark(data, part);
	},

	/* The planet of a body kept in the system: its parts in its store, each with Body: id. */
	SetBody: function (data, id, planet) {
		data.Bodies[id] = planet;
		data.Manifest.Bodies[id] = {Part: true};

		this.Mark(data, {Kind: 'system'});

		data.BodiesChanged = data.BodiesChanged || {};
		data.BodiesChanged[id] = true;
	},

	/* A store of the parts of the planet of one body, in the store of its system: each part with Body: id. */
	BodyStore: function (store, id) {
		function of (part) {
			return Object.assign({}, part, {Body: id});
		}

		return {
			Read: function (part, callback) {
				store.Read(of(part), callback);
			},
			Write: function (part, bytes, callback) {
				store.Write(of(part), bytes, callback);
			},
			Remove: store.Remove ? function (part, callback) {
				store.Remove(of(part), callback);
			} : undefined
		};
	},

	Body: function (data, id, callback) {
		var body = data.Manifest.Bodies[id];
		var planets = this.$Service('PlanetData');

		if (data.Bodies[id]) {
			callback(null, data.Bodies[id]);

			return;
		}

		if (!body) {
			callback(null, null);

			return;
		}

		if (body.URL) {
			planets.Open(body.URL, function (error, planet) {
				if (!error)
					data.Bodies[id] = planet;

				callback(error || null, planet || null);
			}, body.Levels !== undefined ? {Levels: body.Levels} : undefined);

			return;
		}

		if (!data.Source) {
			callback(null, null);

			return;
		}

		planets.Open(this.BodyStore(data.Source, id), function (error, planet) {
			if (!error)
				data.Bodies[id] = planet;

			callback(error || null, planet || null);
		}, body.Levels !== undefined ? {Levels: body.Levels} : undefined);
	},

	/* The planets of its bodies kept in it given to ScenePlanet under their keys (those of a URL a Scene opens itself). */
	UseBodies: function (key, data, callback) {
		var self = this;
		var ids = Object.keys(data.Manifest.Bodies || {}).filter(function (id) {
			return !data.Manifest.Bodies[id].URL;
		});
		var left = ids.length;
		var keys = [];
		var failed = null;

		if (!left) {
			callback(null, keys);

			return;
		}

		ids.forEach(function (id) {
			self.Body(data, id, function (error, planet) {
				if (error)
					failed = failed || error;

				if (planet) {
					self.$Service('ScenePlanet').UseData(self.BodyKey(key, id), planet);

					keys.push(self.BodyKey(key, id));
				}

				if (!--left)
					callback(failed, keys);
			});
		});
	},

	Use: function (key, data) {
		this.Sets[key] = data;
	},

	DataOf: function (key) {
		return this.Sets[key] || null;
	},

	/* The text of a part of the system (not of a body). */
	Encode: function (data, part) {
		var value = part.Kind === 'system' ? data.Manifest : part.Kind === 'tree' ? data.Objects : data.Edits;

		return new TextEncoder().encode(JSON.stringify(value, null, part.Kind === 'system' ? '\t' : undefined));
	},

	/* Its own parts: its passport, its tree when it was written, its edits. */
	Parts: function (data) {
		return [{Kind: 'system'}].concat(data.Objects ? [{Kind: 'tree'}] : [], [{Kind: 'edits'}]);
	},

	Write: function (data, store, callback, whole) {
		var self = this;
		var planets = this.$Service('PlanetData');
		var done = typeof callback === 'function' ? callback : function () {};
		var own = whole || !data.Dirty ? this.Parts(data) : Object.keys(data.Dirty).map(function (key) {
			return data.Dirty[key].Part;
		});
		var bodies = Object.keys(data.Bodies || {}).filter(function (id) {
			return data.Manifest.Bodies[id] && data.Manifest.Bodies[id].Part && (whole || (data.BodiesChanged || {})[id] || data.Bodies[id].Dirty && Object.keys(data.Bodies[id].Dirty).length);
		});
		var left = bodies.length + 1;
		var failed = false;

		function finish (error) {
			if (failed) return;

			if (error) {
				failed = true;

				done(error);

				return;
			}

			if (--left) return;

			data.Dirty = {};
			data.BodiesChanged = {};

			done(null);
		}

		planets.WriteParts(store, own, own.map(function (part) {
			return self.Encode(data, part);
		}), finish);

		bodies.forEach(function (id) {
			planets.Write(data.Bodies[id], self.BodyStore(store, id), finish, whole || (data.BodiesChanged || {})[id]);
		});
	},

	/* A store of the files of its zip (the names of a file: system.json, objects.json, edits.json, bodies/<id>/...). */
	FilesStore: function (files) {
		var self = this;

		return {
			Read: function (part, callback) {
				callback(null, files[self.Path(part)] || null);
			},
			Write: function (part, bytes, callback) {
				files[self.Path(part)] = bytes;

				callback(null);
			}
		};
	},

	Path: function (part) {
		var planets = this.$Service('PlanetData');
		var own = Object.assign({}, part);

		if (part.Body !== undefined && part.Body !== null) {
			delete own.Body;

			return 'bodies/' + encodeURIComponent(part.Body) + '/' + planets.Path(own);
		}

		if (part.Kind === 'system') return 'system.json';
		if (part.Kind === 'tree') return 'objects.json';

		return 'edits.json';
	},

	/* Its files by their paths: of each part, its own and those of the planets kept in it. */
	Files: function (data, callback) {
		var files = {};

		this.Write(data, this.FilesStore(files), function (error) {
			callback(error, files);
		}, true);
	},

	Save: function (data) {
		var archive = this.$Service('Archive');
		var made = null;

		this.Files(data, function (error, files) {
			if (!error)
				made = archive.Zip(files);
		});

		return made;
	},

	Pack: function (data, callback) {
		var archive = this.$Service('Archive');

		this.Files(data, function (error, files) {
			if (error) callback(error);
			else archive.Compress(files, callback);
		});
	},

	Open: function (source, callback) {
		var self = this;
		var done = typeof callback === 'function' ? callback : function () {};
		var reader;

		function expanded (bytes) {
			self.$Service('Archive').Expand(bytes, function (error, files) {
				if (error) done(error);
				else self.FromStore(self.FilesStore(files), done);
			});
		}

		if (source && source.Manifest && source.Manifest.Format === 'elemenx-system') {
			done(null, source);

			return;
		}

		if (source && typeof source.Read === 'function') {
			this.FromStore(source, done);

			return;
		}

		if (typeof source === 'string') {
			this.$Service('PlanetData').Get(source, null, function (error, bytes) {
				if (error) done(error);
				else expanded(bytes);
			});

			return;
		}

		if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
			expanded(source);

			return;
		}

		if (typeof Blob !== 'undefined' && source instanceof Blob) {
			reader = new FileReader();
			reader.onload = function () {
				expanded(reader.result);
			};
			reader.onerror = function () {
				done(reader.error || new Error('SystemData: the file was not read'));
			};

			reader.readAsArrayBuffer(source);

			return;
		}

		done(new Error('SystemData: not a system'));
	},

	/* A system of a store of parts: its passport, its tree, its edits; the planets of its bodies as they are asked for (Body). */
	FromStore: function (store, callback) {
		var planets = this.$Service('PlanetData');

		function json (bytes) {
			return bytes ? JSON.parse(typeof bytes === 'string' ? bytes : new TextDecoder().decode(bytes)) : null;
		}

		planets.ReadParts(store, [{Kind: 'system'}, {Kind: 'tree'}, {Kind: 'edits'}], function (error, list) {
			var data;

			if (error) {
				callback(error);

				return;
			}

			try {
				data = {Manifest: json(list[0]), Objects: json(list[1]), Edits: json(list[2]) || {Overrides: {}, Removed: [], Added: []}, Bodies: {}, Source: store};

				if (!data.Manifest || data.Manifest.Format !== 'elemenx-system')
					throw new Error('SystemData: not a system');
			}
			catch (wrong) {
				callback(wrong);

				return;
			}

			data.Manifest.Bodies = data.Manifest.Bodies || {};

			callback(null, data);
		});
	}
});
