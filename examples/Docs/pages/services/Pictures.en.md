<!-- generated -->
# Pictures

Pictures drawn by the page. Raster(svg, width, height, callback): an SVG drawn into a PNG of width by height pixels, callback(error, data URL); a picture in it from another place (the Logo of a QR code) is read first and put in as data, as an SVG drawn as a picture loads nothing. QRCode, Barcode and Diagram save their pictures through it.

## Methods

- `Raster(svg, width, height, callback)`

## Tests

- [Pictures draws an SVG into a PNG of a size, and tells when the SVG is no picture](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L76) — `tests/regression/library-codes.test.js`
- [ribbon shrinks its groups to fit, folds them into buttons and collapses to its tabs](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L650) — `tests/examples/ui-kit.spec.js`
