<!-- generated -->
# Охранники маршрутов

Охранник решает, может ли навигация войти в маршрут: вошёл ли пользователь, есть ли роль, не осталась ли несохранённая форма, загружены ли нужные данные. Это функция, которую объявляют один раз под именем, а маршруты называют её.

```js
Elemenx.Guard('SignedIn', function () {
	if (this.$Service('Session').SignedIn()) return true;

	return this.$Fail('Sign in first', {Return: this.$To.Path});
});
```

```js
$Router: {
	Routes: [
		{Path: '/account', Component: 'Account', Guard: 'SignedIn', GuardFailed: 'SignIn'},
		{Path: '/admin', Component: 'Admin', Guards: ['SignedIn', 'Admin'], GuardFailed: {SignedIn: 'SignIn', Admin: 'Forbidden', Default: 'Forbidden'}}
	]
}
```

## Что возвращает охранник

| Результат | Значение |
| --- | --- |
| `true` или ничего | войти |
| `false` | остаться: навигация отменяется |
| `this.$Fail(reason, data)` | отказать с причиной: по защищённому URL показывается компонент `GuardFailed` |
| путь, `'/sign-in'` | перейти туда вместо этого (перенаправление) |
| `this.$Wait(function (done) {...})` | ответ придёт позже: `done(result)` с любым из результатов выше |

Охранники маршрута с `Guards` выполняются по порядку; решает первый, сказавший не `true`. `$Wait`, получивший Promise, отклоняет навигацию с причиной `'InvalidWait'`.

## Что видит охранник

Охранник выполняется с контекстом в `this`:

| Член | Значение |
| --- | --- |
| `$To`, `$From` | цель и текущее место: `{Path, Params, Query, Hash}` |
| `$Route` | охраняемый маршрут |
| `$Service(name)` | сервис приложения маршрутизатора |
| `$Fail(reason, data)`, `$Wait(operation)` | ответы, описанные выше |

## Ожидание

```js
Elemenx.Guard('ProjectAccess', function () {
	var self = this;

	return this.$Wait(function (done) {
		self.$Service('API').CanOpen(self.$To.Params.id, function (error, allowed) {
			done(!error && allowed ? true : self.$Fail('No access to this project'));
		});
	});
});
```

Пока охранник ждёт, маршрутизатор показывает компонент `Waiting` маршрута (или маршрутизатора) и отправляет `GuardWait`. Более новая навигация обесценивает ответ старой.

## Когда охранник отказал

С `GuardFailed` URL остаётся защищённым, а на месте компонента маршрута показывается его компонент: `'SignIn'` или по охранникам `{SignedIn: 'SignIn', Admin: 'Forbidden', Default: 'Forbidden'}`. Этот компонент читает `this.$GuardFailure`: `{Reason, Data, $Guard, $To, $Route}`, так что страница входа знает, куда вернуть. Без `GuardFailed` навигация отменяется, и текущая страница остаётся.

## Уход со страницы

Компонент текущего маршрута может отказаться отпускать пользователя (несохранённые изменения): его `$OnRouteLeave(context)` возвращает те же результаты, что и охранник, с `context.$From`, `context.$To`, `context.$Route`, `context.$Wait` и `context.$Fail`; `this` — компонент.

```js
Elemenx.Component('Editor', {
	$OnRouteLeave: function (context) {
		var self = this;

		if (!this.Dirty) return true;

		return context.$Wait(function (done) {
			self.$Service('Dialogs').Confirm({Title: 'Leave without saving?', Variant: 'danger'}, function (action) {
				done(action === 'ok');
			});
		});
	}
});
```

Перенаправление не спрашивает хуки ухода второй раз: страницы уже согласились уйти.

## События охранников

Маршрутизатор отправляет `GuardStart`, `GuardWait`, `GuardEnd` и `GuardFailed` с контекстом навигации (`context.$Guard` называет охранника, `'$OnRouteLeave'` — для хука ухода). См. [Маршрутизатор](/guide/router).

## Пример

У страниц этой справки нет охранников, поэтому пример спрашивает охранника напрямую: функцию-охранника с контекстом, который дал бы ей маршрутизатор.

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Toggle Label="Signed in" [checked]="Signed" (change)="Sign" />
	<Button Label="Ask the guard" Variant="primary" (click)="Ask" />
</div>
<p>{{Answer}}</p>
<script>
({
	Signed: false,
	Answer: '',

	$OnCreate: function () {
		var self = this;

		Elemenx.Guard('DocsSignedIn', function () {
			var guard = this;

			return this.$Wait(function (done) {
				setTimeout(function () {
					done(self.Signed ? true : guard.$Fail('Sign in first', {Return: guard.$To.Path}));
				}, 300);
			});
		});
	},

	Sign: function (value) {
		this.Signed = value;
	},

	Ask: function () {
		var self = this;
		var context = {
			$To: {Path: '/account', Params: {}, Query: {}, Hash: ''},
			$Wait: function (operation) {
				return {Wait: operation};
			},
			$Fail: function (reason, data) {
				return {Reason: reason, Data: data};
			}
		};
		var result = Elemenx.Guard('DocsSignedIn').call(context);

		this.Answer = 'Waiting...';

		result.Wait(function (answer) {
			self.Answer = answer === true ? 'Enter /account' : 'Refused: ' + answer.Reason + ' (return to ' + answer.Data.Return + ')';
		});
	}
})
</script>
```
