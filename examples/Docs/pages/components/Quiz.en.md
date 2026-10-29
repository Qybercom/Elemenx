<!-- generated -->
# Quiz

A quiz or a survey: its questions one at a time, a bar of the progress, the score at the end.

Questions: [{ID, Text, Type, Options: [{ID, Text, Correct, Next}], Points, Answer, Tolerance, Explanation, Image, Next}], or declared inside it: QuizQuestion with its QuizOption (the text of an option is what it holds). Type: single (one option), multiple (all the right ones, no wrong one), text (one of the texts of Answer, without case and spaces round it), number (Answer, give or take Tolerance) or order (the options in the order they are given; shown mixed). Points (1) count a right answer. Next leads to another question (its ID, or end): the one of the option chosen first, else the one of the question, else the next one; Back goes back the way it came.

Mode quiz scores the answers; survey only gathers them (no right one). Feedback: instant (the answer is checked before the next question, with its Explanation), end (in the review at the end, the default) or none. PassScore is the percent that passes (70). TimeLimit gives the whole of it seconds (0: no limit): at 0 it ends. Shuffle mixes the options. Title and Intro make a screen to start from (Start).

Events: start, answer ({Question, Value, Correct, Points}), finish ({Score, Max, Percent, Passed, Answers}). Methods: Start(), Restart().

## Properties

| Property | Default |
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

## Events

- `start`: It started.
- `answer`: A question was answered: {Question, Value, Correct, Points}.
- `finish`: It ended: {Score, Max, Percent, Passed, Answers}.

## Slots

`result`, default

## Methods

- `Start()`
- `Restart()`

## Example

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

## Tests

- [asks its questions given and declared, scores single, multiple, text, number and order, and reviews them at the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-quiz.test.js#L44) — `tests/regression/library-quiz.test.js`
- [checks at once with instant feedback, branches by the option chosen, goes back the way it came, and ends at its time](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-quiz.test.js#L145) — `tests/regression/library-quiz.test.js`
- [gathers the answers of a survey without scoring them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-quiz.test.js#L210) — `tests/regression/library-quiz.test.js`
- [quiz starts from its screen, checks each answer at once, and scores the end](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L7761) — `tests/examples/ui-kit.spec.js`
