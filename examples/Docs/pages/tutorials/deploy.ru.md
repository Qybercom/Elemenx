<!-- generated -->
# Публикация в интернете

Путь от `npm run dev` до адреса в интернете: сборка, что о ней нужно знать любому статическому хостингу, настройки nginx, популярных хостингов и контейнера, кеширование, HTTPS и заголовки безопасности и проверка перед каждым релизом.

Чему вы научитесь: что лежит в `dist/`, отдача `index.html` для маршрутов, кеширование файлов с неизменными именами, сжатие, Content Security Policy для Elemenx и деплой, который запускается сам.

## 1. Сборка

```bash
npm run build          # elemenx build: dist/
npm run serve          # elemenx serve: dist/ as production would serve it, at http://127.0.0.1:<ProductionPort>
```

`dist/` — статический сайт: `index.html`, `elemenx.js`, `app.js` (приложение, его шаблоны и стили и нужные ему части библиотек), файлы библиотек, которые ему нужны, и публичные файлы проекта. Никакой серверный код его не запускает: подойдёт любой хостинг статических файлов. Всегда пробуйте сборку через `elemenx serve` перед публикацией: компонент, найденный в разработке, но не попавший в сборку (имя, составленное во время выполнения), проявится там, а не в `elemenx dev`.

`Server.Request` и `Server.WebSocket` из `elemenx.config.js`, которые туториалы используют как свой API, принадлежат серверу разработки: в продакшене этот API — ваш собственный сервер.

## 2. Три правила для любого хостинга

1. **Каждый путь роутера отдаёт `index.html`.** С `$Router: {Mode: 'history'}` перезагрузка `/orders/42` спрашивает у сервера этот путь; сервер должен ответить `index.html`, а роутер покажет страницу. Существующий файл (`/app.js`, `/images/logo.png`) отдаётся как есть. `elemenx serve` это делает; хостингу это нужно сказать.
2. **Файлы перепроверяются, а не кешируются вслепую.** Имена файлов сборки не меняются от сборки к сборке (`app.js` остаётся `app.js`), поэтому браузер, который хранит `app.js` год, никогда не увидит новую версию. Отдавайте `Cache-Control: no-cache` (или `max-age=0, must-revalidate`, как `elemenx serve`) с `ETag`: браузер спрашивает каждый раз, а сервер отвечает `304 Not Modified` без тела, пока ничего не изменилось. Это стоит одного короткого запроса на файл; по HTTP/2 они идут вместе. Картинки и шрифты, содержимое которых под тем же именем не меняется, можно кешировать дольше.
3. **Сжимайте текст.** `elemenx.js`, `app.js`, HTML, CSS и JSON сжимаются gzip или Brotli в четыре-пять раз.

`elemenx serve` следует всем трём (`Compression`, `CacheControl` в `Server` из `elemenx.config.js`): посмотрите его заголовки в инструментах разработчика и добейтесь того же от хостинга.

## 3. nginx

```nginx
server {
	listen 443 ssl http2;
	server_name app.example.com;
	root /var/www/app/dist;

	gzip on;
	gzip_types text/css application/javascript application/json image/svg+xml;

	location / {
		try_files $uri $uri/ /index.html;
		add_header Cache-Control "no-cache";
	}

	location /images/ {
		add_header Cache-Control "public, max-age=604800";
	}

	location /api/ {
		proxy_pass http://127.0.0.1:3000;
	}
}
```

`try_files ... /index.html` — это правило 1; `ETag` и ответ `304` nginx делает сам. Прокси перед потоком (server-sent events) не должен его буферизовать: `proxy_buffering off;` в его `location`.

## 4. Популярные хостинги

| Хостинг | Отдача `index.html` для маршрутов |
| --- | --- |
| Netlify | файл `_redirects` в `dist/`: `/*  /index.html  200` |
| Vercel | `vercel.json`: `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` |
| Cloudflare Pages | писать ничего не нужно: сайт без `404.html` отдаёт `index.html` на неизвестные пути |
| GitHub Pages | переписываний нет: используйте `$Router: {Mode: 'hash'}` (`/#/orders/42`) или скопируйте `index.html` в `404.html` |
| S3 + CloudFront | страница ошибки для 403 и 404 — `/index.html` с кодом 200 |

Файлы, которые должны оказаться в `dist/` (`_redirects`, `robots.txt`, `CNAME`), кладите в проект как публичные: сборка их скопирует.

## 5. Контейнер

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx elemenx build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Первый этап собирает, второй отдаёт через nginx только `dist/`: в образе нет ни Node, ни исходников.

## 6. HTTPS и заголовки безопасности

HTTPS обязателен: камера, микрофон, буфер обмена, service worker, push-уведомления и установка как приложения работают только на `https://` (и на `localhost`). Let's Encrypt выдаёт сертификаты бесплатно; большинство хостингов делают это за вас.

Заголовки, которые должна получать каждая страница:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self' wss://app.example.com; frame-ancestors 'none'
```

Content Security Policy — самая сильная защита от внедрённого скрипта. Elemenx компилирует выражения шаблонов через `new Function`: политике без `'unsafe-eval'` нужна сборка с `--precompile`, которая пишет их кодом. Компоненты ставят стили на свои элементы, отсюда `style-src 'unsafe-inline'`. `connect-src` называет ваш API и ваши сокеты.

## 7. Деплой, который запускается сам

```yaml
name: deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm test
      - run: npx elemenx build
      - run: npx wrangler pages deploy dist --project-name app
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Сначала идут тесты; красный тест останавливает деплой. Последний шаг — команда вашего хостинга (`netlify deploy --prod --dir dist`, `vercel deploy --prod`, `rsync` на ваш сервер); её ключ хранится в секретах репозитория, никогда не в коде.

## 8. Перед каждым релизом

- `npm test` зелёный, а сквозные тесты прошли по сборке (`elemenx build && elemenx serve`).
- Перезагрузка на глубоком маршруте работает на хостинге, а не только на `/`.
- Инструменты разработчика показывают `304` для неизменённых файлов при повторном визите и `gzip` или `br` у скриптов.
- Новый релиз доходит до браузера, где был предыдущий (PWA: см. [его обновление](/tutorials/pwa)).
- Консоль страницы пуста.
