<!-- generated -->
# Audience

Who came to a page and which variant of it they see: a landing for a campaign, a language, a phone, or one of an A/B test, the same one again on the next visit. The same code runs in Node (pass the visitor to Context).

- Context(options): the visitor: {URL, Params (of the query), UTM {Source, Medium, Campaign, Term, Content}, Referrer (the host of another site it came from, '' when typed or from the same site), Language, Device (phone, tablet or desktop), Width, Touch, Visitor (an ID kept for it), Visits (1 on the first), Returning}. Options override what the browser tells: URL, Referrer, Language, Width, UserAgent, Touch.
- Match(rule, context): whether a visitor is one of a rule; every condition given must hold. Source, Medium, Campaign, Term, Content (the UTM tags), Language (ru matches ru-RU), Device, Referrer (a part of the host, '' for none, or a RegExp): a value or a list of them, without case. Params: {name: value, list, true (given) or false (not)}. Returning: true or false. Test: function (context) of your own.
- Choose(experiment, variants, options): the variant of a visitor: [{ID, When (a rule), Weight (1), Default}]. First the one a link forces (?variant=ID or ?variant=experiment:ID, Param names it), then the first whose When holds, then the one kept for the visitor, then one of those without When by their Weight (kept for the next visit), else the Default one. Returns {Experiment, ID, Variant, Reason: forced, rule, remembered, split or default}, or null. Options: Context, Param, Random (a function of 0..1).
- Chosen(experiment) the last choice; Forget(experiment) the kept one (all of them without a name).
- View(experiment, data) tells that the variant was seen (once for a page), Convert(experiment, goal, data) that its visitor did what it was for (signup, buy...): OnEvent(callback) / OffEvent(callback) get {Type (view or conversion), Experiment, Variant, Reason, Goal, Visitor, Source, Medium, Campaign, Referrer, Language, Device, Data, Time}, to send to the analytics of the site. Goal(element, goal, data) tells a conversion of each Experiment an element of the page stands in (the action of a Landing block with a Goal does), or of the one it names.

## Methods

- `Context(options)`
- `Match(rule, context)`
- `Choose(experiment, variants, options)`
- `Chosen(experiment)`
- `Forget(experiment)`
- `View(experiment, data)`
- `Convert(experiment, goal, data)`
- `Goal(element, goal, data)`
- `OnEvent(callback)`
- `OffEvent(callback)`

## Tests

- [tells who came, from where, in which language and on what, and matches its rules](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L39) — `tests/regression/library-landing.test.js`
- [chooses a forced variant, then a rule, then the one kept, then a split by weight, else the default](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L65) — `tests/regression/library-landing.test.js`
- [shows the Variant chosen, tells its view once and the conversion of an action with a Goal inside it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L94) — `tests/regression/library-landing.test.js`
- [keeps the variant of a split for the visitor, and a link forces another one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L141) — `tests/regression/library-landing.test.js`
- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
