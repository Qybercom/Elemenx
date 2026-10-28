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

## Тесты

- [puts an icon in the favicon, draws a count and a ring over it, and brings the icon of the page back](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/platform-icon.test.js#L99) — `tests/regression/platform-icon.test.js`
- [in a program gives the windows the icon drawn into a PNG at every change of Elemenx.Icon, and the count and the progress to the system](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/platform-icon.test.js#L207) — `tests/regression/platform-icon.test.js`
