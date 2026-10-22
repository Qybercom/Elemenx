<!-- generated -->
# *mask

*mask="{Mask: Mask, Value: Value}" keeps an <input> strictly inside a mask. Slots: # digit, A Latin letter, * digit or letter; every other mask character is a literal. Value holds only the slot characters. After every input (typing, paste, drop, autofill) the text is rebuilt from the accepted characters, so nothing outside the mask survives. The element then dispatches a "mask" DOM event whose detail is {Value, Text, Complete}; a listener may rewrite detail.Value.

Guide: a character ('_', or true for '_') shown in the empty slots while the field is focused or filled, so the whole template stays in place and a deleted character is visible. Backspace: 'delete' (default) deletes the character before a literal under the caret; 'skip' only moves the caret over the literal.

## Example

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
