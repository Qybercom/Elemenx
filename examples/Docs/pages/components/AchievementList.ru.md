<!-- generated -->
# AchievementList

Витрина достижений сервиса Achievements: карточка на каждое — значок в цвете его редкости, название, текст, очки и насколько оно продвинулось; неполученные приглушены, у секретного название и текст скрыты, скрытое появляется только после получения. Group показывает одну группу, Filter — все, полученные или неполученные; Summary добавляет сверху, сколько получено и сколько очков. Следит за изменениями сервиса.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Group` | `''` |
| `Filter` | `'all'` |
| `Summary` | `true` |
| `Label` | `''` |

## Тесты

- [shows a card for each, locked and secret ones as they are, and follows unlocks and progress](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/AchievementList/AchievementList.test.js#L52) — `libraries/ElemenxUI/components/AchievementList/AchievementList.test.js`
- [shows one group, the unlocked or the locked ones, and no summary when told](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/AchievementList/AchievementList.test.js#L84) — `libraries/ElemenxUI/components/AchievementList/AchievementList.test.js`
