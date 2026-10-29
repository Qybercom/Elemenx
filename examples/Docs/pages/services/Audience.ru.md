<!-- generated -->
# Audience

Кто пришёл на страницу и какой её вариант видит: лендинг для кампании, языка, телефона или вариант A/B-теста — тот же при следующем визите. Тот же код работает в Node. Context(options) — посетитель: Params (параметры ссылки), UTM {Source, Medium, Campaign, Term, Content}, Referrer (хост другого сайта, откуда пришёл; пусто — набрал адрес сам или перешёл внутри сайта), Language, Device (phone, tablet, desktop), Width, Touch, Visitor (ID, запомненный для него), Visits (1 при первом), Returning; options — URL, Referrer, Language, Width, UserAgent, Touch вместо того, что сообщает браузер. Match(rule, context) — подходит ли посетитель правилу (все заданные условия): Source, Medium, Campaign, Term, Content, Language (ru подходит к ru-RU), Device, Referrer (часть хоста, '' — без реферера, или RegExp) — значение или список, без учёта регистра; Params ({name: значение, список, true — задан, false — нет}); Returning; Test — своя функция. Choose(experiment, variants, options) — вариант посетителя из [{ID, When, Weight, Default}]: сначала заданный ссылкой (?variant=ID или ?variant=эксперимент:ID), потом первый, чьё правило выполнено, потом запомненный, потом один из вариантов без правила по весам (запоминается), иначе Default; возвращает {Experiment, ID, Variant, Reason: forced, rule, remembered, split, default} или null. Chosen(experiment) — последний выбор, Forget(experiment) — забыть запомненный (все — без имени). View(experiment, data) — вариант увиден (один раз за страницу), Convert(experiment, goal, data) — посетитель сделал то, ради чего страница; Goal(element или имя, goal, data) — конверсия каждого Experiment, внутри которого стоит элемент. OnEvent/OffEvent получают {Type (view, conversion), Experiment, Variant, Reason, Goal, Visitor, Source, Medium, Campaign, Referrer, Language, Device, Data, Time} — их отправляют в аналитику сайта.

## Методы

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

## Тесты

- [tells who came, from where, in which language and on what, and matches its rules](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L39) — `tests/regression/library-landing.test.js`
- [chooses a forced variant, then a rule, then the one kept, then a split by weight, else the default](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L65) — `tests/regression/library-landing.test.js`
- [shows the Variant chosen, tells its view once and the conversion of an action with a Goal inside it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L94) — `tests/regression/library-landing.test.js`
- [keeps the variant of a split for the visitor, and a link forces another one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L141) — `tests/regression/library-landing.test.js`
- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
