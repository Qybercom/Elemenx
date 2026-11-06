/*
 * The health of what a game of a Scene can hurt, declared inside it: <Scene> ... <GameCombat Bars="hurt" /> </Scene> (the
 * trait SceneBehaviour). It holds the ledger of the scene (the Vitals Service, Of(scene)): the objects with the trait Health
 * (Max, Armor, Resist, Parts, Regen, Death: remove, break, die or keep), each hit of the weapons of the scene made damage, a
 * death done as its Death says. The same ledger is the one of GameStrategy and of any other part of the game.
 *
 * Bars: the bars of health over what has it (hurt: only the hurt, always, never). FriendlyFire: a hit of a Team on its own
 * counts. Authority: local (by default), host (each change is sent out by Send), client (a change is asked of the host by
 * Send; Receive(message) takes what comes back). Send: the function of the transport of the application (message).
 *
 * Methods: Damage(id, hit), Heal(id, amount, source), Revive(id, value), HealthOf(id) ({ID, Value, Max, Part, Alive, Team,
 * By}), Alive(id), Before(handler) (a handler of each change before it is applied: false cancels it, Amount changes it;
 * returns the function that removes it), Receive(message), Ledger() (the ledger itself). Events: damage, heal ({ID, Change,
 * Amount, Value, Max, Hit, Source}), death ({ID, By, Hit}), revive ({ID, Value}), health ({ID, Value, Max}).
 */
Elemenx.Component('GameCombat', {
	$Template: '<canvas class="elemenx-game-combat" aria-hidden="true"></canvas>',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'heart',
		Description: 'The health of what a game of a Scene can hurt, declared inside it: damage of the hits of its weapons, deaths, bars, a host and its clients.',
		Events: {
			damage: 'Something took damage: {ID, Change, Amount, Value, Max, Hit, Source}.',
			heal: 'Something was healed: {ID, Change, Amount, Value, Max, Source}.',
			death: 'Something has no health left: {ID, By, Hit}.',
			revive: 'Something came back: {ID, Value}.',
			health: 'A health changed: {ID, Value, Max}.'
		},
		Props: {
			Bars: {Options: ['hurt', 'always', 'never'], Description: 'The bars of health over what has it: only the hurt, always or never.'},
			FriendlyFire: 'A hit of a Team on its own counts.',
			Authority: {Options: ['local', 'host', 'client'], Description: 'Who applies the changes: here (local), here and sent out (host), or the host, asked (client).'},
			Send: 'The transport of the application: a function given each message for the host or the clients.'
		}
	},
	Bars: 'hurt',
	FriendlyFire: false,
	Authority: 'local',
	Send: null,

	SceneStart: function (scene) {
		var self = this;
		var canvas = this.$Element();
		var ledger = this.$Service('Vitals').Of(scene);

		/* A field would hold a reactive copy of the ledger, never the same: a function holds it. */
		this.Ledger = function () {
			return ledger;
		};

		ledger.Configure({Mode: this.Authority, FriendlyFire: this.FriendlyFire === true || this.FriendlyFire === 'true', Send: function (message) {
			if (typeof self.Send === 'function')
				self.Send(message);
		}});

		this.Listeners = {};

		['damage', 'heal', 'death', 'revive', 'health'].forEach(function (event) {
			self.Listeners[event] = function (data) {
				self.$Emit(event, data);
			};

			ledger.On(event, self.Listeners[event]);
		});

		/* A kill of what the hero hit shows on its crosshair. */
		this.Listeners.kill = function (event) {
			var inner = scene.Scene();
			if (inner && event.By && event.By === inner.Hero && scene.Killed)
				scene.Killed(event.ID);
		};

		ledger.On('death', this.Listeners.kill);

		scene.$Element().appendChild(canvas);

		canvas.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1';
	},

	SceneStop: function () {
		var self = this;
		var ledger = this.Ledger ? this.Ledger() : null;

		if (ledger) {
			Object.keys(this.Listeners || {}).forEach(function (event) {
				ledger.Off(event === 'kill' ? 'death' : event, self.Listeners[event]);
			});
		}

		this.Ledger = null;
	},

	SceneStep: function () {
		this.DrawBars();
	},

	/* The bars over what has health: hurt ones, or all, where they are seen. */
	DrawBars: function () {
		var scene = this.ParentScene();
		var inner = scene ? scene.Scene() : null;
		var canvas = this.$Element();
		var ledger = this.Ledger ? this.Ledger() : null;
		var bars = this.Bars;
		var ratio = window.devicePixelRatio || 1;
		var width;
		var height;
		var context;

		if (!inner || !ledger || !canvas.getContext) return;

		width = inner.Width || canvas.clientWidth;
		height = inner.Height || canvas.clientHeight;

		if (!width || !height) return;

		if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
			canvas.width = Math.round(width * ratio);
			canvas.height = Math.round(height * ratio);
		}

		context = canvas.getContext('2d');

		context.setTransform(ratio, 0, 0, ratio, 0, 0);
		context.clearRect(0, 0, width, height);

		if (bars === 'never') return;

		Object.keys(inner.Objects).forEach(function (id) {
			var object = inner.Objects[id];
			var state;
			var body;
			var top;

			if (!object.World || object.Hidden || object.Owner || id === inner.Hero || !object.Traits || !object.Traits.Health) return;

			state = ledger.Get(id);

			if (!state || !state.Alive || bars !== 'always' && state.Value >= state.Max) return;

			body = scene.Engine().BodyOf ? scene.Engine().BodyOf(object) : null;
			top = scene.Engine().Project([object.World[0], body ? body.Max[1] + 0.35 : object.World[1] + (object.Size || 1) * 1.2 + 0.4, object.World[2]]);

			if (top.Visible === false) return;

			context.fillStyle = 'rgba(0, 0, 0, 0.6)';

			context.fillRect(top.X - 21, top.Y - 3, 42, 6);

			context.fillStyle = state.Part > 0.5 ? '#6ad15f' : state.Part > 0.25 ? '#e8c14a' : '#e0503f';

			context.fillRect(top.X - 20, top.Y - 2, 40 * Math.max(0, state.Part), 4);
		});
	},

	Damage: function (id, hit) {
		return this.Ledger ? this.Ledger().Damage(id, hit || {}) : null;
	},

	Heal: function (id, amount, source) {
		return this.Ledger ? this.Ledger().Heal(id, amount, source) : null;
	},

	Revive: function (id, value) {
		return this.Ledger ? this.Ledger().Revive(id, value) : null;
	},

	HealthOf: function (id) {
		return this.Ledger ? this.Ledger().Get(id) : null;
	},

	Alive: function (id) {
		return !!this.Ledger && this.Ledger().Alive(id);
	},

	Before: function (handler) {
		return this.Ledger ? this.Ledger().Before(handler) : function () {};
	},

	/* A message of the transport (of the host to a client, of a client to the host). */
	Receive: function (message) {
		return this.Ledger ? this.Ledger().Receive(message) : null;
	}
});
