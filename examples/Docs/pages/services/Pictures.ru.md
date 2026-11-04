<!-- generated -->
# Pictures

Картинки, которые рисует страница. Raster(svg, width, height, callback) — SVG, нарисованный в PNG шириной width и высотой height пикселей, callback(error, data URL); картинку с другого адреса (Logo QR-кода) он сначала читает и вставляет данными, потому что SVG, нарисованный как картинка, ничего не загружает. QRCode, Barcode и Diagram сохраняют свои картинки через него.

## Методы

- `Raster(svg, width, height, callback)`

## Тесты

- [Pictures draws an SVG into a PNG of a size, and tells when the SVG is no picture](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L76) — `tests/regression/library-codes.test.js`
- [ribbon shrinks its groups to fit, folds them into buttons and collapses to its tabs](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L650) — `tests/examples/ui-kit.spec.js`
