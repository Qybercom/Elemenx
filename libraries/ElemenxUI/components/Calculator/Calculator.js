/*
 * A calculator: the keys of a basic one, or of a scientific one (Mode scientific: sin, cos, tan, their inverses with
 * Shift, ln, log, roots and powers, factorial, pi and e, brackets, degrees or radians), read by the Calculations Service
 * (no eval). The line above shows what is typed, the one below its value as it is typed; = keeps it, and the history
 * (History, the last ten) brings one back by a press. The keyboard types too: digits, + - * / ^ % ( ), Enter or =,
 * Backspace, Escape (clears), Delete. A number ends with % to be a hundredth of itself (50% is 0.5, and 200 + 10% is
 * 220, as a calculator of a shop counts). Precision is the significant digits shown (12). Value is what is typed.
 * Events: result ({Expression, Value}) at each =, change (Value) as it is typed.
 */
Elemenx.Component('Calculator', {
	$TemplateURL: 'Calculator.html',
	$StyleURL: 'Calculator.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'grid',
		Description: 'A calculator, basic or scientific, of keys and of the keyboard, with its history.',
		Events: {
			result: 'The value was kept by =: {Expression, Value}.',
			change: 'What is typed changed: Value.'
		},
		Props: {
			Mode: {Options: ['basic', 'scientific'], Description: 'basic, or scientific (functions, powers, brackets, degrees or radians).'},
			Value: 'What is typed.',
			Angle: {Options: ['degrees', 'radians'], Description: 'The unit of the angles of a scientific calculator.'},
			History: 'Shows the history: the last ten results, one brought back by a press.',
			Precision: 'The significant digits shown.',
			Label: 'The name of the calculator for screen readers.'
		}
	},
	Mode: 'basic',
	Value: '',
	Angle: 'degrees',
	History: true,
	Precision: 12,
	Label: '',
	Shift: false,
	Done: false,
	Records: [],

	$OnCreate: function () {
		var self = this;

		/* The keys: what each writes (Text into the line, or a Command), its look and its name for screen readers. */
		this.Keys = function (mode, shift) {
			var basic = [
				{ID: 'clear', Label: 'C', Command: 'clear', Name: 'clear', Kind: 'function'},
				{ID: 'back', Label: '⌫', Command: 'back', Name: 'back', Kind: 'function'},
				{ID: 'percent', Label: '%', Text: '%', Kind: 'function'},
				{ID: 'divide', Label: '÷', Text: '/', Kind: 'operator'},
				{ID: '7', Label: '7', Text: '7'}, {ID: '8', Label: '8', Text: '8'}, {ID: '9', Label: '9', Text: '9'},
				{ID: 'multiply', Label: '×', Text: '*', Kind: 'operator'},
				{ID: '4', Label: '4', Text: '4'}, {ID: '5', Label: '5', Text: '5'}, {ID: '6', Label: '6', Text: '6'},
				{ID: 'minus', Label: '−', Text: '-', Kind: 'operator'},
				{ID: '1', Label: '1', Text: '1'}, {ID: '2', Label: '2', Text: '2'}, {ID: '3', Label: '3', Text: '3'},
				{ID: 'plus', Label: '+', Text: '+', Kind: 'operator'},
				{ID: 'negate', Label: '±', Command: 'negate', Name: 'negate'}, {ID: '0', Label: '0', Text: '0'}, {ID: 'point', Label: '.', Text: '.'},
				{ID: 'equals', Label: '=', Command: 'equals', Name: 'equals', Kind: 'equals'}
			];
			var scientific = [
				{ID: 'shift', Label: 'Shift', Command: 'shift', Name: 'shift', Kind: 'function', Pressed: shift},
				{ID: 'angle', Label: self.Angle === 'radians' ? 'rad' : 'deg', Command: 'angle', Name: 'angle', Kind: 'function'},
				{ID: 'open', Label: '(', Text: '(', Kind: 'function'},
				{ID: 'close', Label: ')', Text: ')', Kind: 'function'},
				{ID: 'sin', Label: shift ? 'sin⁻¹' : 'sin', Text: shift ? 'asin(' : 'sin(', Kind: 'function'},
				{ID: 'cos', Label: shift ? 'cos⁻¹' : 'cos', Text: shift ? 'acos(' : 'cos(', Kind: 'function'},
				{ID: 'tan', Label: shift ? 'tan⁻¹' : 'tan', Text: shift ? 'atan(' : 'tan(', Kind: 'function'},
				{ID: 'power', Label: 'xʸ', Text: '^', Kind: 'function'},
				{ID: 'ln', Label: shift ? 'eˣ' : 'ln', Text: shift ? 'exp(' : 'ln(', Kind: 'function'},
				{ID: 'log', Label: shift ? '10ˣ' : 'log', Text: shift ? '10^' : 'log(', Kind: 'function'},
				{ID: 'root', Label: shift ? '∛' : '√', Text: shift ? 'cbrt(' : 'sqrt(', Kind: 'function'},
				{ID: 'square', Label: 'x²', Text: '^2', Kind: 'function'},
				{ID: 'pi', Label: 'π', Text: 'pi', Kind: 'function'},
				{ID: 'e', Label: 'e', Text: 'e', Kind: 'function'},
				{ID: 'factorial', Label: 'n!', Text: '!', Kind: 'function'},
				{ID: 'inverse', Label: '1/x', Command: 'inverse', Name: 'inverse', Kind: 'function'}
			];

			return mode === 'scientific' ? scientific.concat(basic) : basic;
		};

		/* The line as it is shown: the signs of the keys in place of those of the keyboard. */
		this.Shown = function (value) {
			return String(value || '').replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−').replace(/sqrt\(/g, '√(').replace(/cbrt\(/g, '∛(').replace(/\bpi\b/g, 'π') || '0';
		};

		/* The value of the line as it is typed: nothing while it cannot be read yet (an operator at its end). */
		this.Preview = function (value, angle, precision) {
			var result = self.Result(value, angle);

			return result === null ? '' : self.Format(result, precision);
		};
	},

	/* The line as the Calculations Service reads it: n% a hundredth (after + or − a part of what is before), n! a factorial. */
	Formula: function (value) {
		var text = String(value || '');
		var percent = /(\d+(?:\.\d*)?|\.\d+|\))\s*%/;
		var match;
		var before;
		var number;

		/* 200 + 10% is 200 + 200 * 10 / 100; 50% alone, or after * and /, is 0.5. */
		while ((match = percent.exec(text))) {
			number = match[1];
			before = text.substring(0, match.index);

			if (/^(.*[^\s+\-*\/^(])\s*([+\-])\s*$/.test(before) && number !== ')') text = before + '(' + before.replace(/\s*[+\-]\s*$/, '') + ')*' + number + '/100' + text.substring(match.index + match[0].length);
			else text = before + number + '/100' + text.substring(match.index + match[0].length);
		}

		return text.replace(/(\d+(?:\.\d*)?|\))\s*!/g, 'factorial($1)');
	},

	/* The value of a line, or null when it cannot be read (yet) or is no number. */
	Result: function (value, angle) {
		var result;

		if (!String(value || '').trim()) return null;

		try {
			result = this.$Service('Calculations').Evaluate(this.Formula(value), {}, {Angle: angle === 'radians' ? 'radians' : 'degrees'});
		}
		catch (error) {
			return null;
		}

		return typeof result === 'number' && !isNaN(result) ? result : null;
	},

	/* A number as it is shown: its significant digits, no long tail of a float. */
	Format: function (value, precision) {
		var digits = Math.max(1, Math.min(17, Number(precision) || 12));

		if (!isFinite(value))
			return value > 0 ? '∞' : value < 0 ? '−∞' : '—';

		return String(Number(value.toPrecision(digits))).replace(/^-/, '−');
	},

	Typed: function (text) {
		var value = String(this.Value || '');

		/* After =, a digit starts again, an operator goes on from the result. */
		if (this.Done) {
			value = /^[\d.(a-z√π]/i.test(text) ? '' : value;
			this.Done = false;
		}

		/* One operator at a time: a second one takes the place of the first. */
		if (/^[+*\/^]$/.test(text) && /[+\-*\/^]\s*$/.test(value))
			value = value.replace(/[+\-*\/^]\s*$/, '');

		this.Set(value + text);
	},

	Set: function (value) {
		this.Value = value;

		this.$Emit('change', value);
	},

	/* The commands of the keys that are not texts. */
	Run: function (command) {
		var value = String(this.Value || '');
		var result;

		if (command === 'clear') {
			this.Done = false;

			this.Set('');
		}
		else if (command === 'back') {
			this.Done = false;

			this.Set(value.replace(/(asin|acos|atan|sin|cos|tan|exp|ln|log|sqrt|cbrt)\($|pi$|[\s\S]$/, ''));
		}
		else if (command === 'negate') {
			this.Set(/^-\(.*\)$/.test(value) ? value.slice(2, -1) : value ? '-(' + value + ')' : '-');
		}
		else if (command === 'inverse') {
			this.Set(value ? '1/(' + value + ')' : '1/');
		}
		else if (command === 'shift') {
			this.Shift = !this.Shift;
		}
		else if (command === 'angle') {
			this.Angle = this.Angle === 'radians' ? 'degrees' : 'radians';
		}
		else if (command === 'equals') {
			result = this.Result(value, this.Angle);

			if (result === null) return;

			this.Records = [{Expression: value, Value: result, Text: this.Format(result, this.Precision)}].concat(this.Records).slice(0, 10);
			this.Done = true;

			this.Set(String(Number(result.toPrecision(15))));

			this.$Emit('result', {Expression: value, Value: result});
		}
	},

	Pressed: function (event) {
		var node = event.currentTarget;
		var key = this.Keys(this.Mode, this.Shift).filter(function (each) {
			return each.ID === node.getAttribute('data-key');
		})[0];
		if (!key) return;

		if (key.Command) this.Run(key.Command);
		else this.Typed(key.Text);

		/* A function of Shift is taken once. */
		if (this.Shift && key.Kind === 'function' && key.ID !== 'shift')
			this.Shift = false;
	},

	Recalled: function (event) {
		var record = this.Records[Number(event.currentTarget.getAttribute('data-index'))];
		if (!record) return;

		this.Done = false;

		this.Set(record.Expression);
	},

	/* The keyboard: what a key of the calculator writes, the commands by their keys. */
	Key: function (event) {
		var key = event.key;

		if (event.ctrlKey || event.metaKey || event.altKey) return;

		if (/^[\d.+\-*\/^%()!]$/.test(key)) this.Typed(key === ',' ? '.' : key);
		else if (key === ',') this.Typed('.');
		else if (key === 'Enter' || key === '=') this.Run('equals');
		else if (key === 'Backspace') this.Run('back');
		else if (key === 'Escape' || key === 'Delete') this.Run('clear');
		else return;

		event.preventDefault();
	}
});
