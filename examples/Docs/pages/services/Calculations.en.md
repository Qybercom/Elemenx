<!-- generated -->
# Calculations

Formulas of numbers, read without eval (a page that forbids it runs them too): Price * Count * (1 - Discount / 100), round(Total / 12, 2), if(Area > 100, 0.9, 1) * Rate.

- Evaluate(text, variables, options): the value of a formula, its names read from variables ({Price: 12}); throws a SyntaxError with the place of a mistake (its Index), or an Error for a name it does not know.
- Compile(text, options): the formula read once, a function (variables) => value, with Names (the names it reads).
- Names(text): the names a formula reads, the functions and constants left out.

The language: numbers (1.5, 2e3, .5), names (letters, digits, _), + - * / % (the rest of a division) ^ or ** (a power, from the right), unary - and +, < <= > >= == != (1 or 0), && || ! (the first value that decides, as in JavaScript), a ? b : c, parentheses, and the functions abs, round(x, digits), floor, ceil, trunc, sign, min, max, sum, avg, sqrt, cbrt, pow, exp, ln, log (base 10, or log(x, base)), sin, cos, tan, asin, acos, atan, atan2, hypot, clamp(x, low, high), if(condition, then, else), factorial, percent(x, of); the constants pi and e. Options: Angle (radians, or degrees for the functions of angles), Functions ({name: function} of your own).

## Methods

- `Compile(text, options)`
- `Evaluate(text, variables, options)`
- `Names(text)`

## Tests

- [reads formulas without eval: precedence, powers, conditions, functions, names, and tells a mistake by its place](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L41) — `tests/regression/library-calculators.test.js`
- [counts on its keys and on the keyboard, a percent as a shop does, and keeps its history](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L71) — `tests/regression/library-calculators.test.js`
- [computes its results from its fields, given and declared, each after the results it reads, and tells a cycle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L122) — `tests/regression/library-calculators.test.js`
