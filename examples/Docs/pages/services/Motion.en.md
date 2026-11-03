<!-- generated -->
# Motion

The motion of the device: its accelerometer and gyroscope (devicemotion) and its turn in space (deviceorientation).

- Supported(): whether the page can read them. Request(callback(error, state)): asks for them where the browser asks (iOS: only within a press of the user), else tells at once: granted, denied or unsupported.
- Start(), Stop(): listen to the device; On(name, callback), Off(callback): orientation ({Alpha, Beta, Gamma, Absolute}, degrees), motion ({Acceleration and Gravity [x, y, z] m/s² (without the gravity and with it, null where the device has none), Rotation {Alpha, Beta, Gamma} degrees a second, Interval ms}). State(): the last of them, {Orientation, Acceleration, Gravity, Rotation}.
- Tilt(): the lean of the device as a controller, the way the screen is turned taken into account (portrait or landscape): Steer (-1 to 1: turned as a wheel, right +), Pitch (-1 to 1: its top leaned away +, from where Center() was), X and Y (-1 to 1: a device held flat, its right and its top down +), Up (the up of the world in the frame of the screen); Range degrees make 1 (35), Dead degrees make 0 (2). Center() makes the lean of now the middle.

The same functions run where there is no device: they tell nothing moves.

## Methods

- `Supported()`
- `Request(callback)`
- `Start()`
- `Stop()`
- `State()`
- `Tilt()`
- `Center()`
- `On(name, callback)`
- `Off(callback)`

## Tests

- [Motion: the lean of a device as a wheel, its top away, and flat; the way the screen is turned; its middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L136) — `tests/regression/virtual-gamepad.test.js`
- [plays the only clip of a file by itself, and bakes one animation once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9462) — `tests/regression/library-scene.test.js`
