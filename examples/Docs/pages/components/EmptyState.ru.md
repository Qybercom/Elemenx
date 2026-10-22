<!-- generated -->
# EmptyState

То, что показывает список, таблица или панель, когда в них ничего нет: иконка, заголовок, описание и действия (слот actions), слот по умолчанию — для остального. Variant: empty (по умолчанию), search (ничего не найдено), error (не удалось загрузить), offline; у каждого своя иконка, если Icon не задаёт другую. Size: small (внутри списка или таблицы) или medium.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Description` | `''` |
| `Icon` | `''` |
| `Variant` | `'empty'` |
| `Size` | `'medium'` |

## Слоты

по умолчанию, `actions`

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: stretch;">
	<EmptyState Icon="search" Title="Nothing found" Description="Try another word.">
		<Button Label="Clear the search" Size="small" />
	</EmptyState>
	<EmptyState Icon="folder-open" Title="No projects yet" Description="Create a project to start." Variant="empty" />
	<EmptyState Icon="warning" Title="Something went wrong" Description="The server did not answer." Variant="error" Size="small" />
</div>
```
