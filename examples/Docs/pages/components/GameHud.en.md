<!-- generated -->
# GameHud

The frame of a game screen: the scene (the default slot: a canvas, a picture) and the HUD over it, in nine areas named by slots: top-start, top, top-end, start, center, end, bottom-start, bottom, bottom-end. The areas let the pointer through to the scene; their content takes it. Padding is the distance of the areas from the edges. It is as high as its container.

## Properties

| Property | Default |
| --- | --- |
| `Padding` | `16` |
| `Label` | `''` |

## Slots

default, `top-start`, `top`, `top-end`, `start`, `center`, `end`, `bottom-start`, `bottom`, `bottom-end`

## Example

```example
<div class="docs-frame">
	<GameHud Label="An example game">
		<div style="width: 100%; height: 100%; background: url(/data/cards/mountains.svg) center / cover;"></div>
		<div slot="top-start" class="elemenx-game-panel light"><GameBar Kind="health" Value="82" Max="100" Label="Health" /><GameBar Kind="mana" Value="46" Max="100" Label="Mana" /></div>
		<div slot="top-end" class="elemenx-game-panel light"><strong>Northern woods</strong></div>
		<div slot="bottom" class="elemenx-game-hotbar">
			<GameSlot Key="1" Icon="fire" Label="Fireball" Cooldown="3000" Color="#b8402a" />
			<GameSlot Key="2" Icon="leaf" Label="Heal" Cooldown="5000" Color="#3f9a44" />
			<GameSlot Key="3" Icon="heart" Label="Potion" Count="3" Rarity="common" />
		</div>
	</GameHud>
</div>
```

## Tests

- [GameStat shows its value, unit and name, stacked by default, inline with the name after the value, of its tone and size](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L40) — `tests/regression/library-game-stats.test.js`
- [GameStats draws a GameStat for each item on a panel, follows a change of a value, and keeps what is put in its slot](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L57) — `tests/regression/library-game-stats.test.js`
- [Field Size small sets its label narrow, of small type, in line with its control](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L76) — `tests/regression/library-game-stats.test.js`
- [a GameHud in the hud of a scene lets the pointer through to the scene, but its contents take it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L88) — `tests/regression/library-game-stats.test.js`
- [shows the instruments of the hero as it changes: of the car it drives, of the character once it left it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-dash.test.js#L78) — `tests/regression/library-game-dash.test.js`
- [shows the systems of a ship and gives an engineer the hands of its power](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-dash.test.js#L134) — `tests/regression/library-game-dash.test.js`
