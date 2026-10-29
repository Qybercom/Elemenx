<!-- generated -->
# QuizOption

Объявление варианта ответа внутри QuizQuestion: <QuizOption ID="paris" Correct="true">Париж</QuizOption>. Его текст — содержимое; Correct отмечает верный вариант, Next ведёт к другому вопросу (его ID или end). Сам ничего не показывает: его читает Quiz.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Correct` | `false` |
| `Next` | `''` |

## Слоты

по умолчанию

## Тесты

- [asks its questions given and declared, scores single, multiple, text, number and order, and reviews them at the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-quiz.test.js#L44) — `tests/regression/library-quiz.test.js`
