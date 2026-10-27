<!-- generated -->
# Вход в аккаунт

Вход, как его делает настоящее приложение: пароль, который проверяет сервер, короткий access-токен в памяти, refresh-токен в cookie, которую страница не может прочитать, сессия, переживающая перезагрузку, токен, который сам обновляется по истечении, и страницы, закрытые для гостей. Готовый проект — `examples/Tutorials/Auth`; пользователь — `ada@example.com` с паролем `correct horse 7`.

Чему вы научитесь: access- и refresh-токены и где живёт каждый, JWT, подписанный и проверяемый на сервере, ротация refresh-токена, гард, который ждёт сессию, запрос, который обновляет свой токен, безопасный возврат после входа и что добавляет OAuth.

## 1. Два токена

```text
 sign in ──► server: password ok ──► access token (JSON, 5 minutes)  ──► memory of the page
                                  └─► refresh token (30 days)        ──► cookie: HttpOnly, SameSite=Strict, Path=/api/auth

 a request ──► Authorization: Bearer <access token>
 401       ──► POST /api/auth/refresh (the cookie goes by itself) ──► a new access token and a new refresh token
```

- **Access-токен** уходит с каждым запросом. Он живёт недолго: украденный стоит минуты. Он хранится в переменной сервиса Session, а не в `localStorage`, где его прочитал бы любой скрипт, внедрённый в страницу (плохая зависимость, XSS).
- **Refresh-токен** только покупает новые access-токены. Он лежит в cookie с `HttpOnly` (скрипты её не читают), `SameSite=Strict` (другие сайты её не отправляют) и `Path=/api/auth` (она уходит только на адреса сессии). В продакшене добавьте `Secure`: только HTTPS.

## 2. Сервер

Проект подписывает токены сам, через HMAC-SHA256: JWT — это три части в base64url: заголовок, утверждения (`sub` — пользователь, `exp` — срок) и подпись обоих.

```js
function sign (payload) {
	var head = base64url(JSON.stringify({alg: 'HS256', typ: 'JWT'})) + '.' + base64url(JSON.stringify(payload));

	return head + '.' + base64url(crypto.createHmac('sha256', secret).update(head).digest());
}
```

`verify(token)` вычисляет подпись заново, сравнивает её через `crypto.timingSafeEqual` (обычное сравнение по времени подсказывает атакующему, сколько символов верно) и отвергает истёкший токен. Настоящий сервер берёт библиотеку для JWT и держит секрет вне кода.

Ещё три правила сервера, по строке в проекте:

- Пароль хранится как медленный хеш с солью (`crypto.scryptSync`), никогда как есть.
- Неверная почта и неверный пароль получают один и тот же ответ: никто не узнает, у каких адресов есть аккаунты.
- **Ротация**: каждое обновление заменяет refresh-токен, и старый перестаёт работать. Украденный refresh-токен сработает не больше одного раза, а следующее использование настоящего покажет кражу.

Без сессии `/api/auth/refresh` отвечает 204: гость — это не ошибка.

## 3. Сервис Session

```js
$OnCreate: function () {
	var token = '';

	this.User = null;

	this.Token = function (value) {
		if (value !== undefined)
			token = value;

		return token;
	};
}
```

Токен — переменная замыкания, а не поле состояния: он никогда не отрисовывается, не попадает в инструменты разработчика для состояния и исчезает вместе с вкладкой.

`Restore(callback)` меняет cookie на access-токен после перезагрузки. Гард и шапка оба хотят пользователя при старте: первый вызов спрашивает сервер, остальные ждут его ответа, а последующие уже знают ответ.

`Request(method, url, data, callback)` добавляет `Authorization: Bearer`; 401 значит, что access-токен истёк, поэтому он один раз восстанавливает сессию (`force`) и спрашивает снова:

```js
this.Call(method, url, data, function (error, status, value) {
	if (!error && status === 401) {
		self.Restore(function (signedIn) {
			if (!signedIn) {
				callback(new Error('Signed out.'));

				return;
			}

			self.Call(method, url, data, function (again, code, result) {
				callback(again || (code !== 200 ? new Error(result.Error || 'The server answered ' + code) : null), result);
			});
		}, true);

		return;
	}

	callback(error || (status !== 200 ? new Error(value.Error || 'The server answered ' + status) : null), value);
});
```

Страницы никогда не видят токен: они вызывают `Request`, остальное делает Session.

## 4. Гард ждёт

После перезагрузки у страницы ещё нет access-токена. Гард `/account` ждёт `Restore`, а не отправляет вошедшего пользователя на страницу входа:

```js
Elemenx.Guard('SignedIn', function () {
	var session = this.$Service('Session');
	var to = this.$To.Path;

	if (session.SignedIn()) return true;

	return this.$Wait(function (done) {
		session.Restore(function (signedIn) {
			done(signedIn ? true : '/login?return=' + encodeURIComponent(to));
		});
	});
});
```

Гард не даёт странице показаться, но данные он не защищает. Данные защищает сервер, который проверяет токен каждого запроса.

## 5. Назад, откуда пришли, и никуда больше

Страница входа возвращает пользователя туда, откуда его прислали (`?return=/account`). Принимайте только путь этого сайта: иначе `?return=//evil.example` в ссылке заставит вашу же страницу отправить пользователя на её копию.

```js
self.$Router().Replace(/^\/(?!\/)/.test(self.$Query.return || '') ? self.$Query.return : '/account');
```

Форма даёт полям `Autocomplete="username"` и `"current-password"`: менеджер паролей браузера заполняет и сохраняет их.

## 6. Выход

`SignOut` просит сервер забыть refresh-токен и очистить cookie, а затем забывает access-токен. Если очистить только страницу, останется refresh-токен, который всё ещё работает.

## 7. А OAuth?

«Войти через Google» — это OAuth 2.0 с OpenID Connect. Его поток для веб-приложения — **authorization code с PKCE**:

1. Страница создаёт случайный `code_verifier`, сохраняет его и отправляет пользователя к провайдеру с его хешем (`code_challenge`) и случайным `state`.
2. Пользователь входит там; провайдер возвращает его с `code` и `state`.
3. Ваш сервер (или страница) обменивает `code` и `code_verifier` на токены провайдера; `state` должен совпасть с отправленным, иначе ответ отвергается.

Безопаснее всего завершать поток на вашем сервере: он берёт токены провайдера, находит или создаёт пользователя и затем выдаёт браузеру те же два токена, что и в этом туториале. Страница остаётся прежней; только `SignIn` становится ссылкой на провайдера. Используйте для OAuth библиотеку своего сервера: ошибки прячутся именно в деталях (`state`, `nonce`, проверки ID-токена).

## 8. Попробуйте

```bash
cd examples/Tutorials/Auth
npm install
npm run dev
```

Откройте `/account`, войдите, перезагрузите страницу: вы остаётесь в аккаунте, а инструменты разработчика не показывают токена в хранилищах и показывают cookie, которую страница не может прочитать. Сквозной тест проекта к тому же отвечает на первый `/api/me` кодом 401 и проверяет, что страница всё равно показывает аккаунт.
