<!-- generated -->
# *mask

*mask="{Mask: Mask, Value: Value}" строго удерживает <input> в пределах маски. Позиции: # — цифра, A — латинская буква, * — цифра или буква; любой другой символ маски — литерал. Value хранит только символы позиций. После каждого ввода (набор, вставка, перетаскивание, автозаполнение) текст собирается заново из принятых символов, так что ничего вне маски не остаётся. Затем элемент отправляет событие DOM "mask" с detail {Value, Text, Complete}; обработчик может переписать detail.Value.

Guide: символ ('_', или true для '_'), показанный в пустых позициях, пока поле в фокусе или заполнено, так что весь шаблон остаётся на месте и удалённый символ виден. Backspace: 'delete' (по умолчанию) удаляет символ перед литералом под курсором; 'skip' только переводит курсор через литерал.

## Пример

```example
<Field Label="Phone"><span class="elemenx-input"><input class="elemenx-input-control" *mask="{Mask: '+7 (###) ###-##-##', Value: Phone, Guide: true}" (mask)="Masked" /></span></Field>
<Field Label="Plate"><span class="elemenx-input"><input class="elemenx-input-control" *mask="{Mask: 'A ### AA', Value: Plate}" (mask)="Plated" /></span></Field>
<p class="elemenx-text small muted">Phone digits: {{Phone || '—'}} ({{Complete ? 'complete' : 'not complete'}}) · plate: {{Plate || '—'}}</p>
<script>
({
	Phone: '',
	Plate: '',
	Complete: false,

	Masked: function (event) {
		this.Phone = event.detail.Value;
		this.Complete = event.detail.Complete;
	},

	Plated: function (event) {
		this.Plate = event.detail.Value;
	}
})
</script>
```
