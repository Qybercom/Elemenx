# Оборудование

`Elemenx.Hardware` даёт доступ через браузер к устройствам, подключённым к компьютеру: последовательным портам (`Serial`, Web Serial), USB-устройствам со своим драйвером (`USB`, WebUSB) и flash-памяти платы (`Firmware`). Каждый метод принимает колбэк `(error, result)`; `error.name` — имя ошибки браузера: `NotFoundError`, если пользователь ничего не выбрал, `NotSupportedError`, если у браузера нет доступа к устройству (Web Serial и WebUSB есть в Chrome и Edge на компьютере, по HTTPS или на localhost).

У компонента, сервиса и приложения есть свой `$Hardware`, такой же, как `Elemenx.Hardware`: то, что он открыл, закрывается, то, что он прошивает, отменяется, а его слушатели забываются, когда он уничтожается, — как `$Network` поступает со своими запросами.

## Последовательные порты

@block 1

| Член | Значение |
| --- | --- |
| `Supported()` | есть ли в браузере Web Serial |
| `Request({Filters: [{VendorID, ProductID}]}, callback)` | пользователь выбирает порт; результат — порт |
| `Ports(callback)` | порты, которые пользователь уже разрешил |
| `On(name, callback)`, `Off(name, callback)` | `connect` и `disconnect`: порт появился или исчез (`{Port}`) |

У порта есть `Info` (`{VendorID, ProductID}`), `Open({BaudRate, DataBits, StopBits, Parity, FlowControl, Text}, callback)` (начинает чтение: событие `data` несёт пришедшее — текст при `Text: true`, по умолчанию, или `Uint8Array`, а `line` — каждую строку текста), `Write(data, callback)` (текст или байты), `Signals({DTR, RTS, Break}, callback)`, `Close(callback)`, `On` и `Off` для `data`, `line`, `error` и `close`, `Opened()` и `Native` (порт браузера). На каждый порт один объект, кто бы его ни запросил.

## USB-устройства

| Член | Значение |
| --- | --- |
| `Supported()` | есть ли в браузере WebUSB |
| `Request({Filters: [{VendorID, ProductID, ClassCode}]}, callback)` | пользователь выбирает устройство |
| `Devices(callback)` | устройства, которые пользователь уже разрешил |
| `On(name, callback)`, `Off(name, callback)` | `connect` и `disconnect` (`{Device}`) |

У устройства есть `Info` (`{VendorID, ProductID, Name, Manufacturer, Serial}`), `Open({Configuration, Interface}, callback)` (открывает его и захватывает интерфейс), `TransferIn(endpoint, length, callback)`, `TransferOut(endpoint, data, callback)`, `Control({Type, Recipient, Request, Value, Index}, data или length, callback)`, `Close(callback)`, `Opened()` и `Native`. Клавиатуры, диски и другие устройства, которые держит система, недоступны.

## Прошивка

`Firmware` записывает программы во flash-память платы по протоколам. `esp` говорит с загрузчиком в ПЗУ семейства ESP32 (ESP32, ESP32-S3, ESP32-C3): переводит плату в загрузчик через DTR и RTS (классическая схема или USB-JTAG-Serial у S3 и C3), определяет чип, повышает скорость, стирает и пишет каждую часть блоками по 1 КБ, проверяет её по MD5 и перезапускает плату. Своей программы-заглушки он сначала не отправляет, поэтому ничего не сжимается: мегабайт пишется около 30 секунд на 460800 бод.

@block 2

| Член | Значение |
| --- | --- |
| `Flash(port, parts, options, callback)` | пишет `[{Offset, Bytes}]`; параметры `Protocol` (`esp`), `Baud` (460800), `Erase` (сначала стереть всю память), `Verify` (`false`: не проверять MD5), `Reset` (`false`: оставить плату в загрузчике), `Flash` (`{Size, Mode, Frequency}`: так выставить заголовок загрузчика), `Partitions` (таблица, по которой проверяются части), `Progress`; возвращает `{Cancel()}` |
| `Detect(port, options, callback)` | чип: `{Chip, Family, Bootloader}` |
| `Read(port, offset, length, options, callback)` | байты её памяти (медленно: таблица разделов и тому подобное) |
| `Parts(files, chip)` | сборка arduino-cli (`[{Name, Bytes}]`) по своим адресам; объединённый образ — с 0 |
| `Manifest(manifest, chip, read, callback)` | части манифеста ESP Web Tools, каждая читается через `read(path, callback)` |
| `Patch(image, {Chip, Mode, Frequency, Size})` | образ загрузчика, выставленный под память, его SHA-256 пересчитан |
| `Digest(bytes, kind)` | MD5 (`md5`) или SHA-256 (`sha256`) |
| `Define(name, protocol)`, `Names()`, `Chips()` | протоколы (`{Flash, Detect, Read}`) и чипы, которые они знают |

До того как тронуть плату, `Flash` проверяет части: перекрытие, выход за память, программа длиннее своего раздела — это `DataError`. Загрузчик, который не отвечает, — `TimeoutError` (зажмите BOOT, нажмите RESET и попробуйте снова).

## Разметка памяти

Память ESP32 размечает таблица разделов по адресу 0x8000: программа (и её слоты обновлений), настройки (nvs), место под файлы (SPIFFS, LittleFS) и остальное. `Firmware.Partitions` читает, создаёт и проверяет её:

@block 3

`Parse(bytes или текст CSV)` даёт `[{Name, Type, SubType, Offset, Size, Flags}]` (`partitions.bin`, память, прочитанная с 0x8000, или CSV в формате ESP-IDF, где пропущенный адрес идёт следом за предыдущим разделом), `Make(list)` — её байты с MD5, `CSV(list)` — её текст, `Check(list, flashBytes)` — что в ней не так (`[{Partition, Text}]`), `Preset(name)` и `Presets()` — таблицы Arduino (`default`, `huge_app`, `min_spiffs`, `no_ota`). Страница `/hardware` примера Advanced показывает всё это: файлы, карту, прошивку и монитор порта.
