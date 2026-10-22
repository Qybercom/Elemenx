<!-- generated -->
# Progress

Ход выполнения задачи. Value от 0 до Max (100); null показывает процесс, не знающий своего конца (бегущая полоса, вращающееся кольцо). Variant: bar или ring. Tone: accent, success, warning или danger. Label называет его (показывается над полосой, читается экранными читалками); ShowValue выводит проценты. Size: small, medium или large.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `null` |
| `Max` | `100` |
| `Variant` | `'bar'` |
| `Tone` | `'accent'` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `ShowValue` | `false` |

## Пример

```example
<Progress [value]="Value" Label="Upload" ShowValue="true" />
<Progress [value]="Value" Variant="ring" ShowValue="true" Tone="success" />
<Progress Label="Waiting for the server" />
<Progress Value="90" Tone="danger" Size="small" Label="Disk" ShowValue="true" />
<Button Label="+10%" (click)="More" />
<script>
({
	Value: 40,

	More: function () {
		this.Value = this.Value >= 100 ? 0 : this.Value + 10;
	}
})
</script>
```
