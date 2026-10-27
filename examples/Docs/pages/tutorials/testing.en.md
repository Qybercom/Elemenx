# Testing an application

A list of tasks, and its tests: the logic alone in unit tests, the whole application in a browser. The finished project is `examples/Tutorials/Todo`.

What you learn: where the logic of an application goes so a test can reach it, unit tests with Vitest in a real browser, end-to-end tests with Playwright against the build, and what each kind is for.

## 1. The logic in a Service

A component shows; a Service decides. Everything a test should check without a page (adding a task, refusing an empty one, the count of the tasks left) lives in the `Todos` Service:

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

The component `TodoApp` only reads the Service and calls it from its events (see the project). This split is the whole trick: the Service is tested in a few milliseconds, the component through the page.

## 2. The tools

```bash
npm install --save-dev vitest @vitest/browser-playwright @playwright/test
npx playwright install chromium
```

Elemenx needs a DOM, its storage and its events, so the unit tests run in a real browser too, not in a fake DOM. `vitest.config.mjs`:

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

## 3. A unit test

The test loads `elemenx.js` and the file of the Service, and asks an Application for the Service: every test gets a fresh one, from an empty storage.

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

`npx vitest run` runs them. A Service of an Application is made once for it: a new Application name gives a new instance, so the tests do not share state.

A component may be tested the same way: define it with an inline `$Template`, make it (`Elemenx.Component('Name')(props)`), put its element in the page and check its DOM. Its methods are on the instance (`instance.Add()`), its events reach a listener given as `(event)` of a host component.

## 4. An end-to-end test

The real thing: the build, served as in production, used by a browser as a person would. `playwright.config.mjs` builds and serves the project before the tests:

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

Look for elements as a person does: by their label (`getByLabel`), their role and name (`getByRole('button', {name: 'Add'})`), their text. The components of ElemenxUI give their fields labels and their buttons names, so these work without test IDs.

## 5. What to test where

- **Unit tests** for the rules: validation, computations, the state a Service keeps. They are fast and many.
- **End-to-end tests** for the paths a person takes: sign in, buy, write. A few, but on the real build, as it ships.
- A bug gets a test that fails before the fix, at the cheapest level that shows it.

`npm test` in the project runs both (`vitest run && playwright test`).
