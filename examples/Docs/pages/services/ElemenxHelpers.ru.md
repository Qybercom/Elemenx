<!-- generated -->
# ElemenxHelpers

Помощники, общие для компонентов и сервисов ElemenxUI, чтобы каждый был написан один раз: текст тела без отступов его шаблона (BodyText), первый день недели (FirstDay) и список слушателей, в котором каждый отделён от других (Listeners: On, Off, Tell, Count, Clear; слушатель, бросивший ошибку, не останавливает остальных — ошибка уходит странице через reportError, как у слушателя событий DOM). Ими может пользоваться и приложение; его собственные сервисы сохраняют свои имена.

## Тесты

- [ElemenxHelpers: the text of a body without its indentation, the first day of a week, and listeners that throw apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L40) — `tests/regression/library-services.test.js`
