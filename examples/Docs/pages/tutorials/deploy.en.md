# Putting it online

The way from `npm run dev` to an address on the internet: the build, what any static host needs to know about it, the settings of nginx, of the common hosts and of a container, caching, HTTPS and the headers of security, and a check before every release.

What you learn: what `dist/` holds, the fallback of routes, caching files whose names do not change, compression, a Content Security Policy for Elemenx, and a deployment that runs on its own.

## 1. The build

```bash
npm run build          # elemenx build: dist/
npm run serve          # elemenx serve: dist/ as production would serve it, at http://127.0.0.1:<ProductionPort>
```

`dist/` is a static site: `index.html`, `elemenx.js`, `app.js` (the Application, its templates and styles, and the parts of its libraries it uses), the files of the libraries it needs, and the public files of the project. No server code runs it: any host of static files will do. Always try the build with `elemenx serve` before it goes: a component found in development but not in the build (a name built at run time) shows there, not in `elemenx dev`.

The `Server.Request` and `Server.WebSocket` of `elemenx.config.js`, which the tutorials use as their API, belong to the development server: in production that API is your own server.

## 2. Three rules for any host

1. **Every path of the router serves `index.html`.** With `$Router: {Mode: 'history'}`, a reload of `/orders/42` asks the server for that path; the server must answer with `index.html`, and the router shows the page. A file that exists (`/app.js`, `/images/logo.png`) is served as it is. `elemenx serve` does it; a host must be told.
2. **The files are revalidated, not cached blindly.** The names of the files of a build do not change from one build to the next (`app.js` stays `app.js`), so a browser that keeps `app.js` for a year never sees the new version. Send `Cache-Control: no-cache` (or `max-age=0, must-revalidate`, as `elemenx serve` does) with an `ETag`: the browser asks each time, and the server answers `304 Not Modified` with no body while nothing changed. That costs one short request per file; with HTTP/2 they go together. Images and fonts whose content never changes under the same name may be cached longer.
3. **Compress the text.** `elemenx.js`, `app.js`, the HTML, the CSS and the JSON shrink four or five times with gzip or Brotli.

`elemenx serve` follows all three (`Compression`, `CacheControl` in `Server` of `elemenx.config.js`): read its headers in the developer tools, and make the host send the same.

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

`try_files ... /index.html` is rule 1; nginx sends `ETag` and answers `304` by itself. A proxy in front of a stream (server-sent events) must not buffer it: `proxy_buffering off;` in its `location`.

## 4. The common hosts

| Host | The fallback of routes |
| --- | --- |
| Netlify | a file `_redirects` in `dist/`: `/*  /index.html  200` |
| Vercel | `vercel.json`: `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` |
| Cloudflare Pages | none to write: a site without a `404.html` serves `index.html` for unknown paths |
| GitHub Pages | no rewrites: use `$Router: {Mode: 'hash'}` (`/#/orders/42`), or copy `index.html` to `404.html` |
| S3 + CloudFront | the error page for 403 and 404 is `/index.html` with the code 200 |

Files that must be in `dist/` (`_redirects`, `robots.txt`, `CNAME`) go in the project as public files: the build copies them.

## 5. A container

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

The first stage builds, the second serves only `dist/` with nginx: the image holds no Node and no sources.

## 6. HTTPS and the headers of security

HTTPS is not optional: the camera, the microphone, the clipboard, service workers, push notifications and installation as an application work only on `https://` (and on `localhost`). Let's Encrypt gives certificates for free; most hosts do it for you.

The headers every page should get:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self' wss://app.example.com; frame-ancestors 'none'
```

A Content Security Policy is the strongest defense against an injected script. Elemenx compiles the expressions of its templates with `new Function`: a policy without `'unsafe-eval'` needs a build with `--precompile`, which writes them as code. Components put styles on their elements, hence `style-src 'unsafe-inline'`. `connect-src` names your API and your sockets.

## 7. A deployment that runs on its own

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

The tests run first; a red test stops the deployment. The last step is the command of your host (`netlify deploy --prod --dir dist`, `vercel deploy --prod`, an `rsync` to your server); its key lives in the secrets of the repository, never in the code.

## 8. Before every release

- `npm test` is green, and the end-to-end tests ran against the build (`elemenx build && elemenx serve`).
- A reload on a deep route works on the host, not only on `/`.
- The developer tools show `304` for unchanged files on a second visit, and `gzip` or `br` on the scripts.
- A new release reaches a browser that had the previous one (a PWA: see [its update](/tutorials/pwa)).
- The console of the page is empty.
