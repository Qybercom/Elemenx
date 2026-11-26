<!-- generated -->
# Text

The texts of markup: what goes into HTML, SVG or XML as it is written, escaped once for every Library.

- Escape(value): the text of an attribute or of an element, & < > and " as entities (&amp; &lt; &gt; &quot;).
- EscapeText(value): the text of an element alone, & < > as entities (a " is kept).

A value is made a text first (null and undefined as 'null' and 'undefined', as String does).

## Methods

- `Escape(value)`
- `EscapeText(value)`

## Tests

- [escapes & < > and " for an attribute or an element, and & < > alone for the text of an element](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Text/Text.node.test.js#L24) — `libraries/ElemenxCommon/services/Text/Text.node.test.js`
- [a property binding finds the DOM property of a name with capitals, which HTML reads in small letters](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/binding-event-syntax.test.js#L118) — `tests/regression/binding-event-syntax.test.js`
- [runs a graph that calls itself through a list of its own, as a function, by the IR in JavaScript as it runs](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L71) — `tests/regression/blueprints-ir.test.js`
- [takes vectors and choices, and says what of a graph is not of numbers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L265) — `tests/regression/blueprints-ir.test.js`
- [runs the ways of a Sequence in order, each to its end, and stops a flow that never ends](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L554) — `tests/regression/blueprints.test.js`
- [takes the Library Services, Directives and Guards the Application names, and the ones they name](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/builder-multi-application.test.js#L303) — `tests/regression/builder-multi-application.test.js`
- [Component bindings preserve definition key casing through the HTML parser](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/component-directive-integration.test.js#L17) — `tests/regression/component-directive-integration.test.js`
- [nested Component binding paths recover definition object key casing](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/component-directive-integration.test.js#L58) — `tests/regression/component-directive-integration.test.js`
- [structural Component recreation keeps case-correct props and child directives](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/component-directive-integration.test.js#L77) — `tests/regression/component-directive-integration.test.js`
- [gives a prop its value and takes back what the Component tells at the event its $Model names](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/component-two-way.test.js#L41) — `tests/regression/component-two-way.test.js`
- [tells a prop the Component has not and an expression nothing can be given to](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/component-two-way.test.js#L89) — `tests/regression/component-two-way.test.js`
- [discovered child keeps its (events) and receives later \[prop\] updates under the declared spelling](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/deferred-structural.test.js#L84) — `tests/regression/deferred-structural.test.js`

+23 more in the same files
