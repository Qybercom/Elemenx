<!-- generated -->
# PictureInPicture

Picture-in-Picture: a video, or any part of the page, in a small window of its own that stays over the other windows of the system.

- Supported(kind): whether the browser has it, for kind 'video' (Chrome, Edge, Safari, Firefox with its own button) or 'document' (any element: Chrome and Edge).
- Video(video, callback): the video in its window, or back when it is there already; callback(error, {Active}).
- Document(element, {Width, Height, Title}, callback): the element moves into a window of its own, with the styles, the theme and the direction of the page; a frame in its place tells where it is and brings it back. It comes back when the window closes. callback(error, {Window}).
- Close(callback): the video or the element back in the page. Active(): {Kind, Element} or null.
- OnChange(callback) / OffChange(callback): callback(Active()) when something goes into a window or comes back.

The browser lets a window open only after a press or a key of the user.

## Methods

- `Supported(kind)`
- `Active()`
- `OnChange(callback)`
- `OffChange(callback)`
- `Video(video, callback)`
- `Document(element, options, callback)`
- `Close(callback)`

## Example

```example
<div class="elemenx-card docs-pip" style="padding: 12px;">
	<strong>A timer in its own window</strong>
	<p class="elemenx-title">{{Seconds}} s</p>
</div>
<Button Label="Pop it out" Icon="pip" [disabled]="!Supported" (click)="Pop" />
<span class="elemenx-text small muted">{{Supported ? 'Document Picture-in-Picture is here.' : 'This browser has no Document Picture-in-Picture (Chrome and Edge do).'}}</span>
<script>
({
	Seconds: 0,
	Supported: false,

	$OnCreate: function () {
		var self = this;

		this.Supported = this.$Service('PictureInPicture').Supported('document');
		this.Timer = setInterval(function () {
			self.Seconds++;
		}, 1000);
	},

	Pop: function () {
		this.$Service('PictureInPicture').Document(this.$Element().querySelector('.docs-pip'), {Width: 260, Height: 140, Title: 'Timer'}, function () {});
	},

	$OnDestroy: function () {
		clearInterval(this.Timer);
		this.$Service('PictureInPicture').Close(function () {});
	}
})
</script>
```
