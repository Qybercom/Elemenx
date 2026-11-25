/*
 * The arms of a ship against ships, declared inside a Scene (the trait SceneBehaviour): what ArmsOf of the scene gives of
 * For (an ID; empty: the ship of the hero, the one it is, sits in or walks in) each Every seconds (0.2), SceneMissiles:
 * its missiles left (or reloading), its heavy missiles (Hunters), its locks (closing, then locked), its torpedoes and its mass driver (their rounds,
 * a press launches one or fires it with the lead), its lance (charging, burning, cooling; a press at the target),
 * its railgun faster than light (charging; a press at the target, by a tunnel to where it will be or, Direct, into
 * it), its flares left and its point defence; a warning
 * while a missile comes at it (how many, how soon) or another locks it. Launch fires a salvo at what it locked (Launch of
 * the scene), Flares releases flares, the switch turns point defence on and off; the events launch ({Count}) and flares
 * ({Count}). None while the ship has none of them. Put it on the screen of the console of a gunner (in GameConsole it is,
 * of the gunner, the tactical officer, the pilot and the captain) and in the instruments over the view (GameFlight with
 * Arms). Size small, medium or large; Label names it for screen readers.
 */
Elemenx.Component('GameArms', {
	$TemplateURL: 'GameArms.html',
	$StyleURL: 'GameArms.css',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'crosshair',
		Description: 'The missiles, locks, flares and point defence of a ship, a warning of a missile at it; a salvo, flares and point defence at a press.',
		Props: {
			For: 'The ID of the ship; empty: the hero, or the ship the hero sits in or walks in.',
			Every: 'How often it reads, in seconds.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'},
			Label: 'Its name for screen readers.'
		},
		Events: {
			launch: 'A salvo was launched: {Count (0: none, nothing locked or none left)}.',
			torpedo: 'A torpedo was launched: {Count}.',
			hunter: 'A salvo of heavy missiles was launched: {Count}.',
			drive: 'The mass driver fired: {Done}.',
			lance: 'The lance began to charge: {Done}.',
			railgun: 'The railgun faster than light began to charge: {Done, Mode}.',
			flares: 'Flares were released: {Count}.'
		},
		Sample: {}
	},
	For: '',
	Every: 0.2,
	Size: 'medium',
	Label: '',
	Arms: null,
	Warning: '',
	RailDirect: false,
	Locks: '',

	$OnCreate: function () {
		this.ArmsClock = Infinity;
	},

	SceneStep: function (elapsed) {
		var scene = this.ParentScene();

		this.ArmsClock += elapsed;

		if (this.ArmsClock < Number(this.Every || 0) || !scene || typeof scene.ArmsOf !== 'function') return;

		this.ArmsClock = 0;

		this.Show(scene.ArmsOf(this.For));
	},

	/* What the ship has (ArmsOf of a Scene), as it shows it: its numbers, its locks, its warning. */
	Show: function (arms) {
		var given = arms || null;
		var locked = given ? given.Locked.length : 0;
		var locking = given ? given.Locks.filter(function (one) {
			return !one.Locked;
		}).length : 0;
		var warning = '';
		var key;

		if (given && given.Incoming) warning = Elemenx.Locale.Text('gaming.arms.incoming', {count: given.Incoming, seconds: isFinite(given.Soonest) ? given.Soonest.toFixed(1) : '—'});
		else if (given && given.LockedBy && given.LockedBy.length) warning = Elemenx.Locale.Text('gaming.arms.lockedBy');

		key = JSON.stringify(given);

		if (key !== this.ArmsKey) {
			this.ArmsKey = key;
			this.Arms = given;
		}

		if (warning !== this.Warning)
			this.Warning = warning;

		this.Locks = locked || locking ? Elemenx.Locale.Text('gaming.arms.locks', {locked: locked, locking: locking}) : Elemenx.Locale.Text('gaming.arms.noLock');
	},

	MissilesText: function () {
		var arms = this.Arms;
		if (!arms || !arms.Missiles) return '';

		if (arms.Reloading)
			return Elemenx.Locale.Text('gaming.arms.reloading');

		return Elemenx.Locale.Text('gaming.arms.missiles', {left: arms.Left, magazine: arms.Magazine}) + (arms.Flying ? ' · ' + Elemenx.Locale.Text('gaming.arms.flying', {count: arms.Flying}) : '');
	},

	/* A weapon of a magazine (torpedoes, the mass driver): how many of how many, or reloading. */
	MagazineText: function (kind, one) {
		if (!one)
			return '';

		if (one.Reloading && kind === 'hunters')
			return Elemenx.Locale.Text('gaming.arms.huntersReloading');

		if (one.Reloading)
			return kind === 'torpedoes' ? Elemenx.Locale.Text('gaming.arms.torpedoesReloading') : Elemenx.Locale.Text('gaming.arms.driverReloading');

		if (kind === 'hunters')
			return Elemenx.Locale.Text('gaming.arms.hunters', {left: one.Left, magazine: one.Magazine}) + (one.Flying ? ' · ' + Elemenx.Locale.Text('gaming.arms.flying', {count: one.Flying}) : '');

		return (kind === 'torpedoes' ? Elemenx.Locale.Text('gaming.arms.torpedoes', {left: one.Left, magazine: one.Magazine}) : Elemenx.Locale.Text('gaming.arms.driver', {left: one.Left, magazine: one.Magazine})) + (one.Flying ? ' · ' + Elemenx.Locale.Text('gaming.arms.flying', {count: one.Flying}) : '');
	},

	/* A salvo of the heavy missiles at what the ship locked (Launch of the scene, Kind hunter). */
	Hunter: function () {
		var scene = this.ParentScene();
		var count = scene && typeof scene.Launch === 'function' ? scene.Launch(this.For, {Kind: 'hunter'}) : 0;

		this.$Emit('hunter', {Count: count});

		this.ArmsClock = Infinity;
	},

	/* A torpedo at what the ship locked (Launch of the scene, Kind torpedo). */
	Torpedo: function () {
		var scene = this.ParentScene();
		var count = scene && typeof scene.Launch === 'function' ? scene.Launch(this.For, {Kind: 'torpedo'}) : 0;

		this.$Emit('torpedo', {Count: count});

		this.ArmsClock = Infinity;
	},

	/* The mass driver at the target of the ship, with the lead (Driver of the scene). */
	Drive: function () {
		var scene = this.ParentScene();
		var done = !!scene && typeof scene.Driver === 'function' && scene.Driver(this.For, '');

		this.$Emit('drive', {Done: done});

		this.ArmsClock = Infinity;
	},

	/* The lance: charging (how far), burning, cooling (seconds), or ready. */
	LanceText: function () {
		var one = this.Arms && this.Arms.Lance;
		if (!one)
			return '';

		if (one.Charge >= 0)
			return Elemenx.Locale.Text('gaming.arms.lanceCharging', {part: Math.round(one.Charge * 100)});

		if (one.Burning)
			return Elemenx.Locale.Text('gaming.arms.lanceBurning');

		if (!one.Ready)
			return Elemenx.Locale.Text('gaming.arms.lanceCooling', {seconds: Math.ceil(one.Cooldown)});

		return Elemenx.Locale.Text('gaming.arms.lanceReady');
	},

	/* The lance at the target of the ship (Lance of the scene): it charges, then burns. */
	FireLance: function () {
		var scene = this.ParentScene();
		var done = !!scene && typeof scene.Lance === 'function' && scene.Lance(this.For, '');

		this.$Emit('lance', {Done: done});

		this.ArmsClock = Infinity;
	},

	/* The railgun faster than light: charging, reloading, or its rounds and its mode. */
	RailgunText: function () {
		var one = this.Arms && this.Arms.Railgun;
		if (!one)
			return '';

		if (one.Charge >= 0)
			return Elemenx.Locale.Text('gaming.arms.railCharging', {part: Math.round(one.Charge * 100)});

		if (one.Reloading)
			return Elemenx.Locale.Text('gaming.arms.railReloading');

		if (!one.Magazine)
			return Elemenx.Locale.Text('gaming.arms.railReady');

		return Elemenx.Locale.Text('gaming.arms.railgun', {left: one.Left, magazine: one.Magazine});
	},

	RailDirectChanged: function (value) {
		this.RailDirect = !!(value && value.detail !== undefined ? value.detail : value);
	},

	/* The railgun at the target of the ship, by a tunnel to where it will be (or straight into it: direct). */
	FireRailgun: function () {
		var scene = this.ParentScene();
		var mode = this.RailDirect ? 'direct' : 'predict';
		var done = !!scene && typeof scene.Railgun === 'function' && scene.Railgun(this.For, '', {Mode: mode});

		this.$Emit('railgun', {Done: done, Mode: mode});

		this.ArmsClock = Infinity;
	},

	FlaresText: function () {
		var arms = this.Arms;

		return arms && arms.Flares ? Elemenx.Locale.Text('gaming.arms.flaresLeft', {left: arms.Flares.Left, count: arms.Flares.Count}) : '';
	},

	/* A salvo at what the ship locked (Launch of the scene). */
	Launch: function () {
		var scene = this.ParentScene();
		var count = scene && typeof scene.Launch === 'function' ? scene.Launch(this.For, {}) : 0;

		this.$Emit('launch', {Count: count});

		this.ArmsClock = Infinity;
	},

	Release: function () {
		var scene = this.ParentScene();
		var count = scene && typeof scene.Flares === 'function' ? scene.Flares(this.For) : 0;

		this.$Emit('flares', {Count: count});

		this.ArmsClock = Infinity;
	},

	DefenceChanged: function (value) {
		var scene = this.ParentScene();
		var on = value && value.detail !== undefined ? value.detail : value;

		if (scene && typeof scene.Defence === 'function')
			scene.Defence(this.For, !!on);

		this.ArmsClock = Infinity;
	}
});
