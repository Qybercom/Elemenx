<!-- generated -->
# AchievementList

The showcase of the achievements of the Achievements Service: a card for each, its badge in the color of its rarity, its title, text, points and how far it has come, the locked ones dimmed, a secret one with its title and text kept back, a hidden one only once unlocked. Group shows one group, Filter all, unlocked or locked ones; Summary heads it with how many are unlocked and their points. It follows the Service as it changes.

## Properties

| Property | Default |
| --- | --- |
| `Group` | `''` |
| `Filter` | `'all'` |
| `Summary` | `true` |
| `Label` | `''` |

## Tests

- [shows a card for each, locked and secret ones as they are, and follows unlocks and progress](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/AchievementList/AchievementList.test.js#L52) — `libraries/ElemenxUI/components/AchievementList/AchievementList.test.js`
- [shows one group, the unlocked or the locked ones, and no summary when told](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/AchievementList/AchievementList.test.js#L84) — `libraries/ElemenxUI/components/AchievementList/AchievementList.test.js`
