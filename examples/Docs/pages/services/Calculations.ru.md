<!-- generated -->
# Calculations

Формулы чисел без eval (работают и на странице, чья CSP его запрещает; тот же код — в Node). Evaluate(text, variables, options) — значение: Price * Count * (1 - Discount / 100) с {Price: 12, Count: 3, Discount: 10}. Compile(text, options) — формула, прочитанная один раз: функция от переменных, с Names (именами, которые она читает). Names(text) — эти имена без функций и констант. Язык: числа (1.5, 2e3, .5), имена, + - * / % (остаток), ^ или ** (степень, справа налево и сильнее знака перед ней: -2^2 = -4), сравнения (1 или 0), && || !, a ? b : c, скобки; функции abs, round(x, digits), floor, ceil, trunc, sign, min, max, sum, avg, sqrt, cbrt, pow, exp, ln, log (десятичный или log(x, base)), sin, cos, tan, asin, acos, atan, atan2, hypot, clamp(x, low, high), if(condition, then, else), factorial, percent(x, of); константы pi и e. Options: Angle (radians или degrees для функций углов), Functions ({name: function} — свои). Ошибка в формуле — SyntaxError с местом (Index), неизвестное имя — Error.

## Методы

- `Compile(text, options)`
- `Evaluate(text, variables, options)`
- `Names(text)`

## Тесты

- [reads formulas without eval: precedence, powers, conditions, functions, names, and tells a mistake by its place](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L41) — `tests/regression/library-calculators.test.js`
- [counts on its keys and on the keyboard, a percent as a shop does, and keeps its history](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L71) — `tests/regression/library-calculators.test.js`
- [computes its results from its fields, given and declared, each after the results it reads, and tells a cycle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L122) — `tests/regression/library-calculators.test.js`
