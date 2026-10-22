<!-- generated -->
# GameHud

Рамка игрового экрана: сцена (слот по умолчанию: canvas, картинка) и интерфейс поверх неё в девяти областях-слотах: top-start, top, top-end, start, center, end, bottom-start, bottom, bottom-end. Области пропускают указатель к сцене, их содержимое — забирает. Padding — отступ областей от краёв. Высота — как у контейнера.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Padding` | `16` |
| `Label` | `''` |

## Слоты

по умолчанию, `top-start`, `top`, `top-end`, `start`, `center`, `end`, `bottom-start`, `bottom`, `bottom-end`

## Пример

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
