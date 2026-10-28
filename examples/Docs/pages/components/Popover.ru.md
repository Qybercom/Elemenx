<!-- generated -->
# Popover

Всплывающее содержимое рядом с элементом. Слоты: trigger (якорь: Button, ссылка...) и по умолчанию (содержимое). Trigger: click (по умолчанию) или hover. Open может задавать владелец; событие toggle сообщает о каждом изменении. Placement: bottom-start, bottom-end, top-start, right-start.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Open` | `false` |
| `Trigger` | `'click'` |
| `Placement` | `'bottom-start'` |
| `Title` | `''` |
| `Width` | `''` |

## События

- `toggle`: Открылся или закрылся: true или false.

## Слоты

`trigger`, по умолчанию

## Пример

```example
<Popover Title="Popover">
	<Button slot="trigger" Label="Open a popover" Icon="info" />
	<p class="elemenx-text">Any content: text, a form, a list.</p>
	<Button Label="An action" Size="small" Variant="primary" />
</Popover>
<Popover Trigger="hover" Placement="top-start">
	<span slot="trigger" class="elemenx-link">Hover here</span>
	<p class="elemenx-text small">A hint shown on hover.</p>
</Popover>
```

## Тесты

- [Popover opens and closes by its trigger, tells it, and closes on Escape](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-overlays.test.js#L180) — `tests/regression/library-overlays.test.js`
