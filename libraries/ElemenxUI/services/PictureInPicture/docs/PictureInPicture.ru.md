Картинка в картинке: видео или любая часть страницы в маленьком отдельном окне, которое остаётся поверх других окон системы.

- Supported(kind): есть ли это в браузере для kind 'video' (Chrome, Edge, Safari, Firefox со своей кнопкой) или 'document' (любой элемент: Chrome и Edge).
- Video(video, callback): видео в своё окно или обратно, если оно уже там; callback(error, {Active}).
- Document(element, {Width, Height, Title}, callback): элемент переходит в своё окно со стилями, темой и направлением письма страницы; рамка на его месте говорит, где он, и возвращает его. Он возвращается, когда окно закрывается. callback(error, {Window}).
- Close(callback): видео или элемент обратно на страницу. Active(): {Kind, Element} или null.
- OnChange(callback) / OffChange(callback): callback(Active()), когда что-то уходит в окно или возвращается.

Браузер разрешает открыть окно только после нажатия или клавиши пользователя.
