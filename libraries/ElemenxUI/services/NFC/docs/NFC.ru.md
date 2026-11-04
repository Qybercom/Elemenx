Метки NFC через Web NFC: Chrome на Android, HTTPS. Каждый метод принимает callback(error, result); error.name — имя ошибки браузера ('NotAllowedError', когда пользователь отказал, 'NotSupportedError' без Web NFC).

- Supported().
- Scan(callback): читает метки, поднесённые к устройству, до Stop(); callback(error, tag) для каждой, tag {Serial, Records: [{Type, Text, URL, Data (Uint8Array), MediaType, ID, Language}]} (Text для текста, URL для ссылки). Stop() завершает чтение.
- Write(message, options, callback): записывает поднесённую метку. message: текст, {URL}, {Text, Language} или {Records: [{Type, Text, URL, Data, MediaType, ID}]}; options: {Overwrite (true)}.
- Lock(callback): навсегда делает поднесённую метку только для чтения.
