Web Push: сервер приложения отправляет сообщения, которые доходят до пользователя, даже когда страница закрыта (Service Worker показывает их как уведомления). HTTPS или localhost. Каждый метод принимает callback(error, result); error.name — имя ошибки браузера ('NotAllowedError', когда пользователь отказал, 'NotSupportedError', где в браузере нет push).

- Supported(): есть ли в браузере Web Push. Permission(): 'granted', 'denied' или 'default'.
- Subscribe({Key, Worker}, callback): спрашивает пользователя, затем подписывается; результат {Endpoint, Keys: {P256dh, Auth}, ExpirationTime, JSON} отправляется серверу, который отправляет на него сообщения (закрытым ключом пары Key: открытый ключ VAPID в base64url). Worker — URL Service Worker, принимающего сообщения; он регистрируется, если у страницы нет своего (в docs/LIBRARIES.md есть готовый для копирования: показывает {Title, Text, Icon, URL, Tag} как уведомление, нажатие открывает URL, и он сообщает открытым страницам).
- Subscription(callback): подписка этого браузера или null. Unsubscribe(callback): true, если она удалена.
- Notify(title, {Text, Icon, Tag, URL}, callback): уведомление от самой страницы (без сервера).
- On('message', callback) / Off('message', callback): сообщения, которые воркер передаёт открытым страницам ({Type: 'push' или 'click', Data}).
