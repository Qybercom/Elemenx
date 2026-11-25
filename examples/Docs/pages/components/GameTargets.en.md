<!-- generated -->
# GameTargets

Marks over the view of a Scene on what the vehicle of the hero knows (Contacts of SceneTactics), declared inside it in its slot hud (the trait SceneBehaviour): a frame on each and how far it is (the target its name too: the scene names the rest), a foe red, a friend green, a place a point; its target marked, and at a turret the lead (where to aim for a shot of its weapon to meet it as it moves: of the Speed of the weapon; with a mass driver, SceneMissiles Driver, on its target in any mode; a ray needs none). Show auto shows by the mode of the seat (radar: all, turret: the foes and the target, helm: the places and the target, strategic: the foes, the places and the target, else none), all or target only those. A press on a mark makes it the target of the vehicle (SetTarget). Missiles (SceneMissiles): one at the vehicle always (red, how soon it meets it), the others where foes are shown; the locks of the vehicle as brackets closing on their targets, red when locked. For is the vehicle (empty: the one the hero sits in); Label names it for screen readers.

## Properties

| Property | Default |
| --- | --- |
| `For` | `''` |
| `Show` | `'auto'` |
| `Label` | `''` |
| `Marks` | `[]` |

## Example

```example
<p class="elemenx-caption">GameTargets stands over the view of a Scene, in its slot hud: it marks there what the vehicle the hero sits in knows (out of a scene it shows nothing). In the Locations demo: G at a console of the parked ship, then Radar or Turret.</p>
<GameTargets Show="all" />
```

## Tests

- [gives a seat the modes of its role and the command seat those of the roles no seat has; mans a turret, knows what is round, shares a target](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tactics.test.js#L47) — `tests/regression/library-tactics.test.js`
