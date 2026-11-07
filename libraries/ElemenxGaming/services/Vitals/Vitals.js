/*
 * Vitals: the health of what a game can hurt (units, ships, crates, glass), as data with one way in. Nothing writes a value
 * itself: Damage and Heal go through the rules (Before handlers, armour, resistances, the parts hit), then tell what came of
 * them. It runs in a page, a worker and Node; Of(scene) binds a ledger to a Scene (its objects with the trait Health).
 *
 * - Make(options): a ledger. Options: Mode (local, by default; host: it applies and sends each change out; client: it asks
 *   the host by Send and takes what the host sends back), Send (function (message): the transport, of the application),
 *   FriendlyFire (false: a hit of a Team on its own does nothing), Read (function (id): the health settings of an ID it does
 *   not know yet, null for none), Write (function (id, value, state): where a value goes after each change).
 * - A ledger: Track(id, settings) (settings {Max (100), Value (Max), Armor (taken off each hit), Resist ({type: factor}),
 *   Parts ({part: factor}), Regen (a second), Invulnerable, Team, Death}), Forget(id), Get(id) ({ID, Value, Max, Part,
 *   Alive, Team, Death, By}), IDs(), Alive(id).
 * - Damage(id, hit): hit {Amount, Type (kinetic by default), Source (the ID of who did it), Team, Weapon, Part, Point,
 *   Normal, Material, ID (of the change: one ID is applied once)}; Heal(id, amount, source); Revive(id, value); Set(id,
 *   value). Each returns {ID, Change, Amount, Value, Killed} or null (cancelled, unknown, dead); a client returns {Pending}.
 * - Before(handler): handler(change) for each change before it is applied ({Kind damage or heal, ID, Hit, Amount, State}):
 *   false cancels it, a change of Amount changes it. Returns the function that removes it.
 * - On(event, handler), Off(event, handler): damage, heal ({ID, Change, Amount, Value, Max, Hit, Source}), death ({ID, By,
 *   Hit}), revive ({ID, Value}), health (any change: {ID, Value, Max}).
 * - Configure({Mode, Send, FriendlyFire}) changes them. Step(elapsed): regeneration. Receive(message): a message of the transport. Save() and Load(saved): {Version, States}.
 * - Kinds: the health a game gives the kinds of a Scene ({unit: {Max: 100}, house, module, station, craft, ship, cruiser,
 *   freighter}; change it or add yours); Settings(object): the health of an object (its trait Health over the one of its kind,
 *   or a Health or MaxHealth given to it alone), null for what cannot be hurt. Card(ledger, object, rows) adds its row of
 *   health to its card, Target(ledger, object) whether a weapon may aim at it (it has health and lives): the hooks SceneCard
 *   and SceneTarget of GameCombat and GameStrategy.
 * - Of(scene): the ledger of a Scene, made once: it reads the health of its objects (Settings: Max, Armor, Resist, Parts, Regen,
 *   Death) and their Values.Health, writes Values.Health back, turns each hit of the scene (event hit of its weapons) into
 *   Damage, and at death does what Death says: remove (by default), break (Scene.Break), die (the clip die, then it stays),
 *   keep.
 */
Elemenx.Service('Vitals', {
	$Meta: {
		Description: 'The health of what a game can hurt, as data with one way in: damage and heal through rules, events, a host and its clients.',
		Methods: ['Make(options)', 'Of(scene)', 'Settings(object)', 'Card(ledger, object, rows)', 'Target(ledger, object)']
	},

	$OnCreate: function () {
		this.Scenes = typeof WeakMap === 'function' ? new WeakMap() : null;
	},

	Make: function (options) {
		var settings = options || {};
		var mode = settings.Mode === 'host' || settings.Mode === 'client' ? settings.Mode : 'local';
		var states = {};
		var listeners = {damage: [], heal: [], death: [], revive: [], health: []};
		var before = [];
		var done = [];
		var seen = {};
		var counter = 0;
		var sequence = 0;
		var ledger;

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function tell (event, data) {
			(listeners[event] || []).slice().forEach(function (handler) {
				handler(data);
			});
		}

		/* What it knows of an ID: tracked, or read the first time it is asked for. */
		function stateOf (id) {
			var read;

			if (states[id])
				return states[id];

			read = typeof settings.Read === 'function' ? settings.Read(id) : null;

			return read ? ledger.Track(id, read) : null;
		}

		function publicOf (state) {
			return {ID: state.ID, Value: state.Value, Max: state.Max, Part: state.Max > 0 ? state.Value / state.Max : 0, Alive: state.Value > 0, Team: state.Team, Death: state.Death, By: state.By};
		}

		/* A change applied once: an ID given again (a message that came twice) is passed by. */
		function fresh (change) {
			if (seen[change]) return false;

			seen[change] = true;

			done.push(change);

			if (done.length > 512)
				delete seen[done.shift()];

			return true;
		}

		function write (state) {
			if (typeof settings.Write === 'function')
				settings.Write(state.ID, state.Value, publicOf(state));

			tell('health', {ID: state.ID, Value: state.Value, Max: state.Max});
		}

		function send (message) {
			if (typeof settings.Send === 'function')
				settings.Send(message);
		}

		/* A change to a value, by the rules: what handlers make of it, then the value. */
		function apply (kind, id, hit, amount) {
			var state = stateOf(id);
			var change = hit.ID || 'c' + (++counter) + '-' + Math.random().toString(36).slice(2, 8);
			var event;
			var killed;
			var made;
			var i;

			if (!state || state.Value <= 0 && kind !== 'revive') return null;

			if (!fresh(change)) return null;

			event = {Kind: kind, ID: id, Hit: hit, Amount: amount, State: publicOf(state)};

			if (kind === 'damage' && !settings.FriendlyFire && hit.Team !== undefined && hit.Team !== null && hit.Team !== '' && state.Team && String(hit.Team) === String(state.Team) && hit.Source !== id) return null;

			if (kind === 'damage' && state.Invulnerable) return null;

			for (i = 0; i < before.length; i++) {
				if (before[i](event) === false) return null;
			}

			amount = Math.max(0, number(event.Amount, 0));

			/* What it took: no more than it had (the rest of a hit that kills goes nowhere). */
			if (kind === 'damage') {
				amount = Math.min(amount, state.Value);
				state.Value -= amount;
				state.By = hit.Source || state.By || '';
			}
			else if (kind === 'heal') {
				amount = Math.min(amount, state.Max - state.Value);
				state.Value += amount;
			}
			else {
				state.Value = Math.max(1, Math.min(state.Max, amount));
				state.By = '';
			}

			killed = kind === 'damage' && state.Value <= 0;
			made = {ID: id, Change: change, Amount: amount, Value: state.Value, Killed: killed, Seq: ++sequence};

			write(state);

			if (mode === 'host')
				send({Type: 'state', ID: id, Value: state.Value, Max: state.Max, Kind: kind, Change: change, Amount: amount, Source: hit.Source || '', Killed: killed, Seq: made.Seq, Hit: hit});

			tell(kind === 'revive' ? 'revive' : kind, kind === 'revive' ? {ID: id, Value: state.Value} : {ID: id, Change: change, Amount: amount, Value: state.Value, Max: state.Max, Hit: hit, Source: hit.Source || ''});

			if (killed)
				tell('death', {ID: id, By: state.By, Hit: hit});

			return made;
		}

		/* A client asks the host; what comes back (state) is applied by Receive. */
		function ask (kind, id, hit, amount) {
			var change = hit.ID || 'c' + (++counter) + '-' + Math.random().toString(36).slice(2, 8);

			send({Type: kind, ID: id, Hit: Object.assign({}, hit, {ID: change}), Amount: amount});

			return {Pending: true, ID: id, Change: change};
		}

		ledger = {
			Mode: mode,

			/* Changes its settings: Mode, Send, FriendlyFire (a component that holds the ledger of a scene sets them). */
			Configure: function (changes) {
				if (changes.Mode !== undefined)
					mode = changes.Mode === 'host' || changes.Mode === 'client' ? changes.Mode : 'local';

				['Send', 'FriendlyFire', 'Read', 'Write'].forEach(function (name) {
					if (changes[name] !== undefined)
						settings[name] = changes[name];
				});

				ledger.Mode = mode;

				return ledger;
			},

			Track: function (id, given) {
				var max = Math.max(0, number(given && given.Max, 100));

				states[id] = {ID: id, Max: max, Value: Math.max(0, Math.min(max, number(given && given.Value, max))), Armor: number(given && given.Armor, 0), Resist: given && given.Resist || {}, Parts: given && given.Parts || {}, Regen: number(given && given.Regen, 0), Invulnerable: !!(given && given.Invulnerable), Team: given && given.Team !== undefined ? given.Team : '', Death: given && given.Death || 'remove', By: ''};

				return states[id];
			},

			Forget: function (id) {
				delete states[id];
			},

			Get: function (id) {
				var state = stateOf(id);

				return state ? publicOf(state) : null;
			},

			IDs: function () {
				return Object.keys(states);
			},

			Alive: function (id) {
				var state = stateOf(id);

				return !!state && state.Value > 0;
			},

			Damage: function (id, hit) {
				var given = hit || {};
				var state = stateOf(id);
				var amount;

				if (!state)
					return null;

				/* Of the hit, by the type of it and the part it hit, less the armour. */
				amount = Math.max(0, number(given.Amount, 0) * number(state.Resist[given.Type || 'kinetic'], 1) * number(state.Parts[given.Part], 1) - state.Armor);

				if (mode === 'client')
					return ask('damage', id, given, amount);

				return apply('damage', id, given, amount);
			},

			Heal: function (id, amount, source) {
				var hit = {Source: source || ''};

				if (mode === 'client')
					return ask('heal', id, hit, number(amount, 0));

				return apply('heal', id, hit, number(amount, 0));
			},

			Revive: function (id, value) {
				var state = stateOf(id);
				if (!state)
					return null;

				if (mode === 'client')
					return ask('revive', id, {}, number(value, state.Max));

				return apply('revive', id, {}, number(value, state.Max));
			},

			Set: function (id, value) {
				var state = stateOf(id);
				if (!state)
					return null;

				state.Value = Math.max(0, Math.min(state.Max, number(value, state.Value)));

				write(state);

				return publicOf(state);
			},

			Before: function (handler) {
				before.push(handler);

				return function () {
					var at = before.indexOf(handler);
					if (at !== -1)
						before.splice(at, 1);
				};
			},

			On: function (event, handler) {
				if (!listeners[event])
					throw new Error('Elemenx Vitals: unknown event ' + event);

				listeners[event].push(handler);

				return ledger;
			},

			Off: function (event, handler) {
				var list = listeners[event] || [];
				var at = list.indexOf(handler);
				if (at !== -1)
					list.splice(at, 1);

				return ledger;
			},

			Step: function (elapsed) {
				Object.keys(states).forEach(function (id) {
					var state = states[id];

					if (state.Regen > 0 && state.Value > 0 && state.Value < state.Max && mode !== 'client') {
						state.Value = Math.min(state.Max, state.Value + state.Regen * elapsed);

						write(state);
					}
				});
			},

			/*
			 * A message of the transport. The host takes a request of a client (damage, heal, revive) as its own; a client takes
			 * a state of the host, once each, in the order of the host (an older Seq than one taken is passed by).
			 */
			Receive: function (message) {
				var state;
				var killed;

				if (!message || typeof message !== 'object') return null;

				if (mode === 'host' && (message.Type === 'damage' || message.Type === 'heal' || message.Type === 'revive')) return apply(message.Type, message.ID, message.Hit || {}, number(message.Amount, 0));

				if (mode !== 'client' || message.Type !== 'state') return null;

				state = stateOf(message.ID) || ledger.Track(message.ID, {Max: message.Max, Value: message.Value});

				if (message.Seq !== undefined && state.Seq !== undefined && message.Seq <= state.Seq) return null;

				if (!fresh(message.Change || 'h' + message.Seq)) return null;

				killed = state.Value > 0 && message.Value <= 0;
				state.Seq = message.Seq;
				state.Max = number(message.Max, state.Max);
				state.Value = number(message.Value, state.Value);
				state.By = message.Source || state.By;

				write(state);

				tell(message.Kind === 'revive' ? 'revive' : message.Kind === 'heal' ? 'heal' : 'damage', {ID: message.ID, Change: message.Change, Amount: message.Amount, Value: state.Value, Max: state.Max, Hit: message.Hit || {}, Source: message.Source || ''});

				if (killed)
					tell('death', {ID: message.ID, By: state.By, Hit: message.Hit || {}});

				return {ID: message.ID, Value: state.Value, Killed: killed};
			},

			Save: function () {
				var saved = {};

				Object.keys(states).forEach(function (id) {
					saved[id] = {Value: states[id].Value, Max: states[id].Max};
				});

				return {Version: 1, States: saved};
			},

			Load: function (saved) {
				Object.keys(saved && saved.States || {}).forEach(function (id) {
					var state = stateOf(id) || ledger.Track(id, saved.States[id]);

					state.Max = number(saved.States[id].Max, state.Max);
					state.Value = number(saved.States[id].Value, state.Value);

					write(state);
				});
			}
		};

		return ledger;
	},

	/* The ledger of a Scene: its objects with Health, the hits of the scene, what death does. */
	/*
	 * The health a game gives the kinds of a Scene (the scene itself knows none): a unit, a house, a station and its modules,
	 * the ships. A kind of its own takes the one of what it extends; the trait Health of an object or of its kind is over it.
	 */
	Kinds: {unit: {Max: 100}, house: {Max: 800}, module: {Max: 200}, station: {Max: 1000}, craft: {Max: 1000}, ship: {Max: 100}, cruiser: {Max: 600}, freighter: {Max: 300}},

	/*
	 * The health settings of an object of a Scene: its trait Health over the health of its kind (Kinds, through what the kind
	 * extends), or a Health it was given alone (Values.Health); null for what has none (it cannot be hurt).
	 */
	Settings: function (object) {
		var kinds = null;
		var given = object && object.Traits ? object.Traits.Health : null;
		var name = object ? object.Kind : '';
		var base = null;
		var seen = 0;
		var kind;

		if (!object)
			return null;

		try {
			kinds = this.$Service('SceneKinds');
		}
		catch (error) {
			kinds = null;
		}

		while (name && !base && seen < 16) {
			base = this.Kinds[name] || null;
			kind = kinds && kinds.Get ? kinds.Get(name) : null;
			name = kind && kind.Extends ? kind.Extends : '';

			seen++;
		}

		if (!given && !base && (object.Values === undefined || object.Values.Health === undefined || object.Values.Health === null || object.Values.Health === '')) return null;

		/* A MaxHealth given to it alone (an attribute of its tag) is its Max. */
		return Object.assign({Max: 100}, base || {}, given || {}, object.Values && object.Values.MaxHealth !== undefined && object.Values.MaxHealth !== null && object.Values.MaxHealth !== '' ? {Max: Number(object.Values.MaxHealth)} : {});
	},

	/* The row of health of an object on the card of its Scene (SceneCard of a behaviour), once whoever adds it. */
	Card: function (ledger, object, rows) {
		var state = object && ledger ? ledger.Get(object.ID) : null;
		if (!state || rows.some(function (row) {
			return row.Key === 'health';
		})) return;

		rows.push({Key: 'health', Label: Elemenx.Locale.Text('gaming.vitals.health'), Value: Math.round(state.Value) + ' / ' + Math.round(state.Max)});
	},

	/* Whether the weapons of a Scene may aim at an object and hurt it (SceneTarget of a behaviour): it has health and lives. */
	Target: function (ledger, object) {
		var state = object && ledger ? ledger.Get(object.ID) : null;

		return !!(state && state.Alive);
	},

	Of: function (scene) {
		/* Keyed by the element of the scene: a component may come as more than one reactive copy of itself. */
		var self = this;
		var key = scene.$Element ? scene.$Element() : scene;
		var made = this.Scenes ? this.Scenes.get(key) : key.VitalsLedger;
		var ledger;

		if (made)
			return made;

		function space () {
			return scene.Scene ? scene.Scene() : null;
		}

		function objectOf (id) {
			var inner = space();

			return inner && inner.Objects ? inner.Objects[id] : null;
		}

		ledger = this.Make({
			Read: function (id) {
				var object = objectOf(id);
				var health = self.Settings(object);
				if (!health)
					return null;

				return {Max: health.Max, Value: object.Values.Health, Armor: health.Armor, Resist: health.Resist, Parts: health.Parts, Regen: health.Regen, Invulnerable: health.Invulnerable || object.Values.Invulnerable, Team: object.Team || object.Values.Team || '', Death: health.Death || object.Values.Death};
			},

			Write: function (id, value) {
				var object = objectOf(id);
				if (object)
					object.Values.Health = value;
			}
		});

		ledger.Scene = scene;

		/* At death: gone, broken, its last clip, or kept as it is. */
		ledger.On('death', function (event) {
			var state = ledger.Get(event.ID);
			var death = state ? state.Death : 'remove';
			if (!objectOf(event.ID) || death === 'keep') return;

			if (death === 'break' && typeof scene.Break === 'function') {
				scene.Break(event.ID, {Point: event.Hit && event.Hit.Point, Normal: event.Hit && event.Hit.Normal});

				return;
			}

			if (death === 'die' && typeof scene.Play === 'function' && scene.Play(event.ID, 'die')) return;

			scene.Remove(event.ID);
		});

		/* Each hit of the scene (its weapons) is damage; the regeneration goes with its time. */
		ledger.Detach = scene.AddBehaviour({
			Hit: function (hit) {
				if (hit && hit.Target && objectOf(hit.Target))
					ledger.Damage(hit.Target, hit);
			},

			Step: function (elapsed) {
				ledger.Step(elapsed);
			}
		});

		if (this.Scenes) this.Scenes.set(key, ledger);
		else key.VitalsLedger = ledger;

		return ledger;
	}
});
