<!-- generated -->
# GameArms

The arms of a ship against ships, declared inside a Scene (the trait SceneBehaviour): what ArmsOf of the scene gives of For (an ID; empty: the ship of the hero, the one it is, sits in or walks in) each Every seconds (0.2), SceneMissiles: its missiles left (or reloading), its heavy missiles (Hunters), its locks (closing, then locked), its torpedoes and its mass driver (their rounds, a press launches one or fires it with the lead), its lance (charging, burning, cooling; a press at the target), its railgun faster than light (charging; a press at the target, by a tunnel to where it will be or, Direct, into it), its flares left and its point defence; a warning while a missile comes at it (how many, how soon) or another locks it. Launch fires a salvo at what it locked (Launch of the scene), Flares releases flares, the switch turns point defence on and off; the events launch ({Count}) and flares ({Count}). None while the ship has none of them. Put it on the screen of the console of a gunner (in GameConsole it is, of the gunner, the tactical officer, the pilot and the captain) and in the instruments over the view (GameFlight with Arms). Size small, medium or large; Label names it for screen readers.

## Properties

| Property | Default |
| --- | --- |
| `For` | `''` |
| `Every` | `0.2` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `Arms` | `null` |

## Events

- `hunter`: A salvo of heavy missiles was launched: {Count}.
- `torpedo`: A torpedo was launched: {Count}.
- `drive`: The mass driver fired: {Done}.
- `lance`: The lance began to charge: {Done}.
- `railgun`: The railgun faster than light began to charge: {Done, Mode}.
- `launch`: A salvo was launched: {Count (0: none, nothing locked or none left)}.
- `flares`: Flares were released: {Count}.

## Example

```example
<p class="elemenx-caption">GameArms reads the arms of the ship of the Scene it stands in: here, as if the ship had locked a raider while two missiles came at it (Show takes them as ArmsOf gives them).</p>
<GameArms #arms />
<Button Label="In a fight" (click)="Fight" />
<script>
({
	Fight: function () {
		this.$Ref('arms', true).Show({Missiles: 'ship-missile', Left: 6, Magazine: 8, Reloading: false, Locks: [{ID: 'raider', Progress: 1, Locked: true}], Locked: ['raider'], Flares: {Left: 20, Count: 24}, Defence: {Weapon: 'ship-pd', On: true}, Incoming: 2, Soonest: 3.4, LockedBy: ['raider'], Flying: 2});
	}
})
</script>
```

## Tests

- [GameArms shows what a ship has, its locks and the warning of a missile at it, and is hidden for a ship with none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-arms.test.js#L38) — `tests/regression/library-game-arms.test.js`
- [GameRadar marks missiles small, the one at the vehicle as incoming, flares as sparks](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-arms.test.js#L138) — `tests/regression/library-game-arms.test.js`
