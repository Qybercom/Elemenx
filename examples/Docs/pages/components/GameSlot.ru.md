<!-- generated -->
# GameSlot

Ячейка панели действий (хотбара): кнопка с Icon или Image, Label для подсказки и экранных читалок, Count и Rarity (common, uncommon, rare, epic, legendary). Key привязывает сочетание через сервис Hotkeys ('1', 'Q') и показывает его (это управление игрой, а не команда: списки сочетаний его не показывают). Нажатие (или клавиша) отправляет use, пока ячейка готова; с Cooldown (миллисекунды) затем идёт перезарядка: по ячейке бежит развёртка с оставшимися секундами, в конце отправляется ready. Cool(миллисекунды) запускает перезарядку из кода (например, общую); Active помечает включённое действие; Disabled, Size (small, medium, large). Несколько ячеек в ряд: <div class="elemenx-game-hotbar">. Color окрашивает стекло под иконкой (по умолчанию цвет Rarity; Rarity ещё и обрамляет); Badge — метка в углу ('+5'), Classes — дополнительные классы для своего вида. Data — содержимое ячейки (игровой предмет {ID, Name, Icon, Count, Stack...} или умение). Ячейка — место игровых перетаскиваний: её можно тащить (Draggable, по умолчанию true; *draggable с Type 'game-item' и Data {Item, From}, From {Kind: 'slot', Key, Name: Group}) и на неё можно бросать (Accept — принимаемые Type, по умолчанию ['game-item']; [] — ничего): drop несёт {Item, From, To, Current} (Current — Data), а владелец перемещает предмет через GameItems.Move. Указатель или фокус на ячейке, в Data которой есть не только название (Description, Type, Rarity, Stats), показывают её карточку (GameItemCard), как в инвентаре; при прокрутке страницы она следует за ячейкой.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Icon` | `''` |
| `Image` | `''` |
| `Label` | `''` |
| `Key` | `''` |
| `Count` | `0` |
| `Rarity` | `''` |
| `Cooldown` | `0` |
| `Active` | `false` |
| `Disabled` | `false` |
| `Size` | `'medium'` |
| `Color` | `''` |
| `Accept` | `['game-item']` |
| `Draggable` | `true` |
| `Data` | `null` |
| `Group` | `''` |
| `Badge` | `''` |
| `Classes` | `''` |

## События

- `use`: Нажата (или её клавиша), пока готова: {Label, Key}.
- `ready`: Перезарядка закончилась: {Label, Key}.
- `drop`: На неё брошен предмет: {Item, From, To, Current, Type}.

## Методы

- `Cool(milliseconds)`

## Пример

```example
<div class="elemenx-game-hotbar">
	<GameSlot Key="1" Icon="fire" Label="Fireball" Cooldown="3000" Color="#b8402a" (use)="Used" />
	<GameSlot Key="2" Icon="leaf" Label="Heal" Cooldown="5000" Color="#3f9a44" (use)="Used" />
	<GameSlot Key="3" Icon="star" Label="Blink" Cooldown="1500" Active="true" (use)="Used" />
	<GameSlot Key="4" Icon="heart" Label="Health potion" Count="3" Rarity="epic" Badge="+3" (use)="Used" />
	<GameSlot Key="5" />
</div>
<p class="elemenx-text small muted">Press a slot or its key: {{Note}}</p>
<script>
({
	Note: '—',

	Used: function (event) {
		this.Note = event.Label + ' used at ' + new Date().toLocaleTimeString();
	}
})
</script>
```

## Тесты

- [the card of a GameSlot and of a GameInventory follows its element when the page moves it without a scroll](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-misc.test.js#L241) — `tests/regression/library-misc.test.js`
