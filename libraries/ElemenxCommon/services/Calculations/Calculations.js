/*
 * Formulas of numbers, read without eval (a page that forbids it runs them too): Price * Count * (1 - Discount / 100),
 * round(Total / 12, 2), if(Area > 100, 0.9, 1) * Rate.
 * - Evaluate(text, variables, options): the value of a formula, its names read from variables ({Price: 12}); throws a
 *   SyntaxError with the place of a mistake (its Index), or an Error for a name it does not know.
 * - Compile(text, options): the formula read once, a function (variables) => value, with Names (the names it reads).
 * - Names(text): the names a formula reads, the functions and constants left out.
 * The language: numbers (1.5, 2e3, .5), names (letters, digits, _), + - * / % (the rest of a division) ^ or ** (a power,
 * from the right), unary - and +, < <= > >= == != (1 or 0), && || ! (the first value that decides, as in JavaScript), a
 * ? b : c, parentheses, and the functions abs, round(x, digits), floor, ceil, trunc, sign, min, max, sum, avg, sqrt,
 * cbrt, pow, exp, ln, log (base 10, or log(x, base)), sin, cos, tan, asin, acos, atan, atan2, hypot, clamp(x, low,
 * high), if(condition, then, else), factorial, percent(x, of); the constants pi and e. Options: Angle (radians, or
 * degrees for the functions of angles), Functions ({name: function} of your own).
 */
Elemenx.Service('Calculations', {
	$Meta: {
		Description: 'Formulas of numbers read without eval: variables, functions, conditions.',
		Methods: ['Evaluate(text, variables, options)', 'Compile(text, options)', 'Names(text)']
	},

	Constants: {pi: Math.PI, e: Math.E},

	/* The pieces of a formula: numbers, names, operators and brackets, each with its place. */
	Tokens: function (text) {
		var source = String(text === null || text === undefined ? '' : text);
		var tokens = [];
		var i = 0;
		var match;
		var rest;

		while (i < source.length) {
			rest = source.substring(i);

			if ((match = /^\s+/.exec(rest))) {
				i += match[0].length;

				continue;
			}

			if ((match = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest))) tokens.push({Kind: 'number', Value: Number(match[0]), Index: i});
			else if ((match = /^[A-Za-z_][\w]*/.exec(rest))) tokens.push({Kind: 'name', Value: match[0], Index: i});
			else if ((match = /^(?:\*\*|<=|>=|==|!=|&&|\|\||[-+*\/%^<>!?:(),])/.exec(rest))) tokens.push({Kind: 'operator', Value: match[0], Index: i});
			else this.Mistake('Unexpected ' + JSON.stringify(rest.charAt(0)), i);

			i += match[0].length;
		}

		tokens.push({Kind: 'end', Value: '', Index: source.length});

		return tokens;
	},

	Mistake: function (message, index) {
		var error = new SyntaxError('Elemenx Calculations: ' + message + ' at ' + index);

		error.Index = index;

		throw error;
	},

	/* The tree of a formula (precedence climbing): {Kind: number | name | unary | binary | condition | call, ...}. */
	Parse: function (text) {
		var self = this;
		var tokens = this.Tokens(text);
		var at = 0;
		var levels = [['||'], ['&&'], ['==', '!='], ['<', '<=', '>', '>='], ['+', '-'], ['*', '/', '%']];

		function peek () {
			return tokens[at];
		}

		function take (value) {
			var token = tokens[at];
			if (value !== undefined && token.Value !== value)
				self.Mistake('Expected ' + JSON.stringify(value) + (token.Kind === 'end' ? ' at the end' : ' but found ' + JSON.stringify(token.Value)), token.Index);

			at++;

			return token;
		}

		function condition () {
			var test = binary(0);
			var yes;

			if (peek().Value !== '?') return test;

			take('?');

			yes = condition();

			take(':');

			return {Kind: 'condition', Test: test, Yes: yes, No: condition()};
		}

		function binary (level) {
			var left;
			var token;

			if (level === levels.length) return unary();

			left = binary(level + 1);

			while (peek().Kind === 'operator' && levels[level].indexOf(peek().Value) !== -1) {
				token = take();
				left = {Kind: 'binary', Operator: token.Value, Left: left, Right: binary(level + 1)};
			}

			return left;
		}

		function unary () {
			var token = peek();

			if (token.Kind === 'operator' && (token.Value === '-' || token.Value === '+' || token.Value === '!')) {
				take();

				return {Kind: 'unary', Operator: token.Value, Value: unary()};
			}

			return power();
		}

		/* A power binds tighter than a sign before it (-2^2 is -4) and goes from the right (2^3^2 is 2^9). */
		function power () {
			var base = primary();

			if (peek().Value === '^' || peek().Value === '**') {
				take();

				return {Kind: 'binary', Operator: '^', Left: base, Right: unary()};
			}

			return base;
		}

		function primary () {
			var token = take();
			var args;
			var inner;

			if (token.Kind === 'number')
				return {Kind: 'number', Value: token.Value};

			if (token.Kind === 'name') {
				if (peek().Value !== '(')
					return {Kind: 'name', Name: token.Value, Index: token.Index};

				take('(');

				args = [];

				if (peek().Value !== ')') {
					args.push(condition());

					while (peek().Value === ',') {
						take(',');

						args.push(condition());
					}
				}

				take(')');

				return {Kind: 'call', Name: token.Value, Args: args, Index: token.Index};
			}

			if (token.Value === '(') {
				inner = condition();

				take(')');

				return inner;
			}

			return self.Mistake(token.Kind === 'end' ? 'Unexpected end' : 'Unexpected ' + JSON.stringify(token.Value), token.Index);
		}

		var tree = condition();

		if (peek().Kind !== 'end')
			this.Mistake('Unexpected ' + JSON.stringify(peek().Value), peek().Index);

		return tree;
	},

	/* The functions of the language, those of options too; the ones of angles in degrees when asked. */
	Functions: function (options) {
		var degrees = options && options.Angle === 'degrees';
		var to = degrees ? Math.PI / 180 : 1;
		var list = {
			abs: Math.abs,
			round: function (x, digits) {
				var power = Math.pow(10, digits || 0);

				return Math.round(x * power) / power;
			},
			floor: Math.floor,
			ceil: Math.ceil,
			trunc: function (x) {
				return x < 0 ? Math.ceil(x) : Math.floor(x);
			},
			sign: function (x) {
				return x > 0 ? 1 : x < 0 ? -1 : 0;
			},
			min: Math.min,
			max: Math.max,
			sum: function () {
				return Array.prototype.reduce.call(arguments, function (total, x) {
					return total + x;
				}, 0);
			},
			avg: function () {
				return arguments.length ? list.sum.apply(null, arguments) / arguments.length : 0;
			},
			sqrt: Math.sqrt,
			cbrt: function (x) {
				return x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3);
			},
			pow: Math.pow,
			exp: Math.exp,
			ln: Math.log,
			log: function (x, base) {
				return base === undefined ? (Math.log10 ? Math.log10(x) : Math.log(x) / Math.LN10) : Math.log(x) / Math.log(base);
			},
			sin: function (x) {
				return Math.sin(x * to);
			},
			cos: function (x) {
				return Math.cos(x * to);
			},
			tan: function (x) {
				return Math.tan(x * to);
			},
			asin: function (x) {
				return Math.asin(x) / to;
			},
			acos: function (x) {
				return Math.acos(x) / to;
			},
			atan: function (x) {
				return Math.atan(x) / to;
			},
			atan2: function (y, x) {
				return Math.atan2(y, x) / to;
			},
			hypot: function () {
				return Math.sqrt(Array.prototype.reduce.call(arguments, function (total, x) {
					return total + x * x;
				}, 0));
			},
			clamp: function (x, low, high) {
				return Math.min(high, Math.max(low, x));
			},
			factorial: function (x) {
				var result = 1;
				var i;

				if (x < 0 || x !== Math.floor(x)) return NaN;

				for (i = 2; i <= x; i++)
					result *= i;

				return result;
			},
			percent: function (x, of) {
				return of === undefined ? x / 100 : x / 100 * of;
			}
		};
		var name;

		for (name in (options && options.Functions) || {}) {
			if (Object.prototype.hasOwnProperty.call(options.Functions, name))
				list[name] = options.Functions[name];
		}

		return list;
	},

	Compile: function (text, options) {
		var self = this;
		var tree = this.Parse(text);
		var functions = this.Functions(options);
		var constants = this.Constants;
		var names = [];

		/* A value of the tree: a condition reads only the branch it takes, && and || only what decides. */
		function run (node, variables) {
			var left;
			var right;

			if (node.Kind === 'number') return node.Value;

			if (node.Kind === 'name') {
				if (variables && Object.prototype.hasOwnProperty.call(variables, node.Name)) return Number(variables[node.Name]);
				if (Object.prototype.hasOwnProperty.call(constants, node.Name)) return constants[node.Name];

				throw new Error('Elemenx Calculations: unknown name ' + node.Name);
			}

			if (node.Kind === 'unary') {
				left = run(node.Value, variables);

				return node.Operator === '-' ? -left : node.Operator === '!' ? (left ? 0 : 1) : left;
			}

			if (node.Kind === 'condition')
				return run(node.Test, variables) ? run(node.Yes, variables) : run(node.No, variables);

			if (node.Kind === 'call') {
				if (node.Name === 'if')
					return run(node.Args[0], variables) ? run(node.Args[1], variables) : node.Args.length > 2 ? run(node.Args[2], variables) : 0;

				if (!Object.prototype.hasOwnProperty.call(functions, node.Name))
					throw new Error('Elemenx Calculations: unknown function ' + node.Name);

				return functions[node.Name].apply(null, node.Args.map(function (argument) {
					return run(argument, variables);
				}));
			}

			left = run(node.Left, variables);

			if (node.Operator === '&&')
				return left ? run(node.Right, variables) : left;

			if (node.Operator === '||')
				return left ? left : run(node.Right, variables);

			right = run(node.Right, variables);

			switch (node.Operator) {
				case '+': return left + right;
				case '-': return left - right;
				case '*': return left * right;
				case '/': return left / right;
				case '%': return left % right;
				case '^': return Math.pow(left, right);
				case '<': return left < right ? 1 : 0;
				case '<=': return left <= right ? 1 : 0;
				case '>': return left > right ? 1 : 0;
				case '>=': return left >= right ? 1 : 0;
				case '==': return left === right ? 1 : 0;
				case '!=': return left !== right ? 1 : 0;
			}

			return NaN;
		}

		(function collect (node) {
			if (!node) return;

			if (node.Kind === 'name' && !Object.prototype.hasOwnProperty.call(constants, node.Name) && names.indexOf(node.Name) === -1)
				names.push(node.Name);

			[node.Value, node.Left, node.Right, node.Test, node.Yes, node.No].forEach(function (child) {
				if (child && typeof child === 'object')
					collect(child);
			});

			(node.Args || []).forEach(collect);
		})(tree);

		var compiled = function (variables) {
			return run(tree, variables || {});
		};

		compiled.Names = names;
		compiled.Text = String(text);
		compiled.Service = self;

		return compiled;
	},

	Evaluate: function (text, variables, options) {
		return this.Compile(text, options)(variables);
	},

	Names: function (text) {
		return this.Compile(text).Names.slice();
	}
});
