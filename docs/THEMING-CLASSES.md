# ElemenxUI classes

The classes of ElemenxUI are its public API for themes: a theme restyles a Component by its classes (see `THEMING.md`). This list names every `elemenx-*` class of the Library with the modifier classes it takes (`elemenx-button` with `primary` is `.elemenx-button.primary`), grouped by the stylesheet that defines it. `tests/regression/theming.test.js` checks it against the stylesheets: a class is not renamed or removed without a change here.

## Foundation (index.css)

- `elemenx-badge`: `accent`, `danger`, `info`, `success`, `warning`
- `elemenx-block`: `compact`, `spacious`
- `elemenx-calendar`
- `elemenx-calendar-cell`: `selected`, `today`
- `elemenx-calendar-day`: `end`, `outside`, `selected`, `start`, `today`, `within`
- `elemenx-calendar-days`
- `elemenx-calendar-grid`
- `elemenx-calendar-header`
- `elemenx-calendar-nav`
- `elemenx-calendar-title`
- `elemenx-calendar-weekday`
- `elemenx-callout`: `danger`, `neutral`, `success`, `warning`
- `elemenx-caption`
- `elemenx-card`: `compact`, `spacious`
- `elemenx-check`: `checked`, `chip`, `disabled`, `indeterminate`, `invalid`, `small`, `tile`
- `elemenx-check-box`
- `elemenx-check-input`
- `elemenx-check-label`
- `elemenx-check-text`
- `elemenx-chip`
- `elemenx-chip-label`
- `elemenx-chips`
- `elemenx-code`
- `elemenx-color-input`: `round`
- `elemenx-color-swatch`
- `elemenx-column`: `fill`, `fill-fixed`, `non-fill`
- `elemenx-container`: `block`, `centered`, `fill`, `fill-fixed`, `non-fill`, `wrappable`
- `elemenx-divider`: `vertical`
- `elemenx-drag-ghost`
- `elemenx-draggable`: `dragging`
- `elemenx-drop-marker`
- `elemenx-droppable`: `drop-over`, `drop-target`
- `elemenx-eyebrow`
- `elemenx-field-control`
- `elemenx-file-icon`
- `elemenx-footnote`
- `elemenx-footnote-mark`
- `elemenx-icon`: `colored`, `spin`
- `elemenx-input`: `disabled`, `giant`, `invalid`, `large`, `multiple`, `readonly`, `round`, `small`
- `elemenx-input-action`
- `elemenx-input-affix`
- `elemenx-input-control`: `concealed`
- `elemenx-kbd`
- `elemenx-label`: `required`
- `elemenx-layout-area`
- `elemenx-link`
- `elemenx-list`: `divided`
- `elemenx-number-input`: `round`
- `elemenx-ol`: `outline`
- `elemenx-option`: `active`, `danger`, `disabled`, `selected`
- `elemenx-option-check`
- `elemenx-option-hint`
- `elemenx-option-label`
- `elemenx-panel`: `compact`, `spacious`
- `elemenx-phone-country`
- `elemenx-phone-input`: `round`
- `elemenx-picker-empty`
- `elemenx-picker-footer`
- `elemenx-picker-head`
- `elemenx-picker-search`
- `elemenx-picker-tab`: `active`
- `elemenx-picker-tabs`
- `elemenx-popup`
- `elemenx-popup-empty`
- `elemenx-popup-group`
- `elemenx-popup-search`
- `elemenx-popup-separator`
- `elemenx-radio`: `checked`, `segment`, `small`
- `elemenx-radio-group`: `horizontal`, `segmented`, `small`, `tile`
- `elemenx-resizable`: `resizing`
- `elemenx-resize-handle`: `bottom`, `corner`, `left`, `right`, `top`
- `elemenx-screen`
- `elemenx-section`: `collapsed`
- `elemenx-section-header`
- `elemenx-select`
- `elemenx-select-trigger`: `multiple`, `open`, `small`
- `elemenx-select-value`: `placeholder`
- `elemenx-skeleton`: `circle`, `rect`, `text`
- `elemenx-skeleton-line`
- `elemenx-spacer`
- `elemenx-spinner`: `large`, `small`
- `elemenx-spinner-ring`
- `elemenx-subtitle`
- `elemenx-table`: `bordered`, `compact`, `selectable`, `sticky`, `striped`, `tree`
- `elemenx-text`: `danger`, `large`, `mono`, `muted`, `small`, `strong`, `success`, `warning`
- `elemenx-textarea`: `round`
- `elemenx-title`
- `elemenx-ul`: `check`
- `elemenx-visually-hidden`

## ButtonGroup

- `elemenx-button`: `block`, `danger`, `ghost`, `giant`, `icon-only`, `large`, `link`, `loading`, `pressed`, `primary`, `round`, `small`
- `elemenx-button-group`: `attached`, `vertical`

## Button

- `elemenx-button-label`

## Calendar

- `elemenx-cal`: `dragging`, `editable`
- `elemenx-cal-allday`: `drop`
- `elemenx-cal-block`: `dragged`, `short`
- `elemenx-cal-column`: `today`
- `elemenx-cal-date`
- `elemenx-cal-day`: `drop`, `outside`, `today`
- `elemenx-cal-event`: `dragged`, `whole`
- `elemenx-cal-header`
- `elemenx-cal-hour`
- `elemenx-cal-hours`
- `elemenx-cal-month`
- `elemenx-cal-more`
- `elemenx-cal-nav`
- `elemenx-cal-now`
- `elemenx-cal-resize`
- `elemenx-cal-shadow`
- `elemenx-cal-time`
- `elemenx-cal-title`
- `elemenx-cal-view`: `current`
- `elemenx-cal-views`
- `elemenx-cal-week`
- `elemenx-cal-week-allday`
- `elemenx-cal-week-body`
- `elemenx-cal-week-day`: `today`
- `elemenx-cal-week-head`
- `elemenx-cal-weekday`

## CardNumberInput

- `elemenx-card-brand`
- `elemenx-card-conceal`
- `elemenx-card-field`
- `elemenx-card-input`

## Centered

- `elemenx-centered`
- `elemenx-centered-actions`
- `elemenx-centered-box`: `card`, `large`, `small`
- `elemenx-centered-brand`
- `elemenx-centered-code`
- `elemenx-centered-description`
- `elemenx-centered-footer`
- `elemenx-centered-icon`
- `elemenx-centered-middle`
- `elemenx-centered-state`
- `elemenx-centered-title`

## Chart

- `elemenx-chart`: `donut`, `pie`, `stacked`
- `elemenx-chart-area`
- `elemenx-chart-band`
- `elemenx-chart-bar`: `dim`
- `elemenx-chart-data`
- `elemenx-chart-grid`
- `elemenx-chart-guide`
- `elemenx-chart-key`: `off`
- `elemenx-chart-label`
- `elemenx-chart-legend`
- `elemenx-chart-line`
- `elemenx-chart-plot`
- `elemenx-chart-point`
- `elemenx-chart-slice`: `dim`
- `elemenx-chart-swatch`
- `elemenx-chart-tick`
- `elemenx-chart-tip-row`
- `elemenx-chart-tip-rows`
- `elemenx-chart-tooltip`: `left`, `right`
- `elemenx-chart-total`

## ChatComposer

- `elemenx-chat-composer`
- `elemenx-chat-picker`

## ChatMessage

- `elemenx-chat-author`
- `elemenx-chat-avatar`
- `elemenx-chat-body`
- `elemenx-chat-bubble`: `sticker`
- `elemenx-chat-message`: `first`, `last`, `middle`, `own`, `single`
- `elemenx-chat-meta`
- `elemenx-chat-react`
- `elemenx-chat-react-picker`
- `elemenx-chat-reaction`: `mine`
- `elemenx-chat-reaction-emoji`
- `elemenx-chat-reactions`
- `elemenx-chat-sticker`
- `elemenx-chat-text`

## Chat

- `elemenx-chat`
- `elemenx-chat-composer-area`
- `elemenx-chat-conversation`: `active`
- `elemenx-chat-divider`
- `elemenx-chat-header`
- `elemenx-chat-jump`
- `elemenx-chat-main`
- `elemenx-chat-messages`
- `elemenx-chat-sidebar`

## ColorInput

- `elemenx-color`
- `elemenx-color-area`
- `elemenx-color-popup`
- `elemenx-color-preset`: `selected`
- `elemenx-color-slider`: `alpha`, `hue`
- `elemenx-color-swatches`
- `elemenx-color-thumb`
- `elemenx-color-value`

## Combobox

- `elemenx-combobox`
- `elemenx-combobox-create`

## CommandPalette

- `elemenx-palette`
- `elemenx-palette-list`
- `elemenx-palette-search`

## ContextMenu

- `elemenx-context`
- `elemenx-context-point`
- `elemenx-menu`

## DashboardWidget

- `elemenx-dashboard-widget`: `rows-2`, `rows-3`, `span-2`, `span-3`, `span-4`
- `elemenx-dashboard-widget-actions`
- `elemenx-dashboard-widget-body`
- `elemenx-dashboard-widget-footer`
- `elemenx-dashboard-widget-header`: `bare`
- `elemenx-dashboard-widget-heading`
- `elemenx-dashboard-widget-title`

## Dashboard

- `elemenx-dashboard`
- `elemenx-dashboard-content`
- `elemenx-dashboard-footer`
- `elemenx-dashboard-grid`
- `elemenx-dashboard-header`
- `elemenx-dashboard-main`
- `elemenx-dashboard-nav`
- `elemenx-dashboard-wide`
- `elemenx-nav`: `collapsed`

## DateInput

- `elemenx-date`

## DateRangeInput

- `elemenx-range`
- `elemenx-range-month`
- `elemenx-range-months`
- `elemenx-range-panel`
- `elemenx-range-presets`
- `elemenx-range-text`: `placeholder`
- `elemenx-range-toggle`

## Dialog

- `elemenx-dialog`: `full`, `large`, `small`
- `elemenx-dialog-body`: `padded`
- `elemenx-dialog-footer`
- `elemenx-dialog-header`
- `elemenx-dialog-heading`
- `elemenx-dialog-title`

## Drawer

- `elemenx-drawer`: `bottom`, `full`, `large`, `left`, `medium`, `right`, `small`, `top`
- `elemenx-drawer-actions`
- `elemenx-drawer-body`: `padded`
- `elemenx-drawer-footer`
- `elemenx-drawer-header`
- `elemenx-drawer-heading`
- `elemenx-drawer-title`

## EmojiPicker

- `elemenx-emoji`
- `elemenx-emoji-body`
- `elemenx-emoji-grid`
- `elemenx-emoji-group`
- `elemenx-emoji-item`: `selected`
- `elemenx-emoji-preview`
- `elemenx-emoji-preview-char`
- `elemenx-emoji-preview-name`
- `elemenx-emoji-title`
- `elemenx-emoji-tone`
- `elemenx-emoji-tones`

## EmptyState

- `elemenx-empty`: `error`, `search`, `small`
- `elemenx-empty-actions`
- `elemenx-empty-description`
- `elemenx-empty-icon`
- `elemenx-empty-title`

## ExpressionPicker

- `elemenx-expressions`
- `elemenx-expressions-kinds`
- `elemenx-stickers`

## Field

- `elemenx-field`: `disabled`, `horizontal`
- `elemenx-field-body`
- `elemenx-field-error`
- `elemenx-field-label`

## FileUpload

- `elemenx-upload`: `avatar`, `disabled`, `dragging`, `inline`, `invalid`
- `elemenx-upload-avatar`
- `elemenx-upload-avatar-edit`
- `elemenx-upload-bar`
- `elemenx-upload-errors`
- `elemenx-upload-gallery`
- `elemenx-upload-item`
- `elemenx-upload-list`
- `elemenx-upload-name`
- `elemenx-upload-thumb`
- `elemenx-upload-tile`
- `elemenx-upload-tile-remove`
- `elemenx-upload-title`
- `elemenx-upload-zone`

## MasterDetail

- `elemenx-detail`
- `elemenx-detail-back`
- `elemenx-detail-content`
- `elemenx-detail-empty`
- `elemenx-detail-header`
- `elemenx-detail-title`
- `elemenx-master`
- `elemenx-master-detail`
- `elemenx-master-detail-frame`
- `elemenx-master-header`
- `elemenx-master-list`
- `elemenx-master-row`: `active`

## MenuList

- `elemenx-menu-icon`

## Menu

- `elemenx-menu-root`

## Meter

- `elemenx-meter`: `danger`, `large`, `small`, `warning`
- `elemenx-meter-fill`
- `elemenx-meter-head`
- `elemenx-meter-label`
- `elemenx-meter-mark`
- `elemenx-meter-track`
- `elemenx-meter-value`

## MoneyInput

- `elemenx-money`
- `elemenx-money-input`

## NavList

- `elemenx-nav-label`
- `elemenx-nav-row`: `active`, `disabled`
- `elemenx-nav-rows`
- `elemenx-nav-search`
- `elemenx-nav-twisty`

## NumberInput

- `elemenx-number-controls`
- `elemenx-number-step`

## OTPInput

- `elemenx-otp`: `disabled`, `invalid`, `large`, `round`, `single`, `small`, `split`
- `elemenx-otp-cell`: `active`, `empty`, `selected`
- `elemenx-otp-cells`
- `elemenx-otp-control`
- `elemenx-otp-field`
- `elemenx-otp-separator`

## Pagination

- `elemenx-pagination`
- `elemenx-pagination-gap`
- `elemenx-pagination-page`: `current`
- `elemenx-pagination-pages`
- `elemenx-pagination-size`

## PhoneInput

- `elemenx-phone`
- `elemenx-phone-code`

## Popover

- `elemenx-popover`
- `elemenx-popover-root`
- `elemenx-popover-title`
- `elemenx-popover-trigger`

## Progress

- `elemenx-progress`: `danger`, `indeterminate`, `large`, `ring`, `small`, `success`, `warning`
- `elemenx-progress-fill`
- `elemenx-progress-label`
- `elemenx-progress-ring`
- `elemenx-progress-ring-fill`
- `elemenx-progress-ring-track`
- `elemenx-progress-track`
- `elemenx-progress-value`

## Rating

- `elemenx-rating`: `disabled`, `readonly`
- `elemenx-rating-fill`
- `elemenx-rating-star`: `preview`

## Ribbon

- `elemenx-ribbon`: `collapsed`, `floating`, `narrow`
- `elemenx-ribbon-backstage`: `open`
- `elemenx-ribbon-backstage-back`
- `elemenx-ribbon-backstage-content`
- `elemenx-ribbon-backstage-host`
- `elemenx-ribbon-backstage-item`: `active`, `command`
- `elemenx-ribbon-backstage-nav`
- `elemenx-ribbon-bar`
- `elemenx-ribbon-button`: `pressed`
- `elemenx-ribbon-end`
- `elemenx-ribbon-file`
- `elemenx-ribbon-gallery`
- `elemenx-ribbon-gallery-item`: `selected`
- `elemenx-ribbon-gallery-items`
- `elemenx-ribbon-gallery-label`
- `elemenx-ribbon-gallery-more`
- `elemenx-ribbon-gallery-popup`
- `elemenx-ribbon-gallery-preview`
- `elemenx-ribbon-gallery-scroll`
- `elemenx-ribbon-gallery-step`
- `elemenx-ribbon-group`: `collapsed`, `compact`, `icons`, `open`
- `elemenx-ribbon-group-body`
- `elemenx-ribbon-group-footer`
- `elemenx-ribbon-group-popup`
- `elemenx-ribbon-group-title`
- `elemenx-ribbon-group-toggle`
- `elemenx-ribbon-item`: `icon`, `large`, `split`
- `elemenx-ribbon-keytip`: `dim`
- `elemenx-ribbon-keytips`
- `elemenx-ribbon-label`
- `elemenx-ribbon-launcher`
- `elemenx-ribbon-page`: `active`
- `elemenx-ribbon-page-title`
- `elemenx-ribbon-panel`: `active`, `overflowing`
- `elemenx-ribbon-panels`
- `elemenx-ribbon-pin`
- `elemenx-ribbon-quick`
- `elemenx-ribbon-row`
- `elemenx-ribbon-split`
- `elemenx-ribbon-tab`: `active`, `contextual`, `disabled`
- `elemenx-ribbon-tabs`

## Section

- `elemenx-section-actions`
- `elemenx-section-aside`
- `elemenx-section-body`
- `elemenx-section-heading`
- `elemenx-section-note`
- `elemenx-section-slot`
- `elemenx-section-static`
- `elemenx-section-title`: `level-1`, `level-2`, `level-3`, `level-4`
- `elemenx-section-toggle`

## Settings

- `elemenx-settings`
- `elemenx-settings-actions`
- `elemenx-settings-body`
- `elemenx-settings-content`
- `elemenx-settings-crumb`
- `elemenx-settings-footer`
- `elemenx-settings-header`
- `elemenx-settings-heading`
- `elemenx-settings-nav`
- `elemenx-settings-page`
- `elemenx-settings-path`
- `elemenx-settings-title`

## Slider

- `elemenx-slider`: `disabled`, `large`, `small`
- `elemenx-slider-fill`
- `elemenx-slider-thumb`: `active`
- `elemenx-slider-tick`
- `elemenx-slider-track`
- `elemenx-slider-value`

## Sparkline

- `elemenx-sparkline`
- `elemenx-sparkline-area`
- `elemenx-sparkline-bar`
- `elemenx-sparkline-dot`
- `elemenx-sparkline-line`

## Splitter

- `elemenx-splitter`: `horizontal`, `vertical`
- `elemenx-splitter-pane`: `first`, `second`

## Steps

- `elemenx-step`: `active`, `disabled`, `done`, `error`, `pending`
- `elemenx-step-content`
- `elemenx-step-label`
- `elemenx-step-node`
- `elemenx-step-text`
- `elemenx-steps`: `clickable`, `horizontal`, `large`, `small`, `vertical`

## StickerPicker

- `elemenx-sticker`
- `elemenx-sticker-pick`
- `elemenx-sticker-star`: `on`
- `elemenx-stickers-body`
- `elemenx-stickers-grid`
- `elemenx-stickers-tab-image`

## Table

- `elemenx-table-box`
- `elemenx-table-check`
- `elemenx-table-empty`
- `elemenx-table-filter-select`
- `elemenx-table-filters`
- `elemenx-table-sort`
- `elemenx-table-tree`
- `elemenx-table-twisty`
- `elemenx-table-wrap`: `scrolling`

## Tabs

- `elemenx-tab`: `active`, `disabled`
- `elemenx-tab-close`
- `elemenx-tabs`: `editor`, `large`, `line`, `pill`, `small`
- `elemenx-tabs-extra`
- `elemenx-tabs-list`

## TagInput

- `elemenx-tags`
- `elemenx-tags-control`
- `elemenx-tags-field`: `large`, `small`

## Terminal

- `elemenx-terminal`
- `elemenx-terminal-actions`
- `elemenx-terminal-command`
- `elemenx-terminal-header`
- `elemenx-terminal-input`
- `elemenx-terminal-line`: `error`, `info`, `input`, `output`, `success`
- `elemenx-terminal-output`
- `elemenx-terminal-prompt`
- `elemenx-terminal-title`

## TextArea

- `elemenx-textarea-counter`

## TileGrid

- `elemenx-tile`: `dragging`, `large`, `locked`, `medium`, `small`, `wide`
- `elemenx-tile-badge`
- `elemenx-tile-cells`
- `elemenx-tile-content`
- `elemenx-tile-gap`: `drop-over`, `drop-target`
- `elemenx-tile-grid`: `drop-over`, `drop-target`, `editable`, `sorting`
- `elemenx-tile-group`: `drop-over`, `drop-target`, `growing`, `new`
- `elemenx-tile-group-action`
- `elemenx-tile-group-actions`
- `elemenx-tile-group-header`
- `elemenx-tile-group-resize`
- `elemenx-tile-group-title`
- `elemenx-tile-lane`
- `elemenx-tile-new`
- `elemenx-tile-source-content`
- `elemenx-tile-text`
- `elemenx-tile-title`

## TimeInput

- `elemenx-time`
- `elemenx-time-column`
- `elemenx-time-columns`
- `elemenx-time-popup`

## Timeline

- `elemenx-timeline`: `compact`
- `elemenx-timeline-body`
- `elemenx-timeline-content`
- `elemenx-timeline-head`
- `elemenx-timeline-item`: `accent`, `danger`, `dot`, `info`, `small`, `success`, `warning`
- `elemenx-timeline-node`

## ToastHost

- `elemenx-toast`: `danger`, `success`, `warning`
- `elemenx-toast-action`: `primary`
- `elemenx-toast-actions`
- `elemenx-toast-custom`
- `elemenx-toast-host`: `bottom`, `bottom-left`, `bottom-right`, `top`, `top-left`, `top-right`
- `elemenx-toast-text`
- `elemenx-toast-timer`

## Toggle

- `elemenx-toggle`: `checked`, `disabled`, `small`
- `elemenx-toggle-thumb`
- `elemenx-toggle-track`

## Tour

- `elemenx-tour`
- `elemenx-tour-block`
- `elemenx-tour-card`
- `elemenx-tour-footer`
- `elemenx-tour-hole`
- `elemenx-tour-layer`
- `elemenx-tour-shade`
- `elemenx-tour-text`
- `elemenx-tour-title`

## Tree

- `elemenx-tree`
- `elemenx-tree-label`
- `elemenx-tree-row`: `active`, `disabled`
- `elemenx-tree-rows`
- `elemenx-tree-twisty`

## VirtualList

- `elemenx-virtual`
- `elemenx-virtual-content`
- `elemenx-virtual-label`
- `elemenx-virtual-row`: `active`, `selected`
- `elemenx-virtual-space`
- `elemenx-virtual-viewport`

## WorkspaceToolWindow

- `elemenx-workspace-tool-window`
- `elemenx-workspace-tool-window-actions`
- `elemenx-workspace-tool-window-body`: `padded`
- `elemenx-workspace-tool-window-header`
- `elemenx-workspace-tool-window-title`

## WorkspaceToolbar

- `elemenx-workspace-toolbar`

## Workspace

- `elemenx-workspace`: `ribbon`
- `elemenx-workspace-band`: `bottom`, `top`
- `elemenx-workspace-body`
- `elemenx-workspace-center`
- `elemenx-workspace-header`
- `elemenx-workspace-main`
- `elemenx-workspace-panel`: `bottom`, `left`, `right`
- `elemenx-workspace-ribbon`
- `elemenx-workspace-status`
- `elemenx-workspace-stripe`: `left`, `right`
