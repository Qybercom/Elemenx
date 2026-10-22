<!-- generated -->
# GameKey

Подсказка управления: «[A] Продолжить». Показывает кнопку используемого геймпада (Button: a, b, x, y, lb, rb, lt, rt, select, start... так, как их называет этот вид геймпада: A, ✕, B), а без геймпада — клавишу клавиатуры (Keyboard: 'Enter', 'E', 'Escape'). Label — текст после неё. Следует за геймпадом: подключите или смените его — и она изменится. Pad (xbox, playstation, nintendo, generic) показывает кнопки этого вида геймпада, что бы ни было подключено (страница справки). Кнопка нарисована как на геймпаде: цвета и символы основных кнопок, бамперы, курки, стики, крестовина с выделенным направлением, кнопки меню.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Button` | `'a'` |
| `Keyboard` | `''` |
| `Label` | `''` |
| `Pad` | `''` |

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<GameKey Button="a" Pad="xbox" Label="Jump" />
	<GameKey Button="a" Pad="playstation" Label="Jump" />
	<GameKey Button="a" Pad="nintendo" Label="Jump" />
	<GameKey Button="lt" Pad="xbox" Label="Aim" />
	<GameKey Button="up" Pad="generic" Label="Climb" />
	<GameKey Keyboard="E" Label="Use" />
	<GameKey Keyboard="Escape" Label="Menu" />
</div>
<p class="elemenx-text small muted">Without Pad, a GameKey follows the gamepad in use, and shows the key of the keyboard when there is none.</p>
```
