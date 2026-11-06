<!-- generated -->
# SceneScreens

SceneScreens: the screens of a scene, each an object of kind screen (the trait Screen): a pane of Width by Height metres (Yaw, Pitch in degrees, Lift over the ground or Z, as a mirror stands) that shows a picture, Bright (1) as bright as it glows. What it shows is the first of its sources given:

- Camera: the ID of a camera of the scene (SceneCamera): what it sees, drawn as the mirrors are, the nearest screens of cameras first (none at low, one at medium, two at high, four at ultra), each made again every Every frames (2), its picture Pixels [width, height] (by its pane, 512 wide);
- Image: the URL of a picture;
- Video: the URL of a video, played muted, round and round;
- Canvas: a canvas of the page (a selector, or the name of a data-screen of the slot screens) as it is drawn, every Every seconds (0: each frame);
- Element: an element of the page (a selector, or a data-screen of the slot screens, laid out out of sight) as a picture, drawn again when it changes, every Every seconds at most (0.15), Pixels [width, height] (its own size). With Interactive (true) the pointer works on it as on the element: a press, a move, a release and a click go to what lies under the pointer in it, the wheel scrolls it, a field pressed takes the keys. What :hover would show of it does not show.

ScreenAt(clientX, clientY) tells the screen under a point of the page: {ID, U, V (0 to 1, from its left and its top)} or null.

## Methods

- `ScreenAt(clientX, clientY)`
