# Guards

A guard decides whether a navigation may enter a route: a signed-in user, a role, an unsaved form, data that must load first. It is a function, named and declared once, and routes name it.

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

## What a guard returns

| Result | Meaning |
| --- | --- |
| `true`, or nothing | enter |
| `false` | stay: the navigation is cancelled |
| `this.$Fail(reason, data)` | refuse with a reason: the `GuardFailed` component shows at the protected URL |
| a path, `'/sign-in'` | go there instead (a redirect) |
| `this.$Wait(function (done) {...})` | the answer comes later: `done(result)` with any of the results above |

A guard of a route with `Guards` runs in order; the first one that does not say `true` decides. `$Wait` given a Promise refuses the navigation with the reason `'InvalidWait'`.

## What a guard sees

The guard runs with a context as `this`:

| Member | Meaning |
| --- | --- |
| `$To`, `$From` | the target and the current place: `{Path, Params, Query, Hash}` |
| `$Route` | the route that is guarded |
| `$Service(name)` | a service of the Application of the router |
| `$Fail(reason, data)`, `$Wait(operation)` | the answers above |

## Waiting

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

While a guard waits, the router shows the `Waiting` component of the route (or of the router) and emits `GuardWait`. A newer navigation makes the answer of an older one count for nothing.

## When a guard says no

With `GuardFailed`, the URL stays the protected one and its component shows in the place of the route's: `'SignIn'`, or by guard `{SignedIn: 'SignIn', Admin: 'Forbidden', Default: 'Forbidden'}`. That component reads `this.$GuardFailure`: `{Reason, Data, $Guard, $To, $Route}`, so a sign-in page knows where to return. Without it, the navigation is cancelled and the current page stays.

## Leaving a page

A component of the current route may refuse to be left (unsaved changes): its `$OnRouteLeave(context)` returns the same results as a guard, with `context.$From`, `context.$To`, `context.$Route`, `context.$Wait` and `context.$Fail`; `this` is the component.

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

A redirect does not ask the leave hooks a second time: the pages already agreed to leave.

## Events of guards

The router emits `GuardStart`, `GuardWait`, `GuardEnd` and `GuardFailed` with the context of the navigation (`context.$Guard` names the guard, `'$OnRouteLeave'` for a leave hook). See [Router](/guide/router).

## Example

The pages of this reference have no guard, so the example asks one directly: the function a guard is, with the context a router would give it.

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
