# An accessible application

One person in five lives with a disability; everyone has a broken arm, a bright sun on a phone or a slow network some day. An accessible application works with a keyboard alone, with a screen reader, at a large zoom, in high contrast and without animation. Most of it is free if it is built in from the start, and costly to add later.

What you learn: what ElemenxUI does for you, and what is still yours: the order of headings and landmarks, names of controls, the focus, messages that are read aloud, color and motion, and how to test it all.

## 1. What the components give

The components of ElemenxUI are built for it, and the tests of the project check it:

- A `Field` names its control by its `Label` (`aria-labelledby`) and marks it required (`aria-required`); its error is a `role="alert"` read when it shows.
- `Dialog` and `Drawer` are `<dialog>` elements: the focus goes in, stays in, and comes back to the button that opened them; Escape closes them.
- `Select`, `Menu`, `Tabs`, `RadioGroup`, `Tree` and the others follow the patterns of the WAI-ARIA Authoring Practices: their roles, their states (`aria-expanded`, `aria-selected`), and their keys (arrows, Home, End, typing a letter).
- `ToastHost` is a live region: a toast is read without taking the focus.
- The focus is always visible (`:focus-visible`), the animations stop under `prefers-reduced-motion`, and the `contrast` theme raises every contrast (`this.$Service('Theme').Use('contrast')`).
- In a right-to-left language the components mirror themselves, and their arrow keys keep their meaning (`Elemenx.Locale.Key`).

None of it helps if the page around them is a pile of `div`s.

## 2. The page: landmarks and headings

```html
<header>...</header>
<nav aria-label="Pages">...</nav>
<main>
	<h1>Orders</h1>
	<section aria-labelledby="open-title">
		<h2 id="open-title">Open</h2>
		...
	</section>
</main>
<footer>...</footer>
```

A screen reader lists the landmarks (`header`, `nav`, `main`, `footer`) and the headings, and jumps between them: that is how a page is read without seeing it. One `h1` for each page, levels without gaps. The router changes the page without loading it: give each route a `$Title` (it becomes the title of the tab, which is read), and move the focus to the `h1` of the new page, so the reader starts there and not at the link that was pressed:

```js
$OnReady: function () {
	var heading = this.$Element().querySelector('h1');

	heading.setAttribute('tabindex', '-1');
	heading.focus();
}
```

## 3. Every control has a name

A button with only an icon says nothing to a screen reader:

```html
<!-- Read as "button" -->
<button type="button" (click)="Removed"><Icon Name="delete" /></button>

<!-- Read as "Remove Buy milk, button" -->
<button type="button" [attribute.aria-label]="'Remove ' + item.Title" (click)="Removed"><Icon Name="delete" /></button>
<Button Icon="delete" Title="Remove" (click)="Removed" />
```

An `Input` outside a `Field` takes its name from `Label`; a link says where it goes ("Read the report", not "click here"); an image that tells something has an `alt`, and a decoration has `alt=""`.

## 4. The keyboard

- Use the real element: `<button>` for an action, `<a href>` for a place. A `div` with `(click)` is not reached by Tab and not pressed by Enter.
- The order of Tab is the order of the markup: lay the page out with CSS, not by moving the focus around with `tabindex`. `tabindex="0"` makes an element reachable; never a positive number.
- Whatever opens with the mouse opens with the keyboard, and closes with Escape. Whatever happens on hover happens on focus.
- Shortcuts (`*hotkey`, the `Hotkeys` service) are a help, never the only way, and a shortcut of one letter must be turnable off: it fires while a reader of speech types.

## 5. Messages that are heard

A change that shows somewhere else on the page (a saved form, a count, an error of the server) is not seen by someone who does not see it. Put it in a live region:

```html
<p class="status" role="status">{{Saved ? 'Saved' : ''}}</p>
<div class="elemenx-callout danger" role="alert" *if="Error">{{Error}}</div>
```

`role="status"` (polite) waits for a pause; `role="alert"` interrupts, for errors only. The region must be in the page before its text changes: a region added together with its text is often not read. A toast (`this.$Service('Toast').Show(...)`) is read for you.

## 6. Color, size and motion

- Text and its background need a contrast of 4.5 to 1 (3 to 1 for large text and for the borders of controls). The tokens of ElemenxUI hold it in both schemes; a color of your own must too.
- Never say something by color alone: an error is red and has a text and an icon; a required field has a mark and `aria-required`.
- The page works at 200% zoom and at a width of 320 CSS pixels without scrolling sideways. Sizes in `rem` follow the font size the person chose.
- Movement stops under `prefers-reduced-motion: reduce`, and nothing flashes more than three times a second.

## 7. Testing

- **With the keyboard**: put the mouse away and do every task of the page. Is the focus always visible? Does Tab go in a sensible order? Can you leave every dialog?
- **With a screen reader**: NVDA on Windows (free), VoiceOver on macOS and iOS (Cmd+F5), TalkBack on Android. Listen to one page from the start, then by headings and by landmarks.
- **Automatically**: axe finds about a third of the problems (contrast, names, roles). With Playwright:

```js
import AxeBuilder from '@axe-core/playwright';

test('the page has no violations axe can find', async function ({ page }) {
	await page.goto('/');

	expect((await new AxeBuilder({page: page}).analyze()).violations).toEqual([]);
});
```

- **In the tests you have**: look for elements as a person does, `getByRole('button', {name: 'Save'})` and `getByLabel('Email')`. A test that finds a control by its role and its name fails when the control loses them: it tests accessibility for nothing. The tutorials of this reference are tested that way.

## 8. A list to keep

- Landmarks, one `h1`, headings without gaps; a `$Title` for every route.
- Every control has a name; every image that tells something has an `alt`.
- Everything works with the keyboard, the focus is visible, Escape closes.
- Changes elsewhere on the page are in a live region.
- Contrast 4.5:1, nothing by color alone, 200% zoom, 320 pixels wide.
- Motion respects `prefers-reduced-motion`.
- Tested with a keyboard, a screen reader and axe.
