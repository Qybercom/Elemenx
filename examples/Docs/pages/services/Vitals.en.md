<!-- generated -->
# Vitals

Vitals: the health of what a game can hurt (units, ships, crates, glass), as data with one way in. Nothing writes a value itself: Damage and Heal go through the rules (Before handlers, armour, resistances, the parts hit), then tell what came of them. It runs in a page, a worker and Node; Of(scene) binds a ledger to a Scene (its objects with the trait Health).

- Make(options): a ledger. Options: Mode (local, by default; host: it applies and sends each change out; client: it asks the host by Send and takes what the host sends back), Send (function (message): the transport, of the application), FriendlyFire (false: a hit of a Team on its own does nothing), Read (function (id): the health settings of an ID it does not know yet, null for none), Write (function (id, value, state): where a value goes after each change).
- A ledger: Track(id, settings) (settings {Max (100), Value (Max), Armor (taken off each hit), Resist ({type: factor}), Parts ({part: factor}), Regen (a second), Invulnerable, Team, Death}), Forget(id), Get(id) ({ID, Value, Max, Part, Alive, Team, Death, By}), IDs(), Alive(id).
- Damage(id, hit): hit {Amount, Type (kinetic by default), Source (the ID of who did it), Team, Weapon, Part, Point, Normal, Material, ID (of the change: one ID is applied once)}; Heal(id, amount, source); Revive(id, value); Set(id, value). Each returns {ID, Change, Amount, Value, Killed} or null (cancelled, unknown, dead); a client returns {Pending}.
- Before(handler): handler(change) for each change before it is applied ({Kind damage or heal, ID, Hit, Amount, State}): false cancels it, a change of Amount changes it. Returns the function that removes it.
- On(event, handler), Off(event, handler): damage, heal ({ID, Change, Amount, Value, Max, Hit, Source}), death ({ID, By, Hit}), revive ({ID, Value}), health (any change: {ID, Value, Max}).
- Configure({Mode, Send, FriendlyFire}) changes them. Step(elapsed): regeneration. Receive(message): a message of the transport. Save() and Load(saved): {Version, States}.
- Kinds: the health a game gives the kinds of a Scene ({unit: {Max: 100}, house, module, station, craft, ship, cruiser, freighter}; change it or add yours); Units: what a unit is of its model ({archer: {Max, Damage, Range, Sight}, knight, orc, villager, soldier, robot}), UnitOf(object) its row ({} for none); Settings(object): the health of an object (its trait Health over the one of its model over the one of its kind, or a Health or MaxHealth given to it alone), null for what cannot be hurt. Card(ledger, object, rows) adds its row of health to its card, Target(ledger, object) whether a weapon may aim at it (it has health and lives): the hooks SceneCard and SceneTarget of GameCombat and GameStrategy. Bar(context, x, y, part, color, width, height) draws a bar of health on a canvas (2D) round x, y (px): width and height of its fill, part (0 to 1) of it in color over a dark frame a pixel wider.
- Of(scene): the ledger of a Scene, made once: it reads the health of its objects (Settings: Max, Armor, Resist, Parts, Regen, Death) and their Values.Health, writes Values.Health back, turns each hit of the scene (event hit of its weapons) into Damage, and at death does what Death says: remove (by default), break (Scene.Break), die (the clip die, then it stays), keep. A damage goes through the layers of the shield of what it hurts first (Absorb of the Scene: SceneShipSystems).

## Methods

- `Make(options)`
- `UnitOf(object)`
- `Settings(object)`
- `Bar(context, x, y, part, color, width, height)`
- `Card(ledger, object, rows)`
- `Target(ledger, object)`
- `Of(scene)`

## Tests

- [knows what a unit is of its model: its health, damage, range and sight](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/services/Vitals/Vitals.test.js#L20) — `libraries/ElemenxGaming/services/Vitals/Vitals.test.js`
- [takes damage by the type and the part hit, less the armour, and tells damage, health and death once](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/services/Vitals/Vitals.test.js#L32) — `libraries/ElemenxGaming/services/Vitals/Vitals.test.js`
- [lets handlers change or cancel a change before it is applied; spares its own team; applies one change ID once](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/services/Vitals/Vitals.test.js#L63) — `libraries/ElemenxGaming/services/Vitals/Vitals.test.js`
- [keeps a host and its clients the same: a client asks, the host applies and sends the state, in order](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/services/Vitals/Vitals.test.js#L88) — `libraries/ElemenxGaming/services/Vitals/Vitals.test.js`
- [regenerates, saves and loads, and reads what it does not know yet](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/services/Vitals/Vitals.test.js#L123) — `libraries/ElemenxGaming/services/Vitals/Vitals.test.js`
- [makes one hurt in a scene flinch (its clip hit), not again while it does, and not once it is dead](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/services/Vitals/Vitals.test.js#L142) — `libraries/ElemenxGaming/services/Vitals/Vitals.test.js`
- [patches a shader loud, draws a bar of health once and reads a shader graph of the library once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/hardcode-tables.test.js#L130) — `tests/regression/hardcode-tables.test.js`
- [gives the kinds of the scene their health, shows it on the card, and lets the weapons aim only at what lives](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js#L98) — `libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js`
- [takes a hit by its layers of shield one after another, tells each, fills them again after a while, and hurts the health only with what is left](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js#L131) — `libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js`
