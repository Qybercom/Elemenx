<!-- generated -->
# GameCombat

GameCombat: здоровье того, что можно ранить в игре сцены. Объявляется внутри Scene: `<Scene> ... <GameCombat Bars="hurt" /> </Scene>` (черта SceneBehaviour). Держит реестр сцены (Vitals.Of): объекты с чертой Health, урон от каждого попадания оружия сцены, гибель по Death. Тот же реестр используют GameStrategy и любые другие части игры.

Свойства:
- Bars — полоски здоровья над тем, у кого оно есть: hurt (только у раненых), always, never;
- FriendlyFire — засчитывать удары по своим;
- Authority: local, host (каждое изменение рассылается через Send), client (изменение запрашивается у хозяина через Send, ответы принимает Receive);
- Send — функция транспорта приложения.

Методы: Damage(id, hit), Heal(id, amount, source), Revive(id, value), HealthOf(id), Alive(id), Before(handler), Receive(message), Ledger().

События: damage, heal, death, revive, health. Когда герой убивает цель, прицел на миг краснеет (Scene.Killed).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Bars` | `'hurt'` |
| `FriendlyFire` | `false` |
| `Authority` | `'local'` |
| `Send` | `null` |

## Методы

- `Ledger()`
- `Damage(id, hit)`
- `Heal(id, amount, source)`
- `Revive(id, value)`
- `HealthOf(id)`
- `Alive(id)`
- `Before(handler)`
- `Receive(message)`

## Тесты

- [makes damage of each hit of a shot, by the material of what it hits, and removes what has no health left](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js#L67) — `libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js`
- [breaks what dies with Death break: its pieces fly from where the shot hit](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js#L94) — `libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js`
- [sends each change out as a host, takes a request of a client by Receive, and holds a handler of the rules](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js#L108) — `libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js`
- [has the armed units of a strategy shoot their foe from afar until it is gone](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js#L140) — `libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js`
