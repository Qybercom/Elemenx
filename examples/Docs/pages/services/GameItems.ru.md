<!-- generated -->
# GameItems

Правила перемещения предметов игры: что где лежит после того, как предмет перенесли на место. Предмет — объект с ID и Count; Stack — сколько их вмещает стопка (больше 1 — предмет складывается).

- Stacks(a, b) сообщает, ложится ли b на a: тот же ID, Stack больше 1 и на a осталось место.
- Move(item, current) возвращает {To, From}: что лежит на целевом месте после того, как туда пришёл item (current — что там было), и что возвращается на место, откуда пришёл предмет. Стопки объединяются (до Stack, остаток остаётся на месте), другие предметы меняются местами. To и From — новые объекты (или null): старые не меняются.
- Take(item, count) возвращает предмет с количеством меньше на count (null, если ничего не осталось) — для израсходованного предмета.
- Place(element) — где карточка предмета (GameItemCard) показывается рядом с элементом: стиль, закрепляющий её в окне, со стороны, где есть место. Carded(item) сообщает, есть ли у предмета что показать, кроме названия.

## Методы

- `Stacks(a, b)`
- `Move(item, current)`
- `Take(item, count)`
- `Place(element)`
- `Carded(item)`

## Пример

```example
<p class="elemenx-text">A potion (5 of 20) dropped on a pile of 18: <strong>{{Result}}</strong></p>
<p class="elemenx-text">A sword dropped on a potion: <strong>{{Swap}}</strong></p>
<p class="elemenx-text">One potion of 5 used: <strong>{{Taken}}</strong></p>
<script>
({
	Result: '',
	Swap: '',
	Taken: '',

	$OnCreate: function () {
		var items = this.$Service('GameItems');
		var potion = {ID: 'potion', Name: 'Potion', Count: 5, Stack: 20};
		var pile = {ID: 'potion', Name: 'Potion', Count: 18, Stack: 20};
		var sword = {ID: 'sword', Name: 'Sword'};
		var move = items.Move(potion, pile);
		var swap = items.Move(sword, potion);
		var taken = items.Take(potion, 1);

		this.Result = 'the pile has ' + move.To.Count + ', ' + (move.From ? move.From.Count + ' go back' : 'nothing goes back');
		this.Swap = 'the place holds the ' + swap.To.Name + ', the ' + swap.From.Name + ' goes back';
		this.Taken = taken.Count + ' left';
	}
})
</script>
```
