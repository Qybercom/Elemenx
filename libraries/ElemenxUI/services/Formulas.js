/*
 * Formulas written as in LaTeX, drawn by the browser as MathML. MathML(text, display) returns the markup of a <math>
 * (display: true for a formula on a line of its own); a text it cannot read returns the text in an <merror>.
 * The part of LaTeX it reads: numbers, letters (italic) and words of functions (\sin, \log, \lim...), the operators
 * (+ - = < > ( ) [ ] | ! , and \cdot \times \div \pm \mp \le \ge \ne \approx \equiv \to \infty \partial \nabla
 * \in \notin \subset \cup \cap \forall \exists \ldots \cdots...), the Greek letters (\alpha... \Omega), groups { },
 * ^ and _ (powers, indices, both), \frac and \dfrac, \sqrt and \sqrt[n], \sum, \prod, \int, \oint and \lim with their
 * limits (under and over in a display), \left and \right, \hat, \bar, \vec, \dot, \tilde, \overline, \underline,
 * \text, \mathrm, \mathbf, \mathbb, spaces (\, \: \; \quad \qquad), and the matrices \begin{matrix}, pmatrix, bmatrix,
 * vmatrix and cases (& between the cells, \\ between the rows).
 */
Elemenx.Service('Formulas', {
	$Meta: {
		Description: 'Formulas written as in LaTeX, drawn by the browser as MathML.',
		Methods: ['MathML(text, display)']
	},
	Letters: {alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', varpi: 'ϖ', rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ', phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω'},

	Operators: {cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', equiv: '≡', sim: '∼', propto: '∝', to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐', leftrightarrow: '↔', Leftrightarrow: '⇔', mapsto: '↦', infty: '∞', partial: '∂', nabla: '∇', in: '∈', notin: '∉', ni: '∋', subset: '⊂', supset: '⊃', subseteq: '⊆', supseteq: '⊇', cup: '∪', cap: '∩', setminus: '∖', emptyset: '∅', forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨', ldots: '…', cdots: '⋯', vdots: '⋮', ddots: '⋱', circ: '∘', ast: '∗', star: '⋆', perp: '⊥', parallel: '∥', angle: '∠', degree: '°', prime: '′', langle: '⟨', rangle: '⟩', lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', mid: '∣'},

	Large: {sum: '∑', prod: '∏', coprod: '∐', int: '∫', iint: '∬', iiint: '∭', oint: '∮', bigcup: '⋃', bigcap: '⋂'},

	Functions: 'sin cos tan cot sec csc arcsin arccos arctan sinh cosh tanh log ln lg exp det dim ker deg gcd min max sup inf arg Pr',

	Accents: {hat: '^', bar: '¯', vec: '→', dot: '˙', ddot: '¨', tilde: '~', overline: '‾', underline: '_', widehat: '^', widetilde: '~'},

	Spaces: {',': '0.1667em', ':': '0.2222em', ';': '0.2778em', '!': '-0.1667em', quad: '1em', qquad: '2em', ' ': '0.25em'},

	MathML: function (text, display) {
		var self = this;
		var source = String(text == null ? '' : text);
		var at = 0;
		var body;

		function escape (value) {
			return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		function fail (message) {
			throw new Error(message);
		}

		function space () {
			while (at < source.length && /\s/.test(source.charAt(at)))
				at++;
		}

		/* A command after a backslash: a word, or one sign. */
		function command () {
			var match = /^\\([A-Za-z]+|.)/.exec(source.substring(at));
			if (!match)
				fail('A backslash at the end');

			at += match[0].length;

			return match[1];
		}

		function group () {
			var items;

			space();

			if (source.charAt(at) !== '{') return atom();

			at++;
			items = sequence('}');
			at++;

			return items.length === 1 ? items[0] : '<mrow>' + items.join('') + '</mrow>';
		}

		/* The text of a group as it is (\text{...}). */
		function raw () {
			var depth = 0;
			var start;

			space();

			if (source.charAt(at) !== '{')
				fail('A { is missing');

			start = ++at;

			while (at < source.length && (source.charAt(at) !== '}' || depth)) {
				if (source.charAt(at) === '{')
					depth++;

				if (source.charAt(at) === '}')
					depth--;

				at++;
			}

			at++;

			return source.substring(start, at - 1);
		}

		/* An optional argument in brackets (\sqrt[3]), or null. */
		function optional () {
			var items;

			space();

			if (source.charAt(at) !== '[') return null;

			at++;
			items = sequence(']');
			at++;

			return '<mrow>' + items.join('') + '</mrow>';
		}

		function fence () {
			var name;
			var value;

			space();

			if (source.charAt(at) === '\\') {
				name = command();

				return name === '{' || name === '}' ? name : name === '|' ? '‖' : self.Operators[name] || '';
			}

			value = source.charAt(at++);

			return value === '.' ? '' : value;
		}

		function matrix (kind) {
			var rows = [[[]]];
			var row = rows[0];
			var name;
			var open = {pmatrix: '(', bmatrix: '[', vmatrix: '|', Bmatrix: '{', cases: '{'}[kind] || '';
			var close = {pmatrix: ')', bmatrix: ']', vmatrix: '|', Bmatrix: '}'}[kind] || '';
			var table;

			while (at < source.length) {
				space();

				if (source.substr(at, 4) === '\\end') {
					at += 4;

					raw();

					break;
				}

				if (source.charAt(at) === '&') {
					at++;

					row.push([]);

					continue;
				}

				if (source.substr(at, 2) === '\\\\') {
					at += 2;
					row = [[]];

					rows.push(row);

					continue;
				}

				row[row.length - 1].push(item());
			}

			table = '<mtable' + (kind === 'cases' ? ' columnalign="left"' : '') + '>' + rows.filter(function (cells) {
				return cells.length > 1 || cells[0].length;
			}).map(function (cells) {
				return '<mtr>' + cells.map(function (cell) {
					return '<mtd>' + cell.join('') + '</mtd>';
				}).join('') + '</mtr>';
			}).join('') + '</mtable>';

			name = open || close ? '<mrow>' + (open ? '<mo>' + escape(open) + '</mo>' : '') + table + (close ? '<mo>' + escape(close) + '</mo>' : '') + '</mrow>' : table;

			return name;
		}

		/* One thing: a number, a letter, an operator, a group or a command. */
		function atom () {
			var c;
			var name;
			var number;
			var first;
			var second;
			var root;
			var words;

			space();

			c = source.charAt(at);

			if (c === '{')
				return group();

			if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(source.charAt(at + 1)))) {
				number = /^[0-9]*\.?[0-9]+|^[0-9]+/.exec(source.substring(at))[0];
				at += number.length;

				return '<mn>' + number + '</mn>';
			}

			if (/[A-Za-z]/.test(c)) {
				at++;

				return '<mi>' + c + '</mi>';
			}

			if (c === '\\') {
				name = command();

				if (Object.prototype.hasOwnProperty.call(self.Letters, name)) return '<mi>' + self.Letters[name] + '</mi>';
				if (Object.prototype.hasOwnProperty.call(self.Operators, name)) return '<mo>' + self.Operators[name] + '</mo>';

				if (Object.prototype.hasOwnProperty.call(self.Large, name))
					return '<mo largeop="true" movablelimits="' + (display ? 'false' : 'true') + '">' + self.Large[name] + '</mo>';

				if (Object.prototype.hasOwnProperty.call(self.Spaces, name))
					return '<mspace width="' + self.Spaces[name] + '"></mspace>';

				if (name === '{' || name === '}' || name === '|' || name === '%' || name === '$' || name === '#' || name === '&' || name === '_') return '<mo>' + escape(name === '|' ? '‖' : name) + '</mo>';

				words = self.Functions.split(' ');

				if (words.indexOf(name) !== -1)
					return '<mi mathvariant="normal">' + name + '</mi><mo>&#8289;</mo>';

				if (name === 'lim')
					return '<mo movablelimits="' + (display ? 'false' : 'true') + '">lim</mo>';

				if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
					first = group();
					second = group();

					return '<mfrac' + (name === 'dfrac' ? ' displaystyle="true"' : '') + '>' + first + second + '</mfrac>';
				}

				if (name === 'sqrt') {
					root = optional();
					first = group();

					return root ? '<mroot>' + first + root + '</mroot>' : '<msqrt>' + first + '</msqrt>';
				}

				if (Object.prototype.hasOwnProperty.call(self.Accents, name)) {
					first = group();

					if (name === 'underline')
						return '<munder accentunder="true">' + first + '<mo>' + self.Accents[name] + '</mo></munder>';

					return '<mover accent="true">' + first + '<mo>' + self.Accents[name] + '</mo></mover>';
				}

				if (name === 'text' || name === 'mathrm')
					return name === 'text' ? '<mtext>' + escape(raw()) + '</mtext>' : '<mi mathvariant="normal">' + escape(raw()) + '</mi>';

				if (name === 'mathbf')
					return '<mi mathvariant="bold">' + escape(raw()) + '</mi>';

				if (name === 'mathbb')
					return '<mi mathvariant="double-struck">' + escape(raw()) + '</mi>';

				if (name === 'left') {
					first = fence();
					second = sequence('\\right');
					at += 6;

					return '<mrow>' + (first ? '<mo stretchy="true">' + escape(first) + '</mo>' : '') + second.join('') + (function (value) {
						return value ? '<mo stretchy="true">' + escape(value) + '</mo>' : '';
					})(fence()) + '</mrow>';
				}

				if (name === 'begin')
					return matrix(raw());

				fail('Unknown command \\' + name);
			}

			at++;

			if (/[+\-*=<>(),;:!|/[\].']/.test(c))
				return '<mo>' + escape(c === '-' ? '−' : c === '*' ? '∗' : c === '\'' ? '′' : c) + '</mo>';

			fail('Unexpected ' + c);

			return '';
		}

		/* An atom with its powers and indices. */
		function item () {
			var base = atom();
			var sub = null;
			var sup = null;
			var large = /largeop|movablelimits/.test(base);
			var c;

			for (;;) {
				space();

				c = source.charAt(at);

				if (c === '^' && sup === null) {
					at++;
					sup = group();
				}
				else if (c === '_' && sub === null) {
					at++;
					sub = group();
				}
				else {
					break;
				}
			}

			if (sub !== null && sup !== null)
				return large && display ? '<munderover>' + base + sub + sup + '</munderover>' : '<msubsup>' + base + sub + sup + '</msubsup>';

			if (sub !== null)
				return large && display ? '<munder>' + base + sub + '</munder>' : '<msub>' + base + sub + '</msub>';

			if (sup !== null)
				return large && display ? '<mover>' + base + sup + '</mover>' : '<msup>' + base + sup + '</msup>';

			return base;
		}

		/* The items up to the end, or up to a closing mark (}, ] or \right), which it leaves. */
		function sequence (end) {
			var items = [];

			for (;;) {
				space();

				if (at >= source.length) {
					if (end)
						fail('A ' + end + ' is missing');

					break;
				}

				if (end && source.substr(at, end.length) === end) break;

				if (!end && (source.charAt(at) === '}' || source.charAt(at) === ']'))
					fail('Unexpected ' + source.charAt(at));

				items.push(item());
			}

			return items;
		}

		try {
			body = sequence('').join('');
		}
		catch (error) {
			body = '<merror><mtext>' + escape(source) + '</mtext></merror>';
		}

		return '<math xmlns="http://www.w3.org/1998/Math/MathML"' + (display ? ' display="block"' : '') + '><mrow>' + body + '</mrow></math>';
	}
});
