<!-- generated -->
# Своя директива

Две директивы, которые нужны настоящему приложению: `*inview` сообщает, когда элемент появился на экране (чтобы его анимировать, засчитать просмотр, догрузить ещё), а `*media` строит элемент, только пока выполняется медиазапрос. Первая добавляет поведение элементу; вторая решает, существует ли элемент.

Чему вы научитесь: когда директива — правильный инструмент, хуки поведенческой директивы и её `Data`, уборка за собой, сон и пробуждение, структурная директива с `Mount` и `Unmount` и тестирование директивы.

## 1. Директива, компонент или сервис?

- У **компонента** своя разметка: карточка, выбор даты.
- У **сервиса** есть состояние и логика, но нет элемента: сессия, корзина.
- **Директива** добавляет поведение элементу, который написал кто-то другой: любому элементу, корню любого компонента, не оборачивая его. `*copy`, `*hotkey`, `*draggable` из ElemenxUI — директивы.

Если иначе вы добавили бы один и тот же `addEventListener` в `$OnReady` десяти компонентов, это директива.

## 2. `*inview`: хуки

```js
/*
 * *inview tells when its element comes into the screen: it gets the class in-view and emits inview with {Visible}.
 * The value is {Threshold (0 to 1, the share that must show), Once (stop after the first time)}, or nothing.
 */
Elemenx.Directive('inview', {
	$Meta: {
		Description: '*inview tells when its element comes into the screen: the class in-view and the event inview with {Visible}.'
	},

	$OnCreate: function (context) {
		context.Data.Seen = function (entries) {
			var visible = entries[entries.length - 1].isIntersecting;
			var options = context.Value || {};

			context.Element.classList.toggle('in-view', visible);
			context.Element.dispatchEvent(new CustomEvent('inview', {detail: {Visible: visible}}));

			if (visible && options.Once)
				context.Data.Observer.disconnect();
		};
	},

	$OnUpdate: function (context) {
		var threshold = Number((context.Value || {}).Threshold) || 0;

		/* A new value of the expression with the same threshold: nothing to do. */
		if (context.Data.Observer && context.Data.Threshold === threshold) return;

		if (context.Data.Observer)
			context.Data.Observer.disconnect();

		context.Data.Threshold = threshold;
		context.Data.Observer = new IntersectionObserver(context.Data.Seen, {threshold: threshold});
		context.Data.Observer.observe(context.Element);
	},

	$OnSleep: function (context) {
		context.Data.Observer.disconnect();
	},

	$OnWake: function (context) {
		context.Data.Observer.observe(context.Element);
	},

	$OnDestroy: function (context) {
		if (context.Data.Observer)
			context.Data.Observer.disconnect();
	}
});
```

- `$OnCreate` выполняется один раз, когда элемент в шаблоне, до его значения; `$OnUpdate` — с первым значением и снова каждый раз, когда меняется то, что читает выражение; `$OnDestroy` — когда элемент уходит.
- `context.Data` — собственный объект директивы для этого элемента: два элемента с `*inview` никогда не делят наблюдатель.
- **Убирайте** в `$OnDestroy` всё, что запустили: наблюдатель, слушатель на `window`, таймер. Директива, которая забывает это, течёт на каждой странице роутера.
- Компонент, сохранённый кешем, засыпает, а не уходит: `$OnSleep` и `$OnWake` останавливают и возобновляют то, что стоит ресурсов, пока этого никто не видит.
- Событие — DOM-событие элемента, поэтому шаблон слушает его, как клик:

```html
<section class="feature" *inview="{Threshold: 0.4, Once: true}" (inview)="Seen">...</section>
```

```css
.feature {
	opacity: 0;
	transform: translateY(16px);
	transition: opacity 0.4s, transform 0.4s;
}

.feature.in-view {
	opacity: 1;
	transform: none;
}

@media (prefers-reduced-motion: reduce) {
	.feature {
		opacity: 1;
		transform: none;
		transition: none;
	}
}
```

Уважайте `prefers-reduced-motion`: анимация, которая двигает страницу, у некоторых людей вызывает дурноту.

## 3. `*media`: структурная директива

```js
/* *media="'(min-width: 800px)'" builds its element while the media query holds, and takes it away when it does not. */
Elemenx.Directive('media', {
	Structural: true,

	$OnUpdate: function (context) {
		if (context.Data.Query)
			context.Data.Query.removeEventListener('change', context.Data.Changed);

		context.Data.Query = window.matchMedia(context.Value);
		context.Data.Changed = function () {
			if (context.Data.Query.matches) context.Mount();
			else context.Unmount();
		};

		context.Data.Query.addEventListener('change', context.Data.Changed);
		context.Data.Changed();
	},

	$OnDestroy: function (context) {
		if (context.Data.Query)
			context.Data.Query.removeEventListener('change', context.Data.Changed);
	}
});
```

```html
<aside class="sidebar" *media="'(min-width: 800px)'">...</aside>
```

Структурная директива владеет своим элементом: `Mount()` строит его (один раз), `Unmount()` убирает вместе с компонентами внутри. CSS мог бы только скрыть боковую панель; `*media` на телефоне её вообще не строит, поэтому её компоненты, их запросы и таймеры там не запускаются. У элемента не больше одной структурной директивы (`*if`, `*for`, `*lazy`, `*media`); для двух вложите два элемента.

## 4. Где их объявлять

Регистрируйте директиву до того, как скомпилированы шаблоны, которые её используют: укажите её файл в `index.js` приложения или его библиотеки перед компонентами. Имя пишется строчными буквами (`*inview`, `*long-press`); зарегистрированное дважды, оно бросает исключение. В библиотеке добавьте `$Meta` с `Description`: инструменты и справочник его покажут.

## 5. Тестирование

Директива тестируется в браузере, на элементе маленького компонента:

```js
it('*inview marks its element and tells it', async function () {
	var seen = [];
	var host = Elemenx.Component('Host', {
		$Template: '<div style="height: 50px" *inview (inview)="Seen"></div>',
		Seen: function (event) {
			seen.push(event.detail.Visible);
		}
	})();

	document.body.appendChild(host.$Element());

	await waitFor(function () {
		return seen.length;
	});

	expect(host.$Element().querySelector('div').classList.contains('in-view')).toBe(true);
	expect(seen).toEqual([true]);

	host.$Destroy();
});
```

Проверяйте и уборку: после `$Destroy` наблюдатель или слушатель должен исчезнуть (шпион на `disconnect` или `removeEventListener`).

## Пример

Обе директивы, зарегистрированные здесь до создания компонента примера. Прокрутите так, чтобы блок ушёл с экрана и вернулся; сделайте окно уже 800 пикселей:

```example
<div class="elemenx-text small muted">Shown {{Times}} times · {{State}}</div>
<div style="height: 120px; overflow: auto; border: 1px solid var(--elemenx-border); border-radius: 8px; margin-block: 8px;">
	<div style="height: 160px; padding: 8px;">Scroll down ↓</div>
	<div class="elemenx-card" style="padding: 12px;" *tutorial-inview="{Threshold: 0.5}" (inview)="Seen">I am in view</div>
	<div style="height: 160px;"></div>
</div>
<p class="elemenx-callout" *tutorial-media="'(min-width: 800px)'">This line exists only on a window at least 800 pixels wide.</p>
<script>
(function () {
	if (!window.ElemenxTutorialDirectives) {
		window.ElemenxTutorialDirectives = true;

		Elemenx.Directive('tutorial-inview', {
			$OnCreate: function (context) {
				context.Data.Seen = function (entries) {
					var visible = entries[entries.length - 1].isIntersecting;

					context.Element.dispatchEvent(new CustomEvent('inview', {detail: {Visible: visible}}));
				};
			},

			$OnUpdate: function (context) {
				if (context.Data.Observer) return;

				context.Data.Observer = new IntersectionObserver(context.Data.Seen, {root: context.Element.parentNode, threshold: Number((context.Value || {}).Threshold) || 0});
				context.Data.Observer.observe(context.Element);
			},

			$OnDestroy: function (context) {
				if (context.Data.Observer)
					context.Data.Observer.disconnect();
			}
		});

		Elemenx.Directive('tutorial-media', {
			Structural: true,

			$OnUpdate: function (context) {
				if (context.Data.Query)
					context.Data.Query.removeEventListener('change', context.Data.Changed);

				context.Data.Query = window.matchMedia(context.Value);
				context.Data.Changed = function () {
					if (context.Data.Query.matches) context.Mount();
					else context.Unmount();
				};

				context.Data.Query.addEventListener('change', context.Data.Changed);
				context.Data.Changed();
			},

			$OnDestroy: function (context) {
				if (context.Data.Query)
					context.Data.Query.removeEventListener('change', context.Data.Changed);
			}
		});
	}

	return {
		Times: 0,
		State: 'out of view',

		Seen: function (event) {
			this.State = event.detail.Visible ? 'in view' : 'out of view';

			if (event.detail.Visible)
				this.Times += 1;
		}
	};
})()
</script>
```
