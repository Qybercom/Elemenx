<!-- generated -->
# Toggle

Переключатель: флажок, нарисованный как дорожка с бегунком (role switch). Checked — его состояние, Label и Description — текст рядом; Size: small или medium. Name и Disabled — как у флажка. События: change (Checked).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Checked` | `false` |
| `Label` | `''` |
| `Description` | `''` |
| `Size` | `'medium'` |
| `Name` | `null` |
| `Disabled` | `false` |

## События

- `change`: Переключён: Checked.

## Пример

```example
<div class="docs-stack">
	<Toggle Label="Notifications" Description="Get a message on every reply" [checked]="Notify" (change)="Notified" />
	<Toggle Label="Sound" Size="small" [checked]="Sound" [disabled]="!Notify" (change)="Sounded" />
	<Toggle Label="Always off" Disabled="true" />
</div>
<p class="elemenx-text small muted">Notifications {{Notify ? 'on' : 'off'}}, sound {{Notify && Sound ? 'on' : 'off'}}.</p>
<script>
({
	Notify: true,
	Sound: false,

	Notified: function (value) {
		this.Notify = value;
	},

	Sounded: function (value) {
		this.Sound = value;
	}
})
</script>
```
