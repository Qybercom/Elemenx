<!-- generated -->
# Vitals

Vitals: здоровье того, что в игре можно ранить (юниты, корабли, ящики, стёкла), — как данные с единственным входом. Значение не пишет никто напрямую: Damage и Heal проходят через правила (обработчики Before, броня, сопротивления, задетая часть) и затем сообщают, что из этого вышло. Работает на странице, в воркере и в Node.

Make(options) создаёт реестр (ledger). Options:
- Mode: local (по умолчанию); host — применяет каждое изменение и рассылает его через Send; client — просит хозяина через Send и принимает то, что тот присылает;
- Send(message) — транспорт приложения;
- FriendlyFire — по умолчанию удар своей команды ничего не делает;
- Read(id) — настройки здоровья для ID, которого реестр ещё не знает;
- Write(id, value, state) — куда уходит значение после каждого изменения.

Реестр:
- Track(id, {Max (100), Value (Max), Armor (вычитается из каждого удара), Resist ({тип: множитель}), Parts ({часть: множитель}), Regen (в секунду), Invulnerable, Team, Death}), Forget(id), Get(id) ({ID, Value, Max, Part, Alive, Team, Death, By}), IDs(), Alive(id);
- Damage(id, hit) — hit: {Amount, Type (kinetic по умолчанию), Source, Team, Weapon, Part, Point, Normal, Material, ID (изменение с одним ID применяется один раз)};
- Heal(id, amount, source), Revive(id, value), Set(id, value) — каждый возвращает {ID, Change, Amount (сколько реально снято или добавлено), Value, Killed} или null (отменено, неизвестно, мертво); клиент получает {Pending};
- Before(handler) — обработчик каждого изменения до применения: false отменяет его, изменение Amount меняет урон. Возвращает функцию, которая убирает обработчик;
- On(event, handler), Off — события damage и heal ({ID, Change, Amount, Value, Max, Hit, Source}), death ({ID, By, Hit}), revive, health (любое изменение);
- Configure({Mode, Send, FriendlyFire}) меняет настройки; Step(elapsed) — регенерация;
- Receive(message) — сообщение транспорта. Хозяин принимает запросы клиентов (damage, heal, revive) как свои. Клиент принимает состояния хозяина по одному разу и в порядке хозяина: старый Seq и повтор отбрасываются;
- Save() и Load(saved) — {Version, States}.

Of(scene) — реестр сцены, один на её элемент. Он читает черту Health объектов (Max, Armor, Resist, Parts, Regen, Death) и Values.Health и пишет значение обратно в Values.Health. Каждое попадание оружия сцены (hit) он превращает в Damage. При гибели делает то, что сказано в Death:
- remove — убрать (по умолчанию);
- break — разбить (Scene.Break);
- die — сыграть клип die и оставить;
- keep — ничего.

## Методы

- `Make(options)`
- `Of(scene)`

## Тесты

- [takes damage by the type and the part hit, less the armour, and tells damage, health and death once](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/services/Vitals/Vitals.test.js#L16) — `libraries/ElemenxGaming/services/Vitals/Vitals.test.js`
- [lets handlers change or cancel a change before it is applied; spares its own team; applies one change ID once](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/services/Vitals/Vitals.test.js#L47) — `libraries/ElemenxGaming/services/Vitals/Vitals.test.js`
- [keeps a host and its clients the same: a client asks, the host applies and sends the state, in order](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/services/Vitals/Vitals.test.js#L72) — `libraries/ElemenxGaming/services/Vitals/Vitals.test.js`
- [regenerates, saves and loads, and reads what it does not know yet](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/services/Vitals/Vitals.test.js#L107) — `libraries/ElemenxGaming/services/Vitals/Vitals.test.js`
