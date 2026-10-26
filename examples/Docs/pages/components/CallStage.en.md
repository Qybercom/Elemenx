<!-- generated -->
# CallStage

The stage of a call: where its videos are and its bars. Slots: main (the video in front: the speaker, a screen shared), participants (their CallTiles), self (the own video, in a corner over the stage; it can be dragged to another corner), controls (a CallControls), side (a panel: the chat, the people; shown with Side), status (the time, the recording). Layout: grid (the participants in a grid of as many columns as they need, main in it when it has content), speaker (main large, the participants in a strip under it), screen (main large, the participants in a column beside it). The grid pages the participants past PerPage (the page with Page, the buttons by its side).

## Properties

| Property | Default |
| --- | --- |
| `Layout` | `'grid'` |
| `Side` | `false` |
| `PerPage` | `0` |
| `Page` | `0` |

## Events

`page`, `corner`

## Slots

`status`, `main`, `participants`, `self`, `side`, `controls`
