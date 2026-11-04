/*
 * What is made of a seed, saved and made again. A record is its recipe by default: {Kind, Version, Seed, Params}, from
 * which the very same thing is made again; baked, it keeps the data made too (Baked), read back without making it again.
 * - Define(kind, {Version, Make(params), Bake(made, options), Read(baked, params)}) adds a kind or replaces it: Make
 *   makes it of its params (Seed among them), Bake gives what it made as data, Read makes it of that data. Kinds() lists
 *   the kinds.
 * - Save(kind, params, options): the record of a thing of these params; options Baked (true: its data too, as Bake gives
 *   it), Made (what was made of them already: it is baked, not made again) and what a kind's Bake takes (Side of a
 *   terrain). The lists of numbers are packed as text: a record is JSON.
 * - Load(record): the thing again: of its Baked when it has one, else made of its recipe. An unknown kind, or a Version
 *   newer than the kind knows, is an error.
 * - Pack(value), Unpack(value): typed arrays to {Typed, Base64} and back, functions left out: the data of a thing as JSON.
 * The kind of this library: system, a star system (Astronomy.Generate, Params {Seed, and its options}). A Service of
 * any Library defines its own kinds as it is made and declares them in $Provides ({Seeded: {Kinds: ['terrain']}}): a
 * kind not known yet (Save, Load) or the list of them (Kinds) makes that Service first. So do terrain (Terrain),
 * village (Biomes), model (Models), sigil (Sigils) and suprematism (Suprematist).
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Seeded', {
	$Meta: {
		Description: 'What is made of a seed, saved and made again: its recipe by default, the data made too when baked.',
		Methods: ['Define(kind, definition)', 'Kinds()', 'Save(kind, params, options)', 'Load(record)', 'Pack(value)', 'Unpack(value)']
	},

	$OnCreate: function () {
		var self = this;

		this.Defined = {};

		this.Define('system', {
			Version: 1,
			Make: function (params) {
				return self.$Service('Astronomy').Generate(params.Seed, params);
			}
		});
	},

	Define: function (kind, definition) {
		if (!definition || typeof definition.Make !== 'function')
			throw new Error('Elemenx Seeded: a kind needs Make: ' + kind);

		this.Defined[kind] = Object.assign({Version: 1}, definition);

		return this.Defined[kind];
	},

	Kinds: function () {
		this.$Provide('Kinds');

		return Object.keys(this.Defined);
	},

	/* The kind of a record, or an error that tells why not. */
	KindOf: function (kind, version) {
		var defined;

		if (!this.Defined[kind])
			this.$Provide('Kinds', kind);

		defined = this.Defined[kind];

		if (!defined)
			throw new Error('Elemenx Seeded: unknown kind ' + kind);

		if (version !== undefined && Number(version) > defined.Version)
			throw new Error('Elemenx Seeded: ' + kind + ' of version ' + version + ' is newer than ' + defined.Version);

		return defined;
	},

	Save: function (kind, params, options) {
		var settings = options || {};
		var defined = this.KindOf(kind);
		var given = Object.assign({}, params || {});
		var record = {Kind: kind, Version: defined.Version, Seed: given.Seed === undefined ? null : given.Seed, Params: given};
		var made;

		delete given.Seed;

		if (settings.Baked) {
			made = settings.Made || defined.Make(this.Params(record));
			record.Baked = this.Pack(defined.Bake ? defined.Bake(made, settings) : made);
		}

		return record;
	},

	Load: function (record) {
		var defined;
		var params;
		var baked;

		defined = this.KindOf(record && record.Kind, record && record.Version);
		params = this.Params(record);

		if (record.Baked === undefined || record.Baked === null) return defined.Make(params);

		baked = this.Unpack(record.Baked);

		return defined.Read ? defined.Read(baked, params) : baked;
	},

	/* The params of a record, its Seed among them. */
	Params: function (record) {
		var params = Object.assign({}, record.Params || {});

		if (record.Seed !== null && record.Seed !== undefined)
			params.Seed = record.Seed;

		return params;
	},

	Pack: function (value) {
		var self = this;
		var bytes;
		var text = '';
		var i;
		var packed;

		if (value && value.buffer instanceof ArrayBuffer && value.BYTES_PER_ELEMENT) {
			bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);

			for (i = 0; i < bytes.length; i += 32768)
				text += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));

			return {Typed: value.constructor.name, Base64: btoa(text)};
		}

		if (Array.isArray(value)) {
			return value.map(function (each) {
				return self.Pack(each);
			});
		}

		if (value && typeof value === 'object') {
			packed = {};

			Object.keys(value).forEach(function (key) {
				if (typeof value[key] !== 'function' && value[key] !== undefined)
					packed[key] = self.Pack(value[key]);
			});

			return packed;
		}

		return value;
	},

	Unpack: function (value) {
		var self = this;
		var kinds = {Float32Array: Float32Array, Float64Array: Float64Array, Uint32Array: Uint32Array, Int32Array: Int32Array, Uint16Array: Uint16Array, Int16Array: Int16Array, Uint8Array: Uint8Array, Int8Array: Int8Array};
		var text;
		var bytes;
		var unpacked;
		var i;

		if (value && typeof value.Typed === 'string' && typeof value.Base64 === 'string' && kinds[value.Typed]) {
			text = atob(value.Base64);
			bytes = new Uint8Array(text.length);

			for (i = 0; i < text.length; i++)
				bytes[i] = text.charCodeAt(i);

			return new kinds[value.Typed](bytes.buffer);
		}

		if (Array.isArray(value)) {
			return value.map(function (each) {
				return self.Unpack(each);
			});
		}

		if (value && typeof value === 'object') {
			unpacked = {};

			Object.keys(value).forEach(function (key) {
				unpacked[key] = self.Unpack(value[key]);
			});

			return unpacked;
		}

		return value;
	}
});
