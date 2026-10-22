<!-- generated -->
# GameItems

The rules of moving the items of a game: what lies where after an item is moved onto a place. An item is an object with an ID and a Count; Stack is the most a pile of it holds (more than 1: it stacks).

- Stacks(a, b) tells whether b piles onto a: the same ID, a Stack over 1, and room left on a.
- Move(item, current) returns {To, From}: what the target place holds after item comes onto it (current is what it held), and what goes back to the place the item came from. Piles join (up to Stack, the rest stays where it came from); other items swap. To and From are new objects (or null): the old ones are not changed.
- Take(item, count) returns the item with count less (null when none is left), for an item that is used up.
- Place(element) is where the card of an item (GameItemCard) shows beside an element: a style that fixes it to the viewport, on the side with room. Carded(item) tells whether an item has more to show than its name.

## Methods

- `Stacks(a, b)`
- `Move(item, current)`
- `Take(item, count)`
- `Place(element)`
- `Carded(item)`

## Example

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
