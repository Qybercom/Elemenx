<!-- generated -->
# Signatures

How much a signature looks like another, or like the samples of a person: a help for an interface (a hint that a signature is not the one on file, a second look for a person), not a check of security: a signature drawn in a browser can be copied, and a page can be made to say anything. A check that matters runs on a server, the same code in Node, against samples the client never sees.

A signature is its strokes, [[{X, Y, P, T}]] as SignaturePad gives them (P the pressure, T the milliseconds from the start of the signature; both may be missing). It is compared without its place and its size: centered, scaled, every stroke resampled into points evenly apart.

- Compare(a, b): {Score (0 to 1), Parts: {Shape (the paths, by dynamic time warping), Strokes (their number and lengths), Proportions (its width over its height, the directions it goes), Dynamics (its rhythm and its pressure: null without T)}}. b may be a reference of Enroll: a against each of its samples, the best of them.
- Enroll(samples): a reference of several signatures of one person ({Samples, Mean, Spread, Threshold}): how alike its samples are to each other gives the score a signature of the person should reach (Threshold, 0.5 to 0.85).
- Match(signature, reference, threshold): {Score, Parts, Match (Score >= threshold: the one given, the Threshold of a reference, or 0.75), Threshold}.
- Normalize(signature): the signature as it is compared ({Points: [{X, Y, S, P, T}] (S the number of its stroke), Strokes, Ratio, Length, Duration}), null without a point.

## Methods

- `Normalize(signature)`
- `Compare(a, b)`
- `Enroll(samples)`
- `Match(signature, reference, threshold)`

## Tests

- [scores a signature against another and against the samples of a person, its parts told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-signatures.test.js#L61) — `tests/regression/library-signatures.test.js`
- [compares what is drawn with its Reference after each stroke, tells compare and says whether it looks like it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-signatures.test.js#L87) — `tests/regression/library-signatures.test.js`
- [compares signatures and lays out items with the Services of ElemenxUI](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L25) — `tests/regression/headless.test.js`
