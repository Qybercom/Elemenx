<!-- generated -->
# Centered

Страница с содержимым по центру — для форм входа, ошибок и пустых состояний, на основе elemenx-screen и elemenx-column. Слоты: brand (над содержимым), по умолчанию (содержимое), actions (кнопки под ним), footer (внизу). Icon, Code, Title и Description рисуют стандартное состояние (Code — большое число вроде 404). Width: small (360px), medium (480px) или large (640px). Card кладёт содержимое на поверхность.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Icon` | `''` |
| `Code` | `''` |
| `Title` | `''` |
| `Description` | `''` |
| `Width` | `'medium'` |
| `Card` | `false` |

## Слоты

`brand`, по умолчанию, `actions`, `footer`

## Пример

```example
<div class="docs-frame">
	<Centered Width="small" Card="true" Title="Sign in" Description="Use your work account">
		<Field Label="Email"><Input Type="email" Placeholder="you@example.com" /></Field>
		<Field Label="Password"><Input Type="password" /></Field>
		<Button slot="actions" Label="Sign in" Variant="primary" Block="true" />
		<span slot="footer" class="elemenx-text small muted">No account? <a class="elemenx-link" href="#">Create one</a></span>
	</Centered>
</div>
<div class="docs-frame">
	<Centered Code="404" Title="Page not found" Description="The page was moved or never existed.">
		<Button slot="actions" Label="Go home" Icon="home" />
	</Centered>
</div>
```
