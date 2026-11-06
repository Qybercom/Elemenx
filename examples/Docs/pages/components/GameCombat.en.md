<!-- generated -->
# GameCombat

The health of what a game of a Scene can hurt, declared inside it: <Scene> ... <GameCombat Bars="hurt" /> </Scene> (the trait SceneBehaviour). It holds the ledger of the scene (the Vitals Service, Of(scene)): the objects with the trait Health (Max, Armor, Resist, Parts, Regen, Death: remove, break, die or keep), each hit of the weapons of the scene made damage, a death done as its Death says. The same ledger is the one of GameStrategy and of any other part of the game.

Bars: the bars of health over what has it (hurt: only the hurt, always, never). FriendlyFire: a hit of a Team on its own counts. Authority: local (by default), host (each change is sent out by Send), client (a change is asked of the host by Send; Receive(message) takes what comes back). Send: the function of the transport of the application (message).

Methods: Damage(id, hit), Heal(id, amount, source), Revive(id, value), HealthOf(id) ({ID, Value, Max, Part, Alive, Team, By}), Alive(id), Before(handler) (a handler of each change before it is applied: false cancels it, Amount changes it; returns the function that removes it), Receive(message), Ledger() (the ledger itself). Events: damage, heal ({ID, Change, Amount, Value, Max, Hit, Source}), death ({ID, By, Hit}), revive ({ID, Value}), health ({ID, Value, Max}).

## Properties

| Property | Default |
| --- | --- |
| `Bars` | `'hurt'` |
| `FriendlyFire` | `false` |
| `Authority` | `'local'` |
| `Send` | `null` |

## Methods

- `Ledger()`
- `Damage(id, hit)`
- `Heal(id, amount, source)`
- `Revive(id, value)`
- `HealthOf(id)`
- `Alive(id)`
- `Before(handler)`
- `Receive(message)`

## Tests

- [makes damage of each hit of a shot, by the material of what it hits, and removes what has no health left](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js#L67) — `libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js`
- [breaks what dies with Death break: its pieces fly from where the shot hit](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js#L94) — `libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js`
- [sends each change out as a host, takes a request of a client by Receive, and holds a handler of the rules](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js#L108) — `libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js`
- [has the armed units of a strategy shoot their foe from afar until it is gone](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js#L140) — `libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js`
