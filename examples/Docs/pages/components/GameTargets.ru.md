<!-- generated -->
# GameTargets

Метки поверх вида сцены на том, что знает транспорт героя (Contacts, SceneTactics). Объявляется внутри сцены в слоте hud (трейт SceneBehaviour).

На каждом контакте — рамка и расстояние (у цели ещё и имя, остальных называет сама сцена): противник красный, свой зелёный, место — цвет акцента. Цель отмечена крупной пунктирной рамкой, а в турели — ещё и точкой упреждения: куда целиться, чтобы снаряд её оружия встретил движущуюся цель (по Speed оружия; лучу упреждение не нужно).

Ракеты (SceneMissiles): ракета в транспорт показывается всегда — красный мигающий ромб и через сколько секунд она дойдёт; остальные — там же, где показываются противники. Если у транспорта есть масс-драйвер (SceneMissiles), на его цели в любом режиме показана точка упреждения — куда стрелять, чтобы снаряд встретил цель. Захваты ракет транспорта — четыре уголка, которые сходятся на цели по мере захвата и краснеют, когда цель захвачена.

Show:

- `auto` — по режиму места: в радаре все, в турели противники и цель, у штурвала места и цель, в командовании противники, места и цель, иначе ничего;
- `all` — все;
- `target` — только цель.

Нажатие на метку делает её целью транспорта (SetTarget). For — транспорт (пусто — тот, где сидит герой), Label — название для экранного диктора. Сама рамка пропускает нажатия к виду: мимо меток мышь попадает в сцену.

Рамки — метки сцены (SceneMarks): каждая стоит на своём контакте, прячется за телами, а цель, ушедшая из вида, стоит у края со стрелкой к ней.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `For` | `''` |
| `Show` | `'auto'` |
| `Label` | `''` |
| `Marks` | `[]` |

## Пример

```example
<p class="elemenx-caption">GameTargets stands over the view of a Scene, in its slot hud: it marks there what the vehicle the hero sits in knows (out of a scene it shows nothing). In the Locations demo: G at a console of the parked ship, then Radar or Turret.</p>
<GameTargets Show="all" />
```

## Тесты

- [gives a seat the modes of its role and the command seat those of the roles no seat has; mans a turret, knows what is round, shares a target](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tactics.test.js#L47) — `tests/regression/library-tactics.test.js`
