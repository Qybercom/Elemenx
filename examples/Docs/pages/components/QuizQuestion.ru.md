<!-- generated -->
# QuizQuestion

Объявление вопроса в шаблоне Quiz: <QuizQuestion ID="capital" Text="Столица Франции?"> с QuizOption внутри. Принимает свойства вопроса Quiz (ID, Text, Type, Points, Answer — у текста варианты через |, Tolerance, Explanation, Image, Next). Сам ничего не показывает: его читает Quiz.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Text` | `''` |
| `Type` | `'single'` |
| `Points` | `null` |
| `Answer` | `null` |
| `Tolerance` | `null` |
| `Explanation` | `''` |
| `Image` | `''` |
| `Next` | `''` |

## Слоты

по умолчанию

## Тесты

- [asks its questions given and declared, scores single, multiple, text, number and order, and reviews them at the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-quiz.test.js#L44) — `tests/regression/library-quiz.test.js`
