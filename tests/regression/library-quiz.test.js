import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('QuizHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

async function click (root, selector) {
	var node = root.querySelector(selector);

	(node.tagName === 'BUTTON' ? node : node.querySelector('button')).click();

	await tick(10);
}

function next (root) {
	return click(root, '.elemenx-quiz-next');
}

describe('Contract: Quiz', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Quiz', 'QuizQuestion', 'QuizOption']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('asks its questions given and declared, scores single, multiple, text, number and order, and reviews them at the end', async function () {
		var answers = [];
		var finished = [];
		var host = mount('<div><Quiz [questions]="Questions" PassScore="60" (answer)="Answered" (finish)="Finished"><QuizQuestion ID="capital" Text="The capital of France?" Explanation="Paris since 508."><QuizOption ID="paris" Correct="true">Paris</QuizOption><QuizOption ID="lyon">Lyon</QuizOption></QuizQuestion><QuizQuestion ID="sea" Text="The sea of Odesa?" Type="text" Answer="Black|Black Sea" /></Quiz></div>', {
			Questions: [
				{ID: 'sum', Text: 'Two plus two?', Type: 'number', Answer: 4, Points: 2},
				{ID: 'primes', Text: 'The primes?', Type: 'multiple', Options: [{ID: '2', Text: 'Two', Correct: true}, {ID: '3', Text: 'Three', Correct: true}, {ID: '4', Text: 'Four'}]},
				{ID: 'order', Text: 'From the smallest', Type: 'order', Options: [{ID: 'a', Text: 'One'}, {ID: 'b', Text: 'Two'}, {ID: 'c', Text: 'Three'}]}
			],
			Answered: function (event) {
				answers.push(event.Question.ID + ':' + event.Correct);
			},
			Finished: function (event) {
				finished.push(event);
			}
		});
		var root;
		var quiz;
		var order;

		expect(await waitFor(function () {
			return !!host.$Element().querySelector('.elemenx-quiz-question');
		}, 3000)).toBe(true);

		root = host.$Element();
		quiz = Elemenx.Instance(root.querySelector('.elemenx-quiz'));

		/* No Title nor Intro: it starts at once, with the given questions first. */
		expect(root.querySelector('.elemenx-quiz-question').getAttribute('data-question')).toBe('sum');
		expect(root.querySelector('button.elemenx-quiz-next').disabled).toBe(true);

		quiz.Chosen(4);

		await tick(10);

		await next(root);

		/* Two of the three, then the third wrong one taken back. */
		await click(root, '[data-option="2"]');
		await click(root, '[data-option="4"]');
		await click(root, '[data-option="3"]');
		await click(root, '[data-option="4"]');

		expect(root.querySelector('[data-option="2"]').getAttribute('aria-checked')).toBe('true');
		expect(root.querySelector('[data-option="4"]').getAttribute('aria-checked')).toBe('false');

		await next(root);

		/* An order is shown mixed, never in its right order; moved into it by its buttons. */
		order = Array.prototype.map.call(root.querySelectorAll('.elemenx-quiz-item'), function (item) {
			return item.getAttribute('data-item');
		});

		expect(order.join('')).not.toBe('abc');

		while (order.join('') !== 'abc') {
			var wanted = 'abc'.split('').filter(function (id, index) {
				return order[index] !== id;
			})[0];

			/* The first one out of its place goes up by its button. */
			await click(root, '.elemenx-quiz-item[data-item="' + wanted + '"] .elemenx-quiz-up');

			await tick(10);

			order = Array.prototype.map.call(root.querySelectorAll('.elemenx-quiz-item'), function (item) {
				return item.getAttribute('data-item');
			});
		}

		await next(root);

		/* The declared questions: the option text read from what it holds. */
		expect(root.querySelector('[data-option="paris"]').textContent.trim()).toBe('Paris');

		await click(root, '[data-option="lyon"]');

		await next(root);

		quiz.Chosen('  black sea ');

		await tick(10);

		await next(root);

		expect(answers).toEqual(['sum:true', 'primes:true', 'order:true', 'capital:false', 'sea:true']);
		expect(finished.length).toBe(1);
		expect(finished[0].Score).toBe(5);
		expect(finished[0].Max).toBe(6);
		expect(finished[0].Percent).toBe(83);
		expect(finished[0].Passed).toBe(true);
		expect(root.querySelectorAll('.elemenx-quiz-reviewed').length).toBe(5);
		expect(root.querySelector('.elemenx-quiz-reviewed[data-question="capital"]').classList.contains('wrong')).toBe(true);
		expect(root.querySelector('.elemenx-quiz-reviewed[data-question="capital"] .elemenx-quiz-review-answer').textContent).toBe('Lyon');
		expect(root.querySelector('.elemenx-quiz-reviewed[data-question="capital"] .elemenx-quiz-review-explanation').textContent).toBe('Paris since 508.');

		await click(root, '.elemenx-quiz-restart');

		expect(root.querySelector('.elemenx-quiz-question').getAttribute('data-question')).toBe('sum');
	});

	it('checks at once with instant feedback, branches by the option chosen, goes back the way it came, and ends at its time', async function () {
		var finished = [];
		var host = mount('<div><Quiz Title="Pets" Intro="Three questions" Feedback="instant" TimeLimit="2" [questions]="Questions" (finish)="Finished" /></div>', {
			Questions: [
				{ID: 'pet', Text: 'A pet?', Options: [{ID: 'cat', Text: 'A cat', Correct: true, Next: 'cat'}, {ID: 'none', Text: 'None', Next: 'end'}]},
				{ID: 'dog', Text: 'Its name?', Type: 'text', Answer: 'Rex'},
				{ID: 'cat', Text: 'Its age?', Type: 'number', Answer: 5, Tolerance: 1, Explanation: 'Give or take a year.'}
			],
			Finished: function (event) {
				finished.push(event);
			}
		});
		var root;
		var quiz;

		expect(await waitFor(function () {
			return !!host.$Element().querySelector('.elemenx-quiz-intro');
		}, 3000)).toBe(true);

		root = host.$Element();
		quiz = Elemenx.Instance(root.querySelector('.elemenx-quiz'));

		expect(root.querySelector('.elemenx-quiz-title').textContent).toBe('Pets');

		await click(root, '.elemenx-quiz-start');
		await click(root, '[data-option="cat"]');

		await next(root);

		/* Checked first: the right option marked, the answer kept by a second press. */
		expect(root.querySelector('.elemenx-quiz-feedback').classList.contains('right')).toBe(true);
		expect(root.querySelector('[data-option="cat"]').classList.contains('right')).toBe(true);

		await click(root, '[data-option="none"]');

		expect(root.querySelector('[data-option="none"]').getAttribute('aria-checked')).toBe('false');

		await next(root);

		/* The cat leads past the dog. */
		expect(root.querySelector('.elemenx-quiz-question').getAttribute('data-question')).toBe('cat');

		quiz.Chosen(6);

		await tick(10);

		await next(root);

		expect(root.querySelector('.elemenx-quiz-feedback').textContent).toContain('Give or take a year.');

		await click(root, '.elemenx-quiz-back');

		expect(root.querySelector('.elemenx-quiz-question').getAttribute('data-question')).toBe('pet');
		expect(root.querySelector('[data-option="cat"]').getAttribute('aria-checked')).toBe('true');

		/* The time runs out: it ends with what was answered. */
		expect(await waitFor(function () {
			return finished.length === 1;
		}, 4000)).toBe(true);

		expect(finished[0].Score).toBe(1);
		expect(finished[0].Max).toBe(1);
		expect(root.querySelector('.elemenx-quiz-result')).not.toBeNull();
	});

	it('gathers the answers of a survey without scoring them', async function () {
		var finished = [];
		var host = mount('<div><Quiz Mode="survey" Feedback="instant" [questions]="Questions" (finish)="Finished" /></div>', {
			Questions: [{ID: 'like', Text: 'Do you like it?', Options: [{ID: 'yes', Text: 'Yes'}, {ID: 'no', Text: 'No'}]}],
			Finished: function (event) {
				finished.push(event);
			}
		});
		var root;

		expect(await waitFor(function () {
			return !!host.$Element().querySelector('.elemenx-quiz-question');
		}, 3000)).toBe(true);

		root = host.$Element();

		await click(root, '[data-option="no"]');

		await next(root);

		expect(finished.length).toBe(1);
		expect(finished[0].Answers.like.Value).toBe('no');
		expect(finished[0].Answers.like.Correct).toBe(null);
		expect(root.querySelector('.elemenx-quiz-review')).toBeNull();
		expect(root.querySelector('.elemenx-quiz-result .elemenx-quiz-title').textContent).toBe('Thank you for your answers');
	});
});
