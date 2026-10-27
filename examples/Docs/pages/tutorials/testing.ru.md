<!-- generated -->
# Тестирование приложения

Список задач и его тесты: логика отдельно — в модульных тестах, приложение целиком — в браузере. Готовый проект — `examples/Tutorials/Todo`.

Чему вы научитесь: куда положить логику приложения, чтобы тест мог до неё добраться, модульные тесты на Vitest в настоящем браузере, сквозные тесты на Playwright по сборке и для чего нужен каждый вид.

## 1. Логика в сервисе

Компонент показывает, сервис решает. Всё, что тест должен проверить без страницы (добавление задачи, отказ пустой задаче, число оставшихся), живёт в сервисе `Todos`:

```js
Elemenx.Service('Todos', {
	StorageKey: 'tasks',

	$OnCreate: function () {
		this.Store = this.$Storage.Local.Namespace('todo');
		this.Items = this.Store.Get(this.StorageKey) || [];
		this.Listeners = [];
	},

	Add: function (text) {
		var title = String(text || '').trim();
		if (!title)
			throw new Error('A task needs a title');

		this.Save(this.Items.concat([{ID: Date.now() + '-' + this.Items.length, Title: title, Done: false}]));
	},

	Left: function () {
		return this.List('active').length;
	}
});
```

Компонент `TodoApp` только читает сервис и вызывает его из своих событий (см. проект). В этом разделении весь смысл: сервис проверяется за миллисекунды, компонент — через страницу.

## 2. Инструменты

```bash
npm install --save-dev vitest @vitest/browser-playwright @playwright/test
npx playwright install chromium
```

Elemenx нужны DOM, его хранилище и его события, поэтому модульные тесты тоже идут в настоящем браузере, а не в поддельном DOM. `vitest.config.mjs`:

```js
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	test: {
		include: ['tests/**/*.test.js'],
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [{browser: 'chromium'}],
			headless: true
		}
	}
});
```

## 3. Модульный тест

Тест загружает `elemenx.js` и файл сервиса и просит сервис у приложения: каждый тест получает свежий экземпляр с пустым хранилищем.

```js
import { beforeEach, describe, expect, it } from 'vitest';
import '@qybercom/elemenx/elemenx.js';
import '../Todo/services/Todos.js';

describe('Todos', function () {
	var todos;

	beforeEach(function () {
		localStorage.clear();

		todos = Elemenx.Application('Tests' + Math.random(), {}).$Service('Todos');
	});

	it('refuses a task without a title', function () {
		expect(function () {
			todos.Add('   ');
		}).toThrow('A task needs a title');
	});

	it('ticks, filters and clears the tasks done', function () {
		todos.Add('One');
		todos.Add('Two');
		todos.Toggle(todos.List()[0].ID);
		todos.ClearDone();

		expect(todos.List().map(function (item) {
			return item.Title;
		})).toEqual(['Two']);
	});
});
```

`npx vitest run` запускает их. Сервис приложения создаётся для него один раз: новое имя приложения даёт новый экземпляр, поэтому тесты не делят состояние.

Компонент можно проверять так же: определите его со встроенным `$Template`, создайте (`Elemenx.Component('Name')(props)`), поместите его элемент на страницу и проверьте DOM. Его методы — на экземпляре (`instance.Add()`), его события доходят до слушателя, заданного как `(event)` у компонента-хозяина.

## 4. Сквозной тест

Настоящая проверка: сборка, отданная как в продакшене, и браузер, которым пользуются как человек. `playwright.config.mjs` собирает и запускает проект перед тестами:

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	testMatch: '**/*.spec.js',
	use: {
		baseURL: 'http://127.0.0.1:4318'
	},
	webServer: {
		command: 'npx elemenx build && npx elemenx serve',
		url: 'http://127.0.0.1:4318',
		reuseExistingServer: true
	}
});
```

```js
import { expect, test } from '@playwright/test';

test('adds a task, ticks it, filters and clears it', async function ({ page }) {
	await page.goto('/');

	await page.getByLabel('New task').fill('Buy milk');
	await page.getByLabel('New task').press('Enter');

	await expect(page.locator('.todo-left')).toHaveText('1 left');

	await page.getByText('Buy milk').click();
	await page.getByRole('button', {name: 'Clear done'}).click();

	await expect(page.locator('.todo-empty')).toBeVisible();
});
```

Ищите элементы так, как ищет человек: по подписи (`getByLabel`), по роли и имени (`getByRole('button', {name: 'Add'})`), по тексту. Компоненты ElemenxUI дают своим полям подписи, а кнопкам имена, поэтому это работает без тестовых ID.

## 5. Что где проверять

- **Модульные тесты** — для правил: валидация, вычисления, состояние сервиса. Они быстрые, и их много.
- **Сквозные тесты** — для путей человека: вход, покупка, письмо. Их немного, но они идут по настоящей сборке, такой, какая уходит пользователям.
- Ошибка получает тест, который падает до исправления, на самом дешёвом уровне, где она видна.

`npm test` в проекте запускает оба вида (`vitest run && playwright test`).
