<!-- generated -->
# Field

Подпись, подсказка и ошибка вокруг поля ввода. Error показывает собственную ошибку. В форме Field показывает ошибки элемента управления сервиса Forms, когда тот затронут (поле один раз покинуто или форма отправлена):

- Control — элемент управления, созданный в коде (Forms.Control или Model.Get('email') группы);
- или Name внутри Form: поле спрашивает у Form элемент с этим именем; если в модели формы его нет, он создаётся из самого поля: начальное значение (Value или значение поля внутри) и валидаторы Required, Email, Min, Max, MinLength, MaxLength, Pattern и Match (имя поля, значение которого нужно повторить).

Значение берётся из поля внутри: нативного (input, textarea, select: его value или checked у флажка) или компонента ElemenxUI (его change); элемент считается затронутым, когда фокус покидает поле, а значение, заданное в коде, возвращается в нативное поле. Messages ({required: 'текст'...}) задают свои тексты ошибок, иначе используются фразы сервиса Forms.

Horizontal ставит подпись рядом с полем. Size small — компактная строка (лента, панель настроек): узкая подпись мелким шрифтом, по центру строки с полем.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Label` | `''` |
| `Hint` | `''` |
| `Error` | `''` |
| `Required` | `false` |
| `Horizontal` | `false` |
| `Size` | `'medium'` |
| `Disabled` | `false` |
| `Control` | `null` |
| `Name` | `''` |
| `Value` | `''` |
| `Email` | `false` |
| `Min` | `null` |
| `Max` | `null` |
| `MinLength` | `null` |
| `MaxLength` | `null` |
| `Pattern` | `''` |
| `Match` | `''` |
| `Messages` | `null` |

## Слоты

по умолчанию

## Пример

```example
<Field Label="Name" Hint="As it is written in your passport." Required="true"><Input Placeholder="Your name" /></Field>
<Field Label="Email" Error="This address is taken."><Input Type="email" Value="ada@example.com" Invalid="true" /></Field>
<Field Label="Plan" Horizontal="true"><Select [options]="[{Value: 'free', Label: 'Free'}, {Value: 'pro', Label: 'Pro'}]" Value="pro" /></Field>
<Field Label="Disabled" Disabled="true"><Input Value="Read only for now" Disabled="true" /></Field>
```

## Тесты

- [Field names the control inside by its Label, unless the control has a name of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L327) — `tests/regression/library-forms.test.js`
- [GameStat shows its value, unit and name, stacked by default, inline with the name after the value, of its tone and size](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L40) — `tests/regression/library-game-stats.test.js`
- [GameStats draws a GameStat for each item on a panel, follows a change of a value, and keeps what is put in its slot](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L57) — `tests/regression/library-game-stats.test.js`
- [Field Size small sets its label narrow, of small type, in line with its control](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L76) — `tests/regression/library-game-stats.test.js`
- [a GameHud in the hud of a scene lets the pointer through to the scene, but its contents take it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L88) — `tests/regression/library-game-stats.test.js`
- [runs a flow: events, branches, variables, loops, delays, actions of the context and what it tells](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L462) — `tests/regression/blueprints.test.js`
- [makes a generator JavaScript that gives the very values of its Run, many times faster; a graph with a block of no code gives null](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L697) — `tests/regression/blueprints.test.js`
- [tree-shakes unused Library Components and keeps transitive Component dependencies](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/builder-multi-application.test.js#L226) — `tests/regression/builder-multi-application.test.js`
- [takes an action through the trigger a handler is given, and runs its flow: its events, the actions of the scene](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-triggers.test.js#L172) — `tests/regression/library-triggers.test.js`
- [Form nests the values of Fields named by parts (user\[name\], items\[ID\]\[title\], tags\[\]) and follows the rows of a *for that come and go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L270) — `tests/regression/library-forms.test.js`
