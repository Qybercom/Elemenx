<!-- generated -->
# QuizOption

The declaration of an option of a question in the template of a Quiz, inside a QuizQuestion: <QuizOption ID="paris" Correct="true">Paris</QuizOption>; its text is what it holds. Correct marks a right one; Next the question an answer of it leads to. It shows nothing by itself.

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `Correct` | `false` |
| `Next` | `''` |

## Slots

default

## Tests

- [asks its questions given and declared, scores single, multiple, text, number and order, and reviews them at the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-quiz.test.js#L44) — `tests/regression/library-quiz.test.js`
