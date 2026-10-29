/*
 * A quiz or a survey: its questions one at a time, a bar of the progress, the score at the end.
 *
 * Questions: [{ID, Text, Type, Options: [{ID, Text, Correct, Next}], Points, Answer, Tolerance, Explanation, Image,
 * Next}], or declared inside it: QuizQuestion with its QuizOption (the text of an option is what it holds). Type: single
 * (one option), multiple (all the right ones, no wrong one), text (one of the texts of Answer, without case and spaces
 * round it), number (Answer, give or take Tolerance) or order (the options in the order they are given; shown mixed).
 * Points (1) count a right answer. Next leads to another question (its ID, or end): the one of the option chosen first,
 * else the one of the question, else the next one; Back goes back the way it came.
 *
 * Mode quiz scores the answers; survey only gathers them (no right one). Feedback: instant (the answer is checked
 * before the next question, with its Explanation), end (in the review at the end, the default) or none. PassScore is
 * the percent that passes (70). TimeLimit gives the whole of it seconds (0: no limit): at 0 it ends. Shuffle mixes the
 * options. Title and Intro make a screen to start from (Start).
 *
 * Events: start, answer ({Question, Value, Correct, Points}), finish ({Score, Max, Percent, Passed, Answers}).
 * Methods: Start(), Restart().
 */
Elemenx.Component('Quiz', {
	$TemplateURL: 'Quiz.html',
	$StyleURL: 'Quiz.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'help',
		Description: 'A quiz or a survey: questions of one option, several, a text, a number or an order, the score at the end.',
		Container: true,
		Children: ['QuizQuestion'],
		Events: {
			start: 'It started.',
			answer: 'A question was answered: {Question, Value, Correct, Points}.',
			finish: 'It ended: {Score, Max, Percent, Passed, Answers}.'
		},
		Methods: ['Start()', 'Restart()'],
		Props: {
			Questions: {Schema: {ID: 'text', Text: 'text', Type: 'text', Points: 'number'}, Description: 'The questions: [{ID, Text, Type, Options: [{ID, Text, Correct, Next}], Points, Answer, Tolerance, Explanation, Image, Next}].'},
			Mode: {Options: ['quiz', 'survey'], Description: 'quiz (scored) or survey (answers gathered).'},
			Feedback: {Options: ['instant', 'end', 'none'], Description: 'When the answers are checked: instant, end or none.'},
			PassScore: 'The percent of the points that passes.',
			TimeLimit: 'The seconds for all of it (0: no limit).',
			Shuffle: 'Mixes the options of the questions.',
			Back: 'Lets it go back to the question before.',
			Title: 'The title of its start screen.',
			Intro: 'The text of its start screen.'
		},
		Sample: {Questions: [{ID: 'q1', Text: 'Two plus two?', Type: 'number', Answer: 4}]}
	},
	Questions: [],
	Mode: 'quiz',
	Feedback: 'end',
	PassScore: 70,
	TimeLimit: 0,
	Shuffle: false,
	Back: true,
	Title: '',
	Intro: '',
	Version: 0,
	Stage: 'intro',
	Current: '',
	Answers: {},
	Checked: false,
	Draft: null,
	Left: 0,
	Way: [],

	$OnCreate: function () {
		var self = this;
		var own = {Declared: [], Timer: 0, Orders: {}, Last: [], Arguments: null};

		this.Own = function () {
			return own;
		};

		/*
		 * The question shown, made ready for its template (a list of it alone, or empty): its options (mixed when asked),
		 * the answer being given.
		 */
		this.Present = function (current, version, draft, checked, stage) {
			var args = Array.prototype.slice.call(arguments);
			if (own.Arguments && own.Arguments.length === args.length && own.Arguments.every(function (value, index) {
				return value === args[index];
			})) return own.Last;

			own.Arguments = args;
			own.Last = stage === 'question' ? [self.Shown(current, draft, checked)].filter(Boolean) : [];

			return own.Last;
		};

		this.Shown = function (current, draft, checked) {
			var question = self.Find(current);
			var options;

			if (!question) return null;

			options = self.Options(question);
			draft = self.Fit(question, draft);

			return {
				ID: question.ID,
				Text: question.Text || '',
				Type: question.Type,
				Image: question.Image || '',
				Options: options.map(function (option) {
					var value = draft;
					var chosen = question.Type === 'multiple' ? (value || []).indexOf(option.ID) !== -1 : value === option.ID;

					return {
						ID: option.ID,
						Value: option.ID,
						Label: option.Text,
						Chosen: chosen,
						State: checked && self.Mode !== 'survey' ? (option.Correct ? 'right' : chosen ? 'wrong' : '') : ''
					};
				}),
				Order: question.Type === 'order' ? (draft || options.map(function (option) {
					return option.ID;
				})).map(function (id) {
					return {ID: id, Text: (question.Options || []).filter(function (option) {
						return option.ID === id;
					})[0].Text};
				}) : [],
				Explanation: question.Explanation || '',
				Value: question.Type === 'text' ? draft || '' : question.Type === 'number' ? (draft === '' || draft === undefined ? null : draft) : draft,
				Ready: self.Answered(question, draft),
				Correct: checked ? self.Correct(question, draft) : null
			};
		};
	},

	$OnReady: function () {
		var self = this;
		var own = this.Own();
		var sources = this.$Element().querySelector('.elemenx-quiz-sources');

		own.Read = function () {
			var questions = Array.prototype.map.call(sources.querySelectorAll('.elemenx-quiz-question-source'), function (node, index) {
				var question = JSON.parse(node.getAttribute('data-item') || '{}');

				question.ID = question.ID || 'question-' + index;
				question.Options = Array.prototype.map.call(node.querySelectorAll('.elemenx-quiz-option-source'), function (option, at) {
					var item = JSON.parse(option.getAttribute('data-item') || '{}');

					item.ID = item.ID || String(at);
					item.Text = option.textContent.replace(/\s+/g, ' ').trim();

					return item;
				});

				return question;
			});
			if (JSON.stringify(questions) === JSON.stringify(own.Declared)) return;

			own.Declared = questions;
			self.Version++;

			if (self.Stage === 'intro' && !self.Title && !self.Intro)
				self.Start();
		};

		own.Watcher = new MutationObserver(own.Read);

		own.Watcher.observe(sources, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-item']});

		own.Read();

		if (this.Stage === 'intro' && !this.Title && !this.Intro && this.List().length)
			this.Start();
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Watcher)
			own.Watcher.disconnect();

		window.clearInterval(own.Timer);
	},

	/* The questions given and declared, each with a Type, Options and Points. */
	List: function () {
		return (this.Questions || []).concat(this.Own().Declared).map(function (question, index) {
			var copy = {};
			var key;

			for (key in question) {
				if (Object.prototype.hasOwnProperty.call(question, key))
					copy[key] = question[key];
			}

			copy.ID = String(question.ID !== undefined && question.ID !== '' ? question.ID : 'question-' + index);
			copy.Type = ['single', 'multiple', 'text', 'number', 'order'].indexOf(question.Type) === -1 ? 'single' : question.Type;
			copy.Options = (question.Options || []).map(function (option, at) {
				return {ID: String(option.ID !== undefined && option.ID !== '' ? option.ID : at), Text: option.Text || String(option.ID), Correct: !!option.Correct, Next: option.Next || ''};
			});
			copy.Points = question.Points !== undefined && question.Points !== null ? Number(question.Points) : 1;

			return copy;
		});
	},

	Find: function (id) {
		return this.List().filter(function (question) {
			return question.ID === id;
		})[0] || null;
	},

	/* The options as they are shown: mixed once for each question when Shuffle (and always for an order). */
	Options: function (question) {
		var orders = this.Own().Orders;
		var options = question.Options;
		var order;

		if (!(this.Shuffle && this.Shuffle !== 'false') && question.Type !== 'order') return options;

		order = orders[question.ID];

		if (!order || order.length !== options.length) {
			order = options.map(function (option, index) {
				return index;
			});

			/* A shuffle that leaves no option of an order in its place, so that the right order is never given. */
			do {
				order.sort(function () {
					return Math.random() - 0.5;
				});
			} while (question.Type === 'order' && options.length > 1 && order.every(function (value, index) {
				return value === index;
			}));

			orders[question.ID] = order;
		}

		return order.map(function (index) {
			return options[index];
		});
	},

	/*
	 * An answer as its question takes it: a list of its options for several and for an order (an order that is not one
	 * of all of them is none), else a value; another is none (the answer to another question, met while it changes).
	 */
	Fit: function (question, value) {
		var ids = question.Options.map(function (option) {
			return option.ID;
		});

		if (question.Type === 'multiple')
			return Array.isArray(value) ? value.filter(function (id) {
				return ids.indexOf(id) !== -1;
			}) : null;

		if (question.Type === 'order')
			return Array.isArray(value) && value.length === ids.length && ids.every(function (id) {
				return value.indexOf(id) !== -1;
			}) ? value : null;

		return Array.isArray(value) ? null : value;
	},

	/* Whether an answer is right: true, false, or null for a survey. */
	Correct: function (question, value) {
		var right;
		var given;

		if (this.Mode === 'survey') return null;

		if (question.Type === 'single')
			return question.Options.some(function (option) {
				return option.Correct && option.ID === value;
			});

		if (question.Type === 'multiple') {
			right = question.Options.filter(function (option) {
				return option.Correct;
			}).map(function (option) {
				return option.ID;
			}).sort();
			given = (value || []).slice().sort();

			return right.length === given.length && right.every(function (id, index) {
				return id === given[index];
			});
		}

		if (question.Type === 'text')
			return [].concat(question.Answer === undefined ? [] : question.Answer).some(function (answer) {
				return String(answer).trim().toLowerCase() === String(value || '').trim().toLowerCase();
			});

		if (question.Type === 'number')
			return value !== null && value !== undefined && value !== '' && Math.abs(Number(value) - Number(question.Answer)) <= (Number(question.Tolerance) || 0);

		/* An order: the options in the order they are given. */
		return !!value && question.Options.every(function (option, index) {
			return value[index] === option.ID;
		});
	},

	/* Whether the answer being given is one: something chosen, typed or put in order. */
	Answered: function (question, draft) {
		if (!question) return false;

		if (question.Type === 'multiple')
			return !!draft && draft.length > 0;

		if (question.Type === 'order') return true;

		return draft !== null && draft !== undefined && String(draft).trim() !== '';
	},

	Start: function () {
		var self = this;
		var own = this.Own();
		var list = this.List();

		window.clearInterval(own.Timer);

		this.Answers = {};
		this.Way = [];
		this.Checked = false;
		this.Draft = null;
		this.Stage = list.length ? 'question' : 'done';
		this.Current = list.length ? list[0].ID : '';
		this.Left = Number(this.TimeLimit) || 0;

		if (this.Left) {
			own.Timer = window.setInterval(function () {
				self.Left = Math.max(0, self.Left - 1);

				if (!self.Left)
					self.Finish();
			}, 1000);
		}

		this.$Emit('start');

		return this;
	},

	Restart: function () {
		this.Own().Orders = {};

		return this.Start();
	},

	/* The answer being given changes: an option chosen, several checked, a text typed, an order changed. */
	Chosen: function (value) {
		if (!this.Checked)
			this.Draft = value;
	},

	Ticked: function (id, checked) {
		var draft = (this.Draft || []).filter(function (each) {
			return each !== id;
		});

		if (this.Checked) return;

		this.Draft = checked ? draft.concat(id) : draft;
	},

	/* An option pressed: the one chosen, or one more checked (or unchecked) of several. */
	Picked: function (event) {
		var id = event.currentTarget.getAttribute('data-option');
		var question = this.Find(this.Current);
		if (!question) return;

		if (question.Type === 'multiple') this.Ticked(id, (this.Draft || []).indexOf(id) === -1);
		else this.Chosen(id);
	},

	/* An item of an order moved up (-1) or down (1). */
	Moved: function (id, step) {
		var question = this.Find(this.Current);
		var order = (this.Draft || this.Options(question).map(function (option) {
			return option.ID;
		})).slice();
		var index = order.indexOf(id);
		var target = index + step;
		if (this.Checked || index === -1 || target < 0 || target >= order.length) return;

		order.splice(index, 1);
		order.splice(target, 0, id);

		this.Draft = order;
	},

	/* The answer kept (checked first with instant Feedback), then the next question, or the end. */
	Next: function () {
		var question = this.Find(this.Current);
		var draft = question && question.Type === 'order' && !this.Draft ? this.Options(question).map(function (option) {
			return option.ID;
		}) : this.Draft;
		var correct;
		var answers;

		if (!question || !this.Answered(question, draft)) return;

		if (this.Feedback === 'instant' && this.Mode !== 'survey' && !this.Checked) {
			this.Draft = draft;
			this.Checked = true;

			return;
		}

		correct = this.Correct(question, draft);
		answers = Object.assign({}, this.Answers);
		answers[question.ID] = {Value: draft, Correct: correct, Points: correct ? question.Points : 0};
		this.Answers = answers;

		this.$Emit('answer', {Question: question, Value: draft, Correct: correct, Points: answers[question.ID].Points});

		this.Go(this.Following(question, draft));
	},

	/* The question after: the Next of the option chosen first, else of the question, else the next one; null at the end. */
	Following: function (question, value) {
		var list = this.List();
		var chosen = [].concat(value || []);
		var option = question.Options.filter(function (each) {
			return each.Next && chosen.indexOf(each.ID) !== -1;
		})[0];
		var next = option ? option.Next : question.Next || '';
		var index;

		if (next === 'end') return null;
		if (next && this.Find(next)) return next;

		index = list.map(function (each) {
			return each.ID;
		}).indexOf(question.ID);

		return list[index + 1] ? list[index + 1].ID : null;
	},

	Go: function (id) {
		if (!id) {
			this.Finish();

			return;
		}

		this.Way = this.Way.concat(this.Current);
		this.Checked = false;
		this.Draft = this.Answers[id] ? this.Answers[id].Value : null;
		this.Current = id;
	},

	Previous: function () {
		var way = this.Way.slice();
		var id = way.pop();
		if (!id || !(this.Back && this.Back !== 'false')) return;

		this.Way = way;
		this.Checked = false;
		this.Draft = this.Answers[id] ? this.Answers[id].Value : null;
		this.Current = id;
	},

	/* The score of the answers, of the questions on the way taken. */
	Score: function () {
		var self = this;
		var asked = this.Way.concat(this.Current ? [this.Current] : []).filter(function (id, index, list) {
			return list.indexOf(id) === index && self.Answers[id];
		});
		var max = 0;
		var score = 0;

		asked.forEach(function (id) {
			var question = self.Find(id);

			max += question ? question.Points : 0;
			score += self.Answers[id].Points;
		});

		return {Score: score, Max: max, Percent: max ? Math.round(score / max * 100) : 0, Passed: max ? score / max * 100 >= Number(this.PassScore) : true, Answers: this.Answers};
	},

	Finish: function () {
		window.clearInterval(this.Own().Timer);

		this.Own().Timer = 0;
		this.Stage = 'done';

		this.$Emit('finish', this.Score());
	},

	/* The review at the end: each question answered, its answer and whether it was right. */
	Review: function (answers, stage) {
		var self = this;

		if (stage !== 'done') return [];

		return this.Way.concat(this.Current ? [this.Current] : []).filter(function (id, index, list) {
			return list.indexOf(id) === index && answers[id];
		}).map(function (id) {
			var question = self.Find(id);
			var value = answers[id].Value;
			var texts = [].concat(value === null || value === undefined ? [] : value).map(function (each) {
				var option = question.Options.filter(function (item) {
					return item.ID === each;
				})[0];

				return option ? option.Text : String(each);
			});

			return {ID: id, Text: question.Text, Answer: texts.join(question.Type === 'order' ? ' → ' : ', '), Correct: answers[id].Correct, Explanation: question.Explanation || ''};
		});
	},

	/* The end for its template: a list of the score with its review alone, or empty before the end. */
	Outcome: function (answers, stage) {
		var score;

		if (stage !== 'done') return [];

		score = this.Score();
		score.Review = this.Review(answers, stage);

		return [score];
	},

	/* The time left as m:ss. */
	Clock: function (left) {
		var seconds = Math.max(0, Number(left) || 0);

		return Math.floor(seconds / 60) + ':' + (seconds % 60 < 10 ? '0' : '') + seconds % 60;
	},

	/* The place of the question in the list, from 1, for the bar of the progress. */
	Place: function (current, version) {
		var ids = version >= 0 ? this.List().map(function (question) {
			return question.ID;
		}) : [];

		return {Index: ids.indexOf(current) + 1, Count: ids.length};
	}
});
