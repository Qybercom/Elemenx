'use strict';

/*
 * Short names for the local names of ES5 code: the parameters, the variables, the functions declared and named, and
 * the errors of a catch. A property (after a dot, the key of an object), a label and a name of the global scope keep
 * their names, so no public name, no key of a definition and nothing a template reads changes. A new name never hides
 * a name of an outer scope that is read inside: two names that meet keep apart. Code that is not ES5 (let, const,
 * class, =>, a template string) comes back as it was: a minifier that only drops the blanks (tools/minify.js) then
 * takes it. A with or an eval reads its scope by name: the names it can see (of its function and of the ones around
 * it) keep theirs; the precompiled expressions of a build are such functions.
 *
 * Mangle(source, keep) returns {Source, Renamed} (the number of names renamed), or {Source: source, Renamed: 0, Reason};
 * keep lists names that stay as they are (the Version of elemenx.js, which the tools and a copy of it read in its text).
 */

/* The words of ES5 that are never a name. */
var Keywords = {};

/* The names a new name must not be: the words above, the ones reserved after ES5, and the globals every scope reads. */
var Avoid = {};

'break case catch continue debugger default delete do else finally for function if in instanceof new return switch this throw try typeof var void while with true false null'.split(' ').forEach(function (word) {
	Keywords[word] = true;
	Avoid[word] = true;
});

'undefined NaN Infinity arguments eval class const enum export extends import super implements interface let package private protected public static yield await async of get set'.split(' ').forEach(function (word) {
	Avoid[word] = true;
});

/* What stops the renaming: syntax a scope of var and function does not describe, and reads of a scope by name. */
var Unsupported = {let: true, const: true, class: true, yield: true, await: true, async: true, import: true, export: true};

var Word = /[A-Za-z0-9_$\u0080-￿]/;
var Start = /[A-Za-z_$\u0080-￿]/;

/* After these, a slash starts a regular expression. */
var RegexAfter = '(,=:[!&|?{};+-*%<>~^';
var RegexWords = {return: true, typeof: true, instanceof: true, in: true, new: true, delete: true, void: true, throw: true, case: true, do: true, else: true};

/* Before an opening brace, these make it an object (an expression); the others, a block. */
var ObjectAfter = '(,=:[!&|?+-*%<>~^';
var ObjectWords = {return: true, typeof: true, in: true, instanceof: true, new: true, delete: true, void: true, throw: true, case: true};

/* The tokens of a source: {Type: name, number, string, regex, punct, blank (blanks and comments), Text}. */
function tokenize (source) {
	var tokens = [];
	var i = 0;
	var c;
	var end;
	var last = null;

	function significant () {
		return last;
	}

	function regexAllowed () {
		var previous = significant();
		if (!previous) return true;

		if (previous.Type === 'name')
			return !!RegexWords[previous.Text];

		if (previous.Type !== 'punct') return false;

		return RegexAfter.indexOf(previous.Text.charAt(previous.Text.length - 1)) !== -1;
	}

	function push (type, text) {
		var token = {Type: type, Text: text};

		tokens.push(token);

		if (type !== 'blank')
			last = token;
	}

	while (i < source.length) {
		c = source.charAt(i);

		if (/\s/.test(c)) {
			end = i;

			while (end < source.length && /\s/.test(source.charAt(end))) {
				end++;
			}

			push('blank', source.substring(i, end));

			i = end;
		}
		else if (c === '/' && source.charAt(i + 1) === '/') {
			end = source.indexOf('\n', i);
			end = end === -1 ? source.length : end;

			push('blank', source.substring(i, end));

			i = end;
		}
		else if (c === '/' && source.charAt(i + 1) === '*') {
			end = source.indexOf('*/', i + 2);

			if (end === -1)
				throw new Error('Unterminated comment at ' + i);

			push('blank', source.substring(i, end + 2));

			i = end + 2;
		}
		else if (c === '`') {
			return null;
		}
		else if (c === '"' || c === '\'') {
			end = i + 1;

			while (end < source.length && source.charAt(end) !== c) {
				if (source.charAt(end) === '\\')
					end++;

				end++;
			}

			push('string', source.substring(i, end + 1));

			i = end + 1;
		}
		else if (c === '/' && regexAllowed()) {
			end = i + 1;

			(function () {
				var klass = false;
				var at;

				while (end < source.length) {
					at = source.charAt(end);

					if (at === '/' && !klass) break;

					if (at === '\n')
						throw new Error('Unterminated regular expression at ' + i);

					if (at === '[') klass = true;
					else if (at === ']') klass = false;

					end += at === '\\' ? 2 : 1;
				}
			})();

			end++;

			while (end < source.length && /[a-z]/i.test(source.charAt(end))) {
				end++;
			}

			push('regex', source.substring(i, end));

			i = end;
		}
		else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(source.charAt(i + 1)))) {
			end = i;

			while (end < source.length && (/[0-9a-zA-Z_.]/.test(source.charAt(end)) || ((source.charAt(end) === '+' || source.charAt(end) === '-') && /[eE]/.test(source.charAt(end - 1)) && !/^0[xX]/.test(source.substring(i, end))))) {
				end++;
			}

			push('number', source.substring(i, end));

			i = end;
		}
		else if (Start.test(c)) {
			end = i;

			while (end < source.length && Word.test(source.charAt(end))) {
				end++;
			}

			push('name', source.substring(i, end));

			i = end;
		}
		else {
			end = i + 1;

			/* => is not ES5: the source is left as it is. */
			if (c === '=' && source.charAt(i + 1) === '>') return null;

			while (end < source.length && /[=<>&|+\-*%^!]/.test(source.charAt(end)) && /[=<>&|+\-*%^!]/.test(c) && end - i < 4) {
				end++;
			}

			push('punct', source.substring(i, end));

			i = end;
		}
	}

	return tokens;
}

function Scope (parent, kind) {
	return {Parent: parent, Kind: kind, Names: {}, Order: [], Children: [], Sees: [], Free: {}, Used: {}, Fixed: false};
}

/* The scope a var and a function declared belong to: the function around them (a catch is not one). */
function functionScope (scope) {
	while (scope.Kind === 'catch') {
		scope = scope.Parent;
	}

	return scope;
}

function declare (scope, token) {
	var name = token.Text;

	if (!Object.prototype.hasOwnProperty.call(scope.Names, name)) {
		scope.Names[name] = {Name: name, Scope: scope, Tokens: [], Count: 0, Final: name};

		scope.Order.push(scope.Names[name]);
	}

	scope.Names[name].Tokens.push(token);

	scope.Names[name].Count++;
}

/*
 * The scopes of the tokens and the place of each name: declared (var, a parameter, a function, a catch), read, or none
 * (a property, a key, a keyword). Returns the root scope and the references [{Token, Scope}], or a reason to stop.
 */
function analyze (tokens) {
	var root = Scope(null, 'root');
	var scope = root;
	var frames = [];
	var references = [];
	var previous = null;
	var pendingFunction = null;
	var pendingCatch = null;
	var declaring = [];
	var i = 0;
	var token;
	var frame;
	var next;

	function nextSignificant (from) {
		var j = from + 1;

		while (j < tokens.length && tokens[j].Type === 'blank') {
			j++;
		}

		return j < tokens.length ? tokens[j] : null;
	}

	function statementStart () {
		return !previous || (previous.Type === 'punct' && (previous.Text === ';' || previous.Text === '{' || previous.Text === '}'));
	}

	function objectBrace () {
		if (!previous) return false;

		if (previous.Type === 'name')
			return !!ObjectWords[previous.Text];

		if (previous.Type !== 'punct') return false;

		return ObjectAfter.indexOf(previous.Text.charAt(previous.Text.length - 1)) !== -1;
	}

	while (i < tokens.length) {
		token = tokens[i];

		if (token.Type === 'blank') {
			i++;

			continue;
		}

		frame = frames[frames.length - 1] || null;

		if (token.Type === 'name') {
			if (Unsupported[token.Text] && !(previous && previous.Type === 'punct' && previous.Text === '.') && !(frame && frame.Kind === 'object' && previous && (previous.Text === '{' || previous.Text === ','))) return {Reason: token.Text};

			next = nextSignificant(i);

			/* A property, or the key of an object. */
			if (previous && previous.Type === 'punct' && previous.Text === '.') {
				previous = token;
				i++;

				continue;
			}

			if (frame && frame.Kind === 'object' && previous && (previous.Text === '{' || previous.Text === ',') && next && next.Text === ':') {
				previous = token;
				i++;

				continue;
			}

			/* A label, and the label of a break or a continue. */
			if (statementStart() && next && next.Text === ':' && !Keywords[token.Text]) {
				previous = token;
				i++;

				continue;
			}

			if (previous && previous.Type === 'name' && (previous.Text === 'break' || previous.Text === 'continue')) {
				previous = token;
				i++;

				continue;
			}

			/* with and eval read the names of their scope and of the ones around it: those keep theirs. */
			if (token.Text === 'with' || token.Text === 'eval') {
				(function (fixed) {
					while (fixed) {
						fixed.Fixed = true;
						fixed = fixed.Parent;
					}
				})(scope);
			}

			if (token.Text === 'function') {
				pendingFunction = {Scope: Scope(scope, 'function'), Declaration: statementStart(), Named: false};

				scope.Children.push(pendingFunction.Scope);

				previous = token;
				i++;

				continue;
			}

			if (pendingFunction && !pendingFunction.Named && previous && previous.Text === 'function') {
				pendingFunction.Named = true;

				declare(pendingFunction.Declaration ? functionScope(scope) : pendingFunction.Scope, token);

				previous = token;
				i++;

				continue;
			}

			if (token.Text === 'catch') {
				pendingCatch = Scope(scope, 'catch');

				scope.Children.push(pendingCatch);

				previous = token;
				i++;

				continue;
			}

			if (token.Text === 'var') {
				declaring.push({Depth: frames.length, Expect: true});

				previous = token;
				i++;

				continue;
			}

			if (frame && frame.Kind === 'params') {
				declare(scope, token);

				previous = token;
				i++;

				continue;
			}

			if (frame && frame.Kind === 'catch-param') {
				declare(scope, token);

				previous = token;
				i++;

				continue;
			}

			if (declaring.length && declaring[declaring.length - 1].Expect && frames.length === declaring[declaring.length - 1].Depth) {
				declaring[declaring.length - 1].Expect = false;

				declare(functionScope(scope), token);

				previous = token;
				i++;

				continue;
			}

			/* for (var key in object): the declaration ends at in. */
			if (declaring.length && token.Text === 'in' && frames.length === declaring[declaring.length - 1].Depth)
				declaring.pop();

			if (!Keywords[token.Text])
				references.push({Token: token, Scope: scope});

			previous = token;
			i++;

			continue;
		}

		if (token.Type === 'punct') {
			if (token.Text === '(') {
				if (pendingFunction && previous && (previous.Text === 'function' || pendingFunction.Named && previous.Type === 'name')) {
					scope = pendingFunction.Scope;

					frames.push({Kind: 'params', Function: pendingFunction});
				}
				else if (pendingCatch && previous && previous.Text === 'catch') {
					scope = pendingCatch;

					frames.push({Kind: 'catch-param'});
				}
				else {
					frames.push({Kind: 'paren'});
				}
			}
			else if (token.Text === '{') {
				if (pendingFunction && pendingFunction.Opened) {
					frames.push({Kind: 'body', Scope: scope});

					pendingFunction = null;
				}
				else if (pendingCatch && pendingCatch.Opened) {
					frames.push({Kind: 'catch-body', Scope: scope});

					pendingCatch = null;
				}
				else {
					frames.push({Kind: objectBrace() ? 'object' : 'block'});
				}
			}
			else if (token.Text === '[') {
				frames.push({Kind: 'bracket'});
			}
			else if (token.Text === ')' || token.Text === '}' || token.Text === ']') {
				frame = frames.pop();

				if (!frame)
					throw new Error('Unbalanced ' + token.Text);

				if (frame.Kind === 'params') frame.Function.Opened = true;
				else if (frame.Kind === 'catch-param') pendingCatch.Opened = true;
				else if (frame.Kind === 'body' || frame.Kind === 'catch-body') scope = frame.Scope.Parent;
			}
			else if (token.Text === ',' && declaring.length && frames.length === declaring[declaring.length - 1].Depth) {
				declaring[declaring.length - 1].Expect = true;
			}
			else if (token.Text === ';' && declaring.length && frames.length <= declaring[declaring.length - 1].Depth) {
				declaring.pop();
			}
		}

		previous = token;

		i++;
	}

	if (frames.length)
		throw new Error('Unbalanced brackets at the end');

	return {Root: root, References: references};
}

/* Short names in order: a, b, ... z, A ... Z, $, _, then two characters, and so on. */
var First = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_';
var Rest = First + '0123456789';

function nameAt (index) {
	var name = First.charAt(index % First.length);

	index = Math.floor(index / First.length);

	while (index > 0) {
		index--;
		name += Rest.charAt(index % Rest.length);
		index = Math.floor(index / Rest.length);
	}

	return name;
}

function resolve (scope, name) {
	while (scope) {
		if (Object.prototype.hasOwnProperty.call(scope.Names, name)) return scope.Names[name];

		scope = scope.Parent;
	}

	return null;
}

function Mangle (source, keep) {
	var kept = {};
	var tokens;
	var analysis;
	var renamed = 0;

	/* A source this reading does not follow (a part of a script, brackets or a comment that do not close) keeps its names. */
	try {
		tokens = tokenize(String(source).replace(/\r\n?/g, '\n'));
		analysis = tokens ? analyze(tokens) : null;
	}
	catch (error) {
		return {Source: source, Renamed: 0, Reason: error.message};
	}

	if (!tokens)
		return {Source: source, Renamed: 0, Reason: 'not ES5'};

	if (analysis.Reason)
		return {Source: source, Renamed: 0, Reason: analysis.Reason};

	(keep || []).forEach(function (name) {
		kept[name] = true;
	});

	/* Each read to its name; the scopes between the read and the name see it, and must not take its new name. */
	analysis.References.forEach(function (reference) {
		var binding = resolve(reference.Scope, reference.Token.Text);
		var scope = reference.Scope;

		if (binding) {
			binding.Tokens.push(reference.Token);

			binding.Count++;
		}

		while (scope && (!binding || scope !== binding.Scope)) {
			if (binding) scope.Sees.push(binding);
			else scope.Free[reference.Token.Text] = true;

			scope = scope.Parent;
		}
	});

	/* The names of the root are globals: they stay. A scope takes its names after its parent, the most read first. */
	function name (scope) {
		var taken = {};
		var index = 0;

		Object.keys(scope.Free).forEach(function (free) {
			taken[free] = true;
		});

		scope.Sees.forEach(function (binding) {
			taken[binding.Final] = true;
		});

		/* A name kept stays, and no other takes it in this scope; a scope a with or an eval sees keeps all of its names. */
		scope.Order.forEach(function (binding) {
			if (kept[binding.Name] || scope.Fixed)
				taken[binding.Name] = true;
		});

		scope.Order.slice().sort(function (a, b) {
			return b.Count - a.Count;
		}).forEach(function (binding) {
			var candidate;

			if (kept[binding.Name] || scope.Fixed) return;

			do {
				candidate = nameAt(index);

				index++;
			} while (taken[candidate] || Avoid[candidate]);

			binding.Final = candidate;
			taken[candidate] = true;

			if (candidate !== binding.Name)
				renamed++;
		});
	}

	function walk (scope) {
		if (scope.Parent)
			name(scope);

		scope.Children.forEach(walk);
	}

	walk(analysis.Root);

	(function rename (scope) {
		scope.Order.forEach(function (binding) {
			binding.Tokens.forEach(function (token) {
				token.Text = binding.Final;
			});
		});

		scope.Children.forEach(rename);
	})(analysis.Root);

	return {Source: tokens.map(function (token) {
		return token.Text;
	}).join(''), Renamed: renamed};
}

module.exports = {
	Mangle: Mangle
};
