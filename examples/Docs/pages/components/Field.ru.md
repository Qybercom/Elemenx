<!-- generated -->
# Field

Подпись, подсказка и ошибка вокруг поля ввода. Error показывает собственную ошибку. В форме Field показывает ошибки элемента управления сервиса Forms, когда тот затронут (поле один раз покинуто или форма отправлена):

- Control — элемент управления, созданный в коде (Forms.Control или Model.Get('email') группы);
- или Name внутри Form: поле спрашивает у Form элемент с этим именем; если в модели формы его нет, он создаётся из самого поля: начальное значение (Value или значение поля внутри) и валидаторы Required, Email, Min, Max, MinLength, MaxLength, Pattern и Match (имя поля, значение которого нужно повторить).

Значение берётся из поля внутри: нативного (input, textarea, select: его value или checked у флажка) или компонента ElemenxUI (его change); элемент считается затронутым, когда фокус покидает поле, а значение, заданное в коде, возвращается в нативное поле. Messages ({required: 'текст'...}) задают свои тексты ошибок, иначе используются фразы сервиса Forms.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Label` | `''` |
| `Hint` | `''` |
| `Error` | `''` |
| `Required` | `false` |
| `Horizontal` | `false` |
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
