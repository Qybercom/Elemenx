# Как происходит навигация

Клик по ссылке на `/orders/42` — и через мгновение показана страница заказа, адрес сменился, а «Назад» возвращает обратно. Между этими моментами роутер делает семь шагов, и любой из них может остановить путь или перенаправить его.

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 484" role="img" aria-label="Навигация шаг за шагом">
	<title>Навигация шаг за шагом</title>
	<rect class="box" x="170" y="20" width="420" height="48" rx="8" />
	<text x="380" y="48.5" text-anchor="middle" class="strong">Go('/orders/42'), ссылка, «Назад»</text>
	<rect class="box" x="170" y="86" width="420" height="48" rx="8" />
	<text x="380" y="105.5" text-anchor="middle" class="strong">Сопоставление: /orders/:id</text>
	<text x="380" y="123.5" text-anchor="middle" class="muted">$Params.id равен '42'</text>
	<rect class="box" x="170" y="152" width="420" height="48" rx="8" />
	<text x="380" y="171.5" text-anchor="middle" class="strong">Уход: $OnRouteLeave</text>
	<text x="380" y="189.5" text-anchor="middle" class="muted">текущая страница может отказать</text>
	<rect class="box accent" x="170" y="218" width="420" height="48" rx="8" />
	<text x="380" y="237.5" text-anchor="middle" class="strong">Гарды</text>
	<text x="380" y="255.5" text-anchor="middle" class="muted">true, false, другой путь или $Wait</text>
	<rect class="box" x="170" y="284" width="420" height="48" rx="8" />
	<text x="380" y="303.5" text-anchor="middle" class="strong">Загрузка компонентов</text>
	<text x="380" y="321.5" text-anchor="middle" class="muted">из бандла или их файлов</text>
	<rect class="box" x="170" y="350" width="420" height="48" rx="8" />
	<text x="380" y="369.5" text-anchor="middle" class="strong">Фиксация</text>
	<text x="380" y="387.5" text-anchor="middle" class="muted">отрисовка в outlet или пробуждение из кеша</text>
	<rect class="box" x="170" y="416" width="420" height="48" rx="8" />
	<text x="380" y="435.5" text-anchor="middle" class="strong">История и заголовок</text>
	<text x="380" y="453.5" text-anchor="middle" class="muted">адрес, $Title, события роутера</text>
	<polyline class="line" points="380,68 380,86" />
	<polygon class="head" points="380,86 384.5,77.0 375.5,77.0" />
	<polyline class="line" points="380,134 380,152" />
	<polygon class="head" points="380,152 384.5,143.0 375.5,143.0" />
	<polyline class="line" points="380,200 380,218" />
	<polygon class="head" points="380,218 384.5,209.0 375.5,209.0" />
	<polyline class="line" points="380,266 380,284" />
	<polygon class="head" points="380,284 384.5,275.0 375.5,275.0" />
	<polyline class="line" points="380,332 380,350" />
	<polygon class="head" points="380,350 384.5,341.0 375.5,341.0" />
	<polyline class="line" points="380,398 380,416" />
	<polygon class="head" points="380,416 384.5,407.0 375.5,407.0" />
	<rect class="box soft" x="20" y="152" width="124" height="48" rx="8" />
	<text x="82" y="171.5" text-anchor="middle" class="strong">Отказ</text>
	<text x="82" y="189.5" text-anchor="middle" class="muted">страница остаётся</text>
	<polyline class="line" points="170,176 144,176" />
	<polygon class="head" points="144,176 153.0,180.5 153.0,171.5" />
	<rect class="box soft" x="616" y="218" width="124" height="48" rx="8" />
	<text x="678" y="237.5" text-anchor="middle" class="strong">Путь</text>
	<text x="678" y="255.5" text-anchor="middle" class="muted">перейти туда</text>
	<polyline class="line" points="590,242 616,242" />
	<polygon class="head" points="616,242 607.0,237.5 607.0,246.5" />
</svg>
```

## 1. Начало

Навигация начинается одним из трёх способов: клик по `<a href>` того же сайта (роутер его перехватывает, если ссылка не открывает новую вкладку или загрузку), вызов в коде (`this.$Router().Go('/orders/42')` или `Replace`), или «Назад» и «Вперёд» браузера. Все три идут дальше одним путём. Новая навигация, начавшаяся, пока идёт предыдущая, делает ту недействительной (`NavigationCancel`).

## 2. Сопоставление

Роутер сопоставляет путь со своими маршрутами — от внешнего к внутреннему: `/orders/:id` подходит и даёт `$Params.id = '42'`; запрос (`?tab=items`) и хеш уходят в `$Query` и `$Hash`. Вложенные маршруты дают цепочку: макет `/orders`, затем страница заказа в его outlet. Ни один маршрут не подошёл — компонент `NotFound` роутера, или браузер сам переходит по ссылке.

## 3. Уход

Текущая страница может отказаться уходить: её `$OnRouteLeave(context)` отвечает как гард. Форма с несохранёнными изменениями спрашивает «Уйти без сохранения?» и отвечает `false`, чтобы остаться. Маршруты, общие у старого и нового пути (общий макет), не покидаются вовсе.

## 4. Гарды

Каждый гард нового маршрута спрашивается по очереди (`Guard: 'SignedIn'` или список):

| Гард возвращает | Роутер |
| --- | --- |
| `true` | идёт к следующему гарду |
| `false` | останавливается; страница остаётся, показывается `GuardFailed`, если он есть у маршрута |
| путь (`'/login?return=/orders/42'`) | начинает навигацию туда |
| `this.$Wait(function (done) {...})` | ждёт `done(answer)`, показывая тем временем компонент `Waiting` |
| `this.$Fail(reason, data)` | останавливается с причиной для `GuardFailed` |

Гарды отвечают значением или колбэком, никогда не Promise. Гард не даёт странице показаться; данные за ней защищает сервер.

## 5. Загрузка

Компоненты маршрута должны быть определены. Из бандла они уже есть; в разработке роутер просит Discovery загрузить их файлы и ждёт (см. [От скрипта до первого экрана](/core/startup)). Файл, который не загрузился, заканчивает навигацию с `NavigationError`, и адрес возвращается туда, где был.

## 6. Фиксация

Теперь роутер меняет страницу: адрес становится новым (`NavigationCommit`), компонент каждого уровня отрисовывается в свой outlet (`*outlet="Content"` в макете над ним) со своими `$Params`, `$Query` и `$Hash`, а старый уничтожается или засыпает, если `Elemenx.Cache` хранит страницы. Страница, спящая под тем же маршрутом и параметрами, просыпается вместо того, чтобы строиться. Тот же маршрут с другими параметрами сохраняет компонент и меняет только значения: шаблон, читающий `$Params.id`, следует сам.

## 7. История и заголовок

История браузера получает запись (`Go`) или её запись заменяется (`Replace`). Компонент с `$Title` называет вкладку. Когда отрисованы компоненты маршрута и те, что загрузились внутри них позже, приходит `NavigationEnd`: момент перевести фокус, отправить событие аналитики, прокрутить.

## Где живёт маршрут

| Режим | Адрес | Для чего |
| --- | --- | --- |
| `history` | `/orders/42` | сайт по http; сервер отдаёт `index.html` на каждый путь |
| `hash` | `/#/orders/42` | хостинг, который не умеет переписывать пути |
| `memory` | не меняется | файл, расширение браузера, окно десктоп-программы; по умолчанию там, где нет http |

Шаги одинаковы в любом режиме; отличается только место маршрута.
