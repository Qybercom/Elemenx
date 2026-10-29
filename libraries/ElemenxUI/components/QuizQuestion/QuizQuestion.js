/*
 * The declaration of a question in the template of a Quiz: <QuizQuestion ID="capital" Text="The capital of France?">
 * with its QuizOption inside. It takes the props of a question of Quiz (ID, Text, Type, Points, Answer, Tolerance,
 * Explanation, Image, Next). It shows nothing by itself: Quiz reads it.
 */
Elemenx.Component('QuizQuestion', {
	$TemplateURL: 'QuizQuestion.html',
	$Meta: {
		Group: 'inputs',
		Icon: 'help',
		Description: 'The declaration of a question in the template of a Quiz: <QuizQuestion ID="capital" Text="The capital of France?">.',
		Container: true,
		Children: ['QuizOption'],
		Props: {
			ID: 'The ID of the question.',
			Text: 'The question.',
			Type: {Options: ['single', 'multiple', 'text', 'number', 'order'], Description: 'single, multiple, text, number or order.'},
			Points: 'The points of a right answer (1).',
			Answer: 'The right answer of a text (texts separated by |) or of a number.',
			Tolerance: 'How far from the Answer a number may be.',
			Explanation: 'Why the answer is the one it is, shown after.',
			Image: 'A picture with the question.',
			Next: 'The ID of the question that comes next (end: the end).'
		},
		Sample: {ID: 'capital', Text: 'The capital of France?'}
	},
	ID: '',
	Text: '',
	Type: 'single',
	Points: null,
	Answer: null,
	Tolerance: null,
	Explanation: '',
	Image: '',
	Next: '',

	$OnCreate: function () {
		this.Declared = function (id, text, type, points, answer, tolerance, explanation, image, next) {
			var item = {ID: id, Text: text, Type: type};

			if (points !== null && points !== undefined && points !== '')
				item.Points = Number(points);

			if (answer !== null && answer !== undefined && answer !== '')
				item.Answer = type === 'number' ? Number(answer) : String(answer).split('|');

			if (tolerance !== null && tolerance !== undefined && tolerance !== '')
				item.Tolerance = Number(tolerance);

			if (explanation)
				item.Explanation = explanation;

			if (image)
				item.Image = image;

			if (next)
				item.Next = next;

			return JSON.stringify(item);
		};
	}
});
