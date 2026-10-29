/*
 * The declaration of an option of a question in the template of a Quiz, inside a QuizQuestion: <QuizOption ID="paris"
 * Correct="true">Paris</QuizOption>; its text is what it holds. Correct marks a right one; Next the question an
 * answer of it leads to. It shows nothing by itself.
 */
Elemenx.Component('QuizOption', {
	$TemplateURL: 'QuizOption.html',
	$Meta: {
		Group: 'inputs',
		Icon: 'check',
		Description: 'The declaration of an option of a question of a Quiz: <QuizOption ID="paris" Correct="true">Paris</QuizOption>.',
		Container: true,
		Props: {
			ID: 'The ID of the option.',
			Correct: 'Marks a right option.',
			Next: 'The ID of the question an answer of it leads to.'
		},
		Sample: {ID: 'paris', Correct: true}
	},
	ID: '',
	Correct: false,
	Next: '',

	$OnCreate: function () {
		this.Declared = function (id, correct, next) {
			var item = {ID: id};

			if (correct === true || correct === 'true')
				item.Correct = true;

			if (next)
				item.Next = next;

			return JSON.stringify(item);
		};
	}
});
