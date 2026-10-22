<!-- generated -->
# Reveal

Показ того, что скрывает поле: пароля (Input), номера карты (CardNumberInput), кода безопасности (CVVInput) или одноразового кода (OTPInput). Их кнопки-глаза вызывают Toggle(field, kind). Скрытие ничего не требует; показ Guarded-поля сначала спрашивает: поле отправляет reveal с запросом {Kind ('password', 'card', 'cvv' или 'code'), Element (корень поля), Allow(), Deny()}, и тот же запрос получает охранник страницы, заданный через Guard(callback), — как банковское приложение, которое просит отпечаток пальца, прежде чем показать номер карты. Глаз крутится до Allow или Deny; ответ, пришедший после того, как поле снова скрыли или уничтожили, ничего не значит. HideAfter (миллисекунды) у поля само снова скрывает его. Guard(null) убирает охранника.

## Методы

- `Guard(callback)`
- `Toggle(field, kind)`

## Пример

```example
<Field Label="Password" Hint="Guarded: the eye asks before it shows; it hides again after 5 seconds"><Input Type="password" Value="correct horse battery" Guarded="true" HideAfter="5000" /></Field>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',

	$OnCreate: function () {
		var self = this;
		var dialogs = this.$Service('Dialogs');

		this.Guard = function (request) {
			dialogs.Confirm({Title: 'Show the ' + request.Kind + '?', Message: 'A bank would ask for a fingerprint here.'}, function (action) {
				if (action === 'ok') request.Allow();
				else request.Deny();

				self.Note = action === 'ok' ? 'Allowed' : 'Denied';
			});
		};

		this.$Service('Reveal').Guard(this.Guard);
	},

	$OnDestroy: function () {
		this.$Service('Reveal').Guard(null);
	}
})
</script>
```
