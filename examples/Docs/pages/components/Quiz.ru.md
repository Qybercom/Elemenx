<!-- generated -->
# Quiz

Квиз или опрос: по одному вопросу под полосой прогресса, в конце — счёт с разбором. Questions: [{ID, Text, Type, Options: [{ID, Text, Correct, Next}], Points, Answer, Tolerance, Explanation, Image, Next}] или объявленные внутри QuizQuestion со своими QuizOption (текст варианта — его содержимое). Type: single (один вариант), multiple (все верные и ни одного неверного), text (один из текстов Answer, без учёта регистра и пробелов по краям), number (Answer плюс-минус Tolerance) или order (варианты в том порядке, в каком заданы; показываются перемешанными, переставляются кнопками). Points (1) — баллы за верный ответ. Next ведёт к другому вопросу (его ID или end): сначала Next выбранного варианта, потом вопроса, иначе следующий по списку; Back возвращает назад тем же путём. Mode: quiz (с баллами) или survey (только собирает ответы). Feedback: instant (ответ проверяется сразу, с Explanation), end (в разборе в конце, по умолчанию) или none. PassScore — процент для прохождения (70), TimeLimit — секунды на всё (0 — без ограничения), Shuffle перемешивает варианты, Title и Intro дают стартовый экран. События: start, answer ({Question, Value, Correct, Points}), finish ({Score, Max, Percent, Passed, Answers}). Методы: Start(), Restart(). Слот result — своё содержимое на экране результата.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Questions` | `[]` |
| `Mode` | `'quiz'` |
| `Feedback` | `'end'` |
| `PassScore` | `70` |
| `TimeLimit` | `0` |
| `Shuffle` | `false` |
| `Back` | `true` |
| `Title` | `''` |
| `Intro` | `''` |
| `Answers` | `{}` |

## События

- `start`
- `answer`
- `finish`

## Слоты

`result`, по умолчанию

## Методы

- `Start()`
- `Restart()`

## Пример

```example
<Quiz Title="Geography" Intro="Three questions, checked at once." Feedback="instant" [questions]="Questions" (finish)="Finished">
	<QuizQuestion ID="capital" Text="The capital of France?" Explanation="Paris has been the capital since 508.">
		<QuizOption ID="paris" Correct="true">Paris</QuizOption>
		<QuizOption ID="lyon">Lyon</QuizOption>
		<QuizOption ID="marseille">Marseille</QuizOption>
	</QuizQuestion>
</Quiz>
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Text: 'Start the quiz.',
	Questions: [
		{ID: 'sea', Text: 'The sea of Odesa?', Type: 'text', Answer: ['Black', 'Black Sea']},
		{ID: 'rivers', Text: 'From the longest', Type: 'order', Options: [{ID: 'nile', Text: 'Nile'}, {ID: 'amazon', Text: 'Amazon'}, {ID: 'yangtze', Text: 'Yangtze'}]}
	],

	Finished: function (event) {
		this.Text = event.Score + ' of ' + event.Max + ' (' + event.Percent + '%)';
	}
})
</script>
```

## Тесты

- [asks its questions given and declared, scores single, multiple, text, number and order, and reviews them at the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-quiz.test.js#L44) — `tests/regression/library-quiz.test.js`
- [checks at once with instant feedback, branches by the option chosen, goes back the way it came, and ends at its time](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-quiz.test.js#L145) — `tests/regression/library-quiz.test.js`
- [gathers the answers of a survey without scoring them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-quiz.test.js#L210) — `tests/regression/library-quiz.test.js`
- [quiz starts from its screen, checks each answer at once, and scores the end](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L7761) — `tests/examples/ui-kit.spec.js`
