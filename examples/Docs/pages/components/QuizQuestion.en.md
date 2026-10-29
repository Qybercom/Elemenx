<!-- generated -->
# QuizQuestion

The declaration of a question in the template of a Quiz: <QuizQuestion ID="capital" Text="The capital of France?"> with its QuizOption inside. It takes the props of a question of Quiz (ID, Text, Type, Points, Answer, Tolerance, Explanation, Image, Next). It shows nothing by itself: Quiz reads it.

## Properties

| Property | Default |
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

## Slots

default

## Tests

- [asks its questions given and declared, scores single, multiple, text, number and order, and reviews them at the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-quiz.test.js#L44) — `tests/regression/library-quiz.test.js`
