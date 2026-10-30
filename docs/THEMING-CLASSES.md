# ElemenxUI classes

The classes of ElemenxUI are its public API for themes: a theme restyles a Component by its classes (see `THEMING.md`). This list names every `elemenx-*` class of the Library with the modifier classes it takes (`elemenx-button` with `primary` is `.elemenx-button.primary`), grouped by the stylesheet that defines it. `tests/regression/theming.test.js` checks it against the stylesheets: a class is not renamed or removed without a change here.

## Foundation (index.css)

- `elemenx-badge`: `accent`, `busy`, `danger`, `dot`, `info`, `overlay`, `success`, `warning`
- `elemenx-badged`
- `elemenx-block`: `compact`, `framed`, `spacious`, `trapezoid`
- `elemenx-blur`
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
- `elemenx-callout-title`
- `elemenx-caption`
- `elemenx-card`: `compact`, `elevated`, `filled`, `flat`, `horizontal`, `linked`, `spacious`, `structured`
- `elemenx-card-action`: `on`, `repost`
- `elemenx-card-body`
- `elemenx-card-content`
- `elemenx-card-date`
- `elemenx-card-footer`
- `elemenx-card-header`
- `elemenx-card-link`
- `elemenx-card-media`
- `elemenx-card-meta`
- `elemenx-card-text`
- `elemenx-card-title`
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
- `elemenx-container`: `block`, `centered`, `fill`, `fill-fixed`, `grid`, `non-fill`, `wrappable`
- `elemenx-ellipsis`
- `elemenx-bare`
- `elemenx-focus-ring`
- `elemenx-divider`: `vertical`
- `elemenx-drag-ghost`
- `elemenx-document`
- `elemenx-draggable`: `dragging`, `held`, `hold`
- `elemenx-drop-marker`
- `elemenx-droppable`: `drop-over`, `drop-target`
- `elemenx-eyebrow`
- `elemenx-field-control`
- `elemenx-file-icon`
- `elemenx-footnote`
- `elemenx-footnote-mark`
- `elemenx-game-bad`
- `elemenx-game-good`
- `elemenx-game-hotbar`
- `elemenx-game-panel`: `light`
- `elemenx-game-section`
- `elemenx-game-section-title`
- `elemenx-game-separator`
- `elemenx-game-special`
- `elemenx-native-drag`
- `elemenx-native-menu`
- `elemenx-native-menu-bar`
- `elemenx-native-menu-panel`
- `elemenx-native-nodrag`
- `elemenx-native-window`: `transparent`
- `elemenx-game-stats`: `double`
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
- `elemenx-option`: `active`, `contextual`, `danger`, `disabled`, `selected`
- `elemenx-option-check`
- `elemenx-option-hint`
- `elemenx-option-label`
- `elemenx-panel`: `compact`, `spacious`
- `elemenx-person`
- `elemenx-person-avatar`
- `elemenx-person-name`
- `elemenx-person-text`
- `elemenx-phone-country`
- `elemenx-phone-input`: `round`
- `elemenx-picker-empty`
- `elemenx-picker-footer`
- `elemenx-picker-head`
- `elemenx-picker-search`
- `elemenx-picker-tab`: `active`
- `elemenx-picker-tabs`
- `elemenx-modal-shade`
- `elemenx-pip-back`
- `elemenx-pip-body`
- `elemenx-pip-placeholder`
- `elemenx-popup`
- `elemenx-layer`
- `elemenx-popup-empty`
- `elemenx-popup-group`
- `elemenx-popup-search`
- `elemenx-popup-separator`
- `elemenx-radio`: `checked`, `segment`, `small`
- `elemenx-radio-group`: `horizontal`, `segmented`, `small`, `tile`
- `elemenx-resizable`: `resizing`
- `elemenx-resize-handle`: `bottom`, `corner`, `left`, `right`, `top`
- `elemenx-rich-plugin`: `editing`, `error`
- `elemenx-rich-plugin-editor`
- `elemenx-screen`: `fill`, `fill-fixed`, `non-fill`
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
- `elemenx-syntax-attribute`
- `elemenx-syntax-code`
- `elemenx-syntax-comment`
- `elemenx-syntax-emphasis`
- `elemenx-syntax-function`
- `elemenx-syntax-heading`
- `elemenx-syntax-keyword`
- `elemenx-syntax-link`
- `elemenx-syntax-literal`
- `elemenx-syntax-meta`
- `elemenx-syntax-number`
- `elemenx-syntax-operator`
- `elemenx-syntax-property`
- `elemenx-syntax-punctuation`
- `elemenx-syntax-regex`
- `elemenx-syntax-selector`
- `elemenx-syntax-string`
- `elemenx-syntax-strong`
- `elemenx-syntax-tag`
- `elemenx-syntax-type`
- `elemenx-syntax-variable`
- `elemenx-table`: `bordered`, `compact`, `selectable`, `sticky`, `striped`, `tree`
- `elemenx-text`: `danger`, `large`, `mono`, `muted`, `small`, `strong`, `success`, `warning`
- `elemenx-textarea`: `round`
- `elemenx-tip`: `rich`
- `elemenx-tip-text`
- `elemenx-tip-title`
- `elemenx-title`
- `elemenx-ul`: `check`
- `elemenx-visually-hidden`
- `elemenx-game-inventory-card`: `common`, `epic`, `legendary`, `rare`, `uncommon`
- `elemenx-game-inventory-description`
- `elemenx-game-inventory-name`
- `elemenx-game-inventory-stat`
- `elemenx-game-inventory-stat-label`
- `elemenx-game-inventory-stat-value`
- `elemenx-game-inventory-stats`
- `elemenx-game-inventory-type`

## ButtonGroup

- `elemenx-button`: `badged`, `block`, `danger`, `ghost`, `giant`, `icon-only`, `large`, `link`, `loading`, `pressed`, `primary`, `round`, `secondary`, `small`
- `elemenx-button-group`: `attached`, `vertical`

## Pipeline

- `elemenx-pipeline`
- `elemenx-pipeline-action`
- `elemenx-pipeline-board`
- `elemenx-pipeline-content`
- `elemenx-pipeline-count`
- `elemenx-pipeline-header`
- `elemenx-pipeline-job`: `failed`, `faded`, `inner`, `related`, `running`, `selected`
- `elemenx-pipeline-job-body`
- `elemenx-pipeline-job-name`
- `elemenx-pipeline-job-text`
- `elemenx-pipeline-link`: `faded`, `related`
- `elemenx-pipeline-links`
- `elemenx-pipeline-stage`
- `elemenx-pipeline-stage-header`
- `elemenx-pipeline-status`: `failed`, `manual`, `running`, `small`, `success`, `warning`
- `elemenx-pipeline-summary`
- `elemenx-pipeline-time`

## Calculator

- `elemenx-calculator`: `scientific`
- `elemenx-calculator-display`
- `elemenx-calculator-history`
- `elemenx-calculator-key`: `equals`, `function`, `operator`, `pressed`
- `elemenx-calculator-keys`
- `elemenx-calculator-line`
- `elemenx-calculator-record`
- `elemenx-calculator-record-line`
- `elemenx-calculator-result`

## BusinessCalculator

- `elemenx-business-calculator`: `side`
- `elemenx-business-calculator-bar`
- `elemenx-business-calculator-body`
- `elemenx-business-calculator-control`
- `elemenx-business-calculator-fields`
- `elemenx-business-calculator-hint`
- `elemenx-business-calculator-label`
- `elemenx-business-calculator-list`
- `elemenx-business-calculator-part`
- `elemenx-business-calculator-primary`
- `elemenx-business-calculator-results`
- `elemenx-business-calculator-row`
- `elemenx-business-calculator-swatch`
- `elemenx-business-calculator-title`
- `elemenx-business-calculator-unit`
- `elemenx-business-calculator-value`

## Quiz

- `elemenx-quiz`
- `elemenx-quiz-actions`
- `elemenx-quiz-clock`: `ending`
- `elemenx-quiz-feedback`: `wrong`
- `elemenx-quiz-image`
- `elemenx-quiz-intro`
- `elemenx-quiz-item`
- `elemenx-quiz-label`
- `elemenx-quiz-mark`
- `elemenx-quiz-option`: `chosen`, `right`, `single`, `wrong`
- `elemenx-quiz-options`
- `elemenx-quiz-order`
- `elemenx-quiz-progress`
- `elemenx-quiz-question`
- `elemenx-quiz-result`
- `elemenx-quiz-review`
- `elemenx-quiz-review-answer`
- `elemenx-quiz-review-body`
- `elemenx-quiz-review-explanation`
- `elemenx-quiz-reviewed`
- `elemenx-quiz-score`
- `elemenx-quiz-state`
- `elemenx-quiz-text`
- `elemenx-quiz-title`
- `elemenx-quiz-top`

## Experiment

- `elemenx-experiment`
- `elemenx-variant`

## Landing

- `elemenx-landing-action`: `ghost`, `primary`, `secondary`
- `elemenx-landing-actions`: `center`
- `elemenx-landing-header`: `center`
- `elemenx-landing-lead`
- `elemenx-landing-title`

## LandingHero

- `elemenx-landing-hero`: `center`, `cover`
- `elemenx-landing-hero-body`
- `elemenx-landing-hero-image`
- `elemenx-landing-hero-media`
- `elemenx-landing-hero-title`

## LandingFeatures

- `elemenx-landing-feature`
- `elemenx-landing-feature-icon`
- `elemenx-landing-feature-image`
- `elemenx-landing-feature-text`
- `elemenx-landing-feature-title`
- `elemenx-landing-features`: `cards`, `center`
- `elemenx-landing-features-grid`

## LandingStats

- `elemenx-landing-stat`
- `elemenx-landing-stat-label`
- `elemenx-landing-stat-value`
- `elemenx-landing-stats`
- `elemenx-landing-stats-list`

## LandingTestimonials

- `elemenx-landing-testimonial`
- `elemenx-landing-testimonial-author`
- `elemenx-landing-testimonial-role`
- `elemenx-landing-testimonial-text`
- `elemenx-landing-testimonial-who`
- `elemenx-landing-testimonials`
- `elemenx-landing-testimonials-grid`

## LandingFAQ

- `elemenx-landing-faq`
- `elemenx-landing-faq-answer`
- `elemenx-landing-faq-item`
- `elemenx-landing-faq-list`
- `elemenx-landing-faq-question`

## LandingCTA

- `elemenx-landing-cta`: `accent`, `center`
- `elemenx-landing-cta-side`
- `elemenx-landing-cta-title`

## Properties

- `elemenx-properties`: `double`

## Property

- `elemenx-property`: `accent`, `danger`, `success`, `warning`
- `elemenx-property-content`
- `elemenx-property-label`
- `elemenx-property-text`
- `elemenx-property-value`

## AchievementHost

- `elemenx-achievement`: `epic`, `lasting`, `legendary`, `rare`, `timed`, `uncommon`
- `elemenx-achievement-badge`
- `elemenx-achievement-band`
- `elemenx-achievement-line`
- `elemenx-achievement-overline`
- `elemenx-achievement-points`
- `elemenx-achievement-text`
- `elemenx-achievement-title`
- `elemenx-achievements`: `bottom`, `top`

## Block

- `elemenx-block-actions`
- `elemenx-block-body`
- `elemenx-block-header`
- `elemenx-block-note`
- `elemenx-block-tab`
- `elemenx-block-title`

## Button

- `elemenx-button-label`

## Calendar

- `elemenx-cal`: `day`, `dragging`, `editable`
- `elemenx-cal-allday`: `drop`
- `elemenx-cal-block`: `after`, `before`, `dragged`, `short`
- `elemenx-cal-column`: `today`
- `elemenx-cal-date`
- `elemenx-cal-day`: `drop`, `outside`, `today`
- `elemenx-cal-event`: `bar`, `dragged`, `earlier`, `joins-after`, `joins-before`, `later`, `whole`
- `elemenx-cal-header`
- `elemenx-cal-hour`
- `elemenx-cal-hours`
- `elemenx-cal-item`
- `elemenx-cal-label`
- `elemenx-cal-month`
- `elemenx-cal-more`
- `elemenx-cal-nav`
- `elemenx-cal-now`
- `elemenx-cal-resize`
- `elemenx-cal-shadow`
- `elemenx-cal-spacer`
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

## Chronicle

- `elemenx-chronicle`: `compact`
- `elemenx-chronicle-body`
- `elemenx-chronicle-content`
- `elemenx-chronicle-head`
- `elemenx-chronicle-item`: `accent`, `danger`, `dot`, `info`, `small`, `success`, `warning`
- `elemenx-chronicle-node`

## Timeline

- `elemenx-timeline`: `editable`, `overview`, `seekable`, `vertical`
- `elemenx-timeline-axis`
- `elemenx-timeline-body`
- `elemenx-timeline-buffer`
- `elemenx-timeline-controls`
- `elemenx-timeline-label`: `before`, `selected`
- `elemenx-timeline-label-text`
- `elemenx-timeline-lane`
- `elemenx-timeline-lane-name`
- `elemenx-timeline-lane-names`
- `elemenx-timeline-leader`
- `elemenx-timeline-now`
- `elemenx-timeline-overview`
- `elemenx-timeline-overview-edge`: `end`, `start`
- `elemenx-timeline-overview-mark`
- `elemenx-timeline-overview-range`
- `elemenx-timeline-overview-window`
- `elemenx-timeline-playhead`
- `elemenx-timeline-point`: `selected`
- `elemenx-timeline-progress`
- `elemenx-timeline-range`: `cut-end`, `cut-start`, `draft`, `narrow`, `selected`
- `elemenx-timeline-range-edge`: `end`, `start`
- `elemenx-timeline-range-label`
- `elemenx-timeline-tick`: `major`
- `elemenx-timeline-tick-label`
- `elemenx-timeline-track`

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
- `elemenx-chat-emoji`
- `elemenx-chat-hint`: `active`, `sticker`
- `elemenx-chat-hints`
- `elemenx-chat-picker`

## ChatMessage

- `elemenx-chat-author`
- `elemenx-chat-avatar`
- `elemenx-chat-body`
- `elemenx-chat-bubble`: `sticker`
- `elemenx-chat-check`
- `elemenx-chat-edited`
- `elemenx-chat-line`
- `elemenx-chat-menu-point`
- `elemenx-chat-message`: `first`, `last`, `middle`, `own`, `selected`, `selecting`, `single`
- `elemenx-chat-meta`
- `elemenx-chat-more`
- `elemenx-chat-react`
- `elemenx-chat-react-picker`
- `elemenx-chat-reaction`: `mine`
- `elemenx-chat-reaction-emoji`
- `elemenx-chat-reactions`
- `elemenx-chat-status`: `error`, `read`
- `elemenx-chat-sticker`
- `elemenx-chat-summary`
- `elemenx-chat-summary-avatar`
- `elemenx-chat-summary-empty`
- `elemenx-chat-summary-list`
- `elemenx-chat-summary-name`
- `elemenx-chat-summary-note`
- `elemenx-chat-summary-row`
- `elemenx-chat-summary-tab`: `active`
- `elemenx-chat-summary-tabs`
- `elemenx-chat-text`
- `elemenx-chat-tools`
- `elemenx-chat-views`
- `elemenx-menu`: `sheet`

## Chat

- `elemenx-chat`
- `elemenx-chat-composer-area`
- `elemenx-chat-conversation`: `active`
- `elemenx-chat-divider`
- `elemenx-chat-header`
- `elemenx-chat-jump`
- `elemenx-chat-main`
- `elemenx-chat-messages`
- `elemenx-chat-selection`
- `elemenx-chat-selection-count`
- `elemenx-chat-sidebar`

## CodeEditor

- `elemenx-code-diff`
- `elemenx-code-diff-code`: `add`, `empty`, `remove`
- `elemenx-code-diff-fold`
- `elemenx-code-diff-number`: `add`, `empty`, `remove`
- `elemenx-code-diff-row`: `add`, `remove`, `split`
- `elemenx-code-diff-sign`
- `elemenx-code-diff-stats`
- `elemenx-code-diff-word`
- `elemenx-code-editor`: `auto-size`, `disabled`, `invalid`, `readonly`, `wrap`
- `elemenx-code-editor-bracket`
- `elemenx-code-editor-content`
- `elemenx-code-editor-find`
- `elemenx-code-editor-hint`
- `elemenx-code-editor-input`
- `elemenx-code-editor-lines`
- `elemenx-code-editor-marker`: `info`, `warning`
- `elemenx-code-editor-match`: `current`
- `elemenx-code-editor-number`
- `elemenx-code-editor-popup`
- `elemenx-code-editor-print`
- `elemenx-code-editor-row`: `active`, `error`, `info`, `marked`, `warning`
- `elemenx-code-editor-scroll`
- `elemenx-code-editor-suggestion`: `active`
- `elemenx-code-editor-suggestion-detail`
- `elemenx-code-editor-suggestion-kind`
- `elemenx-code-editor-suggestions`
- `elemenx-code-editor-text`

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

## CommentCard

- `elemenx-comment`: `elevated`, `outlined`, `thread`
- `elemenx-comment-actions`
- `elemenx-comment-dot`
- `elemenx-comment-handle`
- `elemenx-comment-head`
- `elemenx-comment-line`
- `elemenx-comment-main`
- `elemenx-comment-media`: `count-1`, `count-3`
- `elemenx-comment-replies`
- `elemenx-comment-side`
- `elemenx-comment-text`
- `elemenx-comment-time`
- `elemenx-comment-token`

## CommitGraph

- `elemenx-commit-graph`
- `elemenx-commit-graph-author`
- `elemenx-commit-graph-body`
- `elemenx-commit-graph-date`
- `elemenx-commit-graph-dot`: `merge`
- `elemenx-commit-graph-id`
- `elemenx-commit-graph-lanes`
- `elemenx-commit-graph-line`
- `elemenx-commit-graph-message`
- `elemenx-commit-graph-ref`: `head`, `remote`, `tag`
- `elemenx-commit-graph-refs`
- `elemenx-commit-graph-row`: `selected`
- `elemenx-commit-graph-scheme`
- `elemenx-commit-graph-scheme-commit`: `selected`
- `elemenx-commit-graph-scheme-message`
- `elemenx-commit-graph-scheme-name`
- `elemenx-commit-graph-scheme-ref`
- `elemenx-commit-graph-scheme-track`
- `elemenx-commit-graph-space`


## ContextMenu

- `elemenx-context`
- `elemenx-context-point`

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

## DesignerCanvas

- `elemenx-designer-canvas`: `gaps`, `outlines`, `rulers`
- `elemenx-designer-chain`
- `elemenx-designer-chain-bar`
- `elemenx-designer-chain-item`: `active`
- `elemenx-designer-chain-title`
- `elemenx-designer-distance`
- `elemenx-designer-empty`
- `elemenx-designer-grip`
- `elemenx-designer-hover`
- `elemenx-designer-layer`: `inspect`
- `elemenx-designer-marker`
- `elemenx-designer-marker-note`
- `elemenx-designer-measure`: `content`, `margin`, `padding`, `pinned`
- `elemenx-designer-node`
- `elemenx-designer-outlet`
- `elemenx-designer-page`
- `elemenx-designer-page-host`
- `elemenx-designer-part`
- `elemenx-designer-ruler`: `horizontal`, `vertical`
- `elemenx-designer-rulers-corner`
- `elemenx-designer-selection`
- `elemenx-designer-slot`
- `elemenx-designer-stage`
- `elemenx-designer-surface`
- `elemenx-designer-target`
- `elemenx-designer-tip`
- `elemenx-designer-tip-row`
- `elemenx-designer-viewport`

## DesignerMap

- `elemenx-designer-map`
- `elemenx-designer-map-empty`
- `elemenx-designer-map-frame`
- `elemenx-designer-map-host`
- `elemenx-designer-map-label`
- `elemenx-designer-map-link`
- `elemenx-designer-map-link-head`
- `elemenx-designer-map-link-start`
- `elemenx-designer-map-links`
- `elemenx-designer-map-marks`
- `elemenx-designer-map-path`

## DesignerDocument

- `elemenx-designer-document-add`
- `elemenx-designer-document`
- `elemenx-designer-document-body`
- `elemenx-designer-document-drop`
- `elemenx-designer-document-head`
- `elemenx-designer-document-input`
- `elemenx-designer-document-key`: `wide`
- `elemenx-designer-document-prop`
- `elemenx-designer-document-props`
- `elemenx-designer-document-routes`
- `elemenx-designer-document-slots`

## DesignerInspector

- `elemenx-designer-inspector`
- `elemenx-designer-inspector-body`
- `elemenx-designer-inspector-description`
- `elemenx-designer-inspector-children`
- `elemenx-designer-inspector-head`
- `elemenx-designer-inspector-props`
- `elemenx-designer-inspector-title`
- `elemenx-designer-kind`
- `elemenx-designer-list-field`
- `elemenx-designer-list`
- `elemenx-designer-list-actions`
- `elemenx-designer-list-add`
- `elemenx-designer-list-button`
- `elemenx-designer-list-head`
- `elemenx-designer-list-input`
- `elemenx-designer-list-item`
- `elemenx-designer-list-key`

## DesignerPalette

- `elemenx-designer-palette`
- `elemenx-designer-palette-item`
- `elemenx-designer-palette-items`
- `elemenx-designer-palette-title`

## DesignerProject

- `elemenx-designer-project`
- `elemenx-designer-project-add`
- `elemenx-designer-project-head`
- `elemenx-designer-project-item`: `active`
- `elemenx-designer-project-name`
- `elemenx-designer-project-route`

## DesignerRules

- `elemenx-designer-rules-body`
- `elemenx-designer-rules-computed`
- `elemenx-designer-rules-context`
- `elemenx-designer-rules-list`
- `elemenx-designer-rules-name`
- `elemenx-designer-rules-other`: `active`
- `elemenx-designer-rules-others`
- `elemenx-designer-rules-row`

## DesignerSettings

- `elemenx-designer-settings-add-guard`
- `elemenx-designer-settings-add-route`
- `elemenx-designer-settings-remove-guard`
- `elemenx-designer-settings`
- `elemenx-designer-settings-body`
- `elemenx-designer-settings-grid`
- `elemenx-designer-settings-guard`
- `elemenx-designer-settings-remove`
- `elemenx-designer-settings-route`
- `elemenx-designer-settings-routes`
- `elemenx-designer-settings-signature`
- `elemenx-designer-settings-wide`

## DesignerStyle

- `elemenx-designer-box`: `padding`
- `elemenx-designer-box-core`
- `elemenx-designer-box-name`
- `elemenx-designer-box-side`: `bottom`, `left`, `right`, `top`
- `elemenx-designer-style`
- `elemenx-designer-style-choice`: `active`, `turned`
- `elemenx-designer-style-choices`
- `elemenx-designer-style-flex`
- `elemenx-designer-style-row`
- `elemenx-designer-style-sizes`

## DesignerTree

- `elemenx-designer-tree`
- `elemenx-designer-tree-start`

## Diagram

- `elemenx-diagram`
- `elemenx-diagram-error`


## DialPad

- `elemenx-dial-pad`: `disabled`
- `elemenx-dial-pad-call`
- `elemenx-dial-pad-digit`
- `elemenx-dial-pad-display`
- `elemenx-dial-pad-erase`
- `elemenx-dial-pad-input`
- `elemenx-dial-pad-key`
- `elemenx-dial-pad-keys`
- `elemenx-dial-pad-sub`

## Dialog

- `elemenx-dialog`: `full`, `large`, `refused`, `small`
- `elemenx-dialog-body`: `padded`
- `elemenx-dialog-footer`
- `elemenx-dialog-header`
- `elemenx-dialog-heading`
- `elemenx-dialog-title`

## DialogHost

- `elemenx-dialog-host-action`
- `elemenx-dialog-host`
- `elemenx-dialog-host-actions`
- `elemenx-dialog-host-item`

## Drawer

- `elemenx-drawer`: `bottom`, `full`, `large`, `left`, `medium`, `refused`, `right`, `small`, `top`
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

- `elemenx-field`: `disabled`, `horizontal`, `invalid`
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

## Gallery

- `elemenx-gallery`: `caption-overlay`, `contain`, `dragging`, `fade`, `slide`
- `elemenx-gallery-arrow`: `next`, `previous`
- `elemenx-gallery-caption`: `below`
- `elemenx-gallery-counter`
- `elemenx-gallery-description`
- `elemenx-gallery-dot`: `active`
- `elemenx-gallery-dots`
- `elemenx-gallery-image`
- `elemenx-gallery-play`
- `elemenx-gallery-slide`: `active`
- `elemenx-gallery-tag`
- `elemenx-gallery-tags`
- `elemenx-gallery-thumb`: `active`
- `elemenx-gallery-thumbs`
- `elemenx-gallery-title`
- `elemenx-gallery-track`
- `elemenx-gallery-viewport`

## GameBar

- `elemenx-game-bar`: `large`, `low`, `segmented`, `small`
- `elemenx-game-bar-fill`
- `elemenx-game-bar-gauge`
- `elemenx-game-bar-label`
- `elemenx-game-bar-ornament`
- `elemenx-game-bar-track`
- `elemenx-game-bar-trail`
- `elemenx-game-bar-value`

## GameDialogue

- `elemenx-game-dialogue`
- `elemenx-game-dialogue-body`
- `elemenx-game-dialogue-caret`
- `elemenx-game-dialogue-choice`
- `elemenx-game-dialogue-choices`
- `elemenx-game-dialogue-next`
- `elemenx-game-dialogue-number`
- `elemenx-game-dialogue-portrait`
- `elemenx-game-dialogue-speaker`
- `elemenx-game-dialogue-text`

## GameHud

- `elemenx-game-hud`
- `elemenx-game-hud-area`: `bottom`, `bottom-end`, `bottom-start`, `center`, `end`, `start`, `top`, `top-end`
- `elemenx-game-hud-layer`
- `elemenx-game-hud-scene`

## GameInventory

- `elemenx-game-inventory`
- `elemenx-game-inventory-badge`
- `elemenx-game-inventory-cell`: `active`, `drop-over`, `empty`, `epic`, `filled`, `held`, `legendary`, `rare`, `uncommon`
- `elemenx-game-inventory-count`
- `elemenx-game-inventory-grid`
- `elemenx-game-inventory-image`
- `elemenx-game-inventory-mark`

## GameKey

- `elemenx-game-key`: `button-a`, `button-b`, `button-down`, `button-home`, `button-left`, `button-right`, `button-select`, `button-start`, `button-up`, `button-x`, `button-y`, `generic`, `keyboard`, `nintendo`, `playstation`, `xbox`
- `elemenx-game-key-glyph`
- `elemenx-game-key-label`

## GameLeaderboard

- `elemenx-game-leaderboard`: `selectable`
- `elemenx-game-leaderboard-avatar`
- `elemenx-game-leaderboard-change`: `down`, `up`
- `elemenx-game-leaderboard-gap`
- `elemenx-game-leaderboard-head`
- `elemenx-game-leaderboard-name`
- `elemenx-game-leaderboard-note`
- `elemenx-game-leaderboard-player`
- `elemenx-game-leaderboard-rank`
- `elemenx-game-leaderboard-row`: `bronze`, `gap`, `gold`, `me`, `silver`
- `elemenx-game-leaderboard-score`

## GameMenu

- `elemenx-game-menu`
- `elemenx-game-menu-hint`
- `elemenx-game-menu-item`
- `elemenx-game-menu-items`
- `elemenx-game-menu-label`
- `elemenx-game-menu-subtitle`
- `elemenx-game-menu-title`

## GameMinimap

- `elemenx-game-marker`: `ally`, `edge`, `enemy`, `quest`
- `elemenx-game-minimap`: `round`
- `elemenx-game-minimap-caption`
- `elemenx-game-minimap-map`
- `elemenx-game-minimap-north`
- `elemenx-game-minimap-note`
- `elemenx-game-minimap-player`
- `elemenx-game-minimap-title`
- `elemenx-game-minimap-view`
- `elemenx-game-minimap-zoom`

## GameQuests

- `elemenx-game-objective`: `done`
- `elemenx-game-objective-bar`
- `elemenx-game-objective-count`
- `elemenx-game-objective-mark`
- `elemenx-game-objectives`
- `elemenx-game-quest`: `active`, `done`, `failed`
- `elemenx-game-quest-level`
- `elemenx-game-quest-mark`
- `elemenx-game-quest-title`
- `elemenx-game-quests`: `log`
- `elemenx-game-quests-actions`
- `elemenx-game-quests-detail`
- `elemenx-game-quests-empty`
- `elemenx-game-quests-group`
- `elemenx-game-quests-header`
- `elemenx-game-quests-heading`
- `elemenx-game-quests-list`
- `elemenx-game-quests-meta`
- `elemenx-game-quests-text`
- `elemenx-game-quests-title`
- `elemenx-game-reward`: `common`, `epic`, `legendary`, `rare`, `uncommon`
- `elemenx-game-reward-count`
- `elemenx-game-reward-icon`
- `elemenx-game-reward-label`
- `elemenx-game-rewards`
- `elemenx-game-tracker`
- `elemenx-game-tracker-objective`: `done`
- `elemenx-game-tracker-quest`
- `elemenx-game-tracker-title`

## GameScene

- `elemenx-game-scene`: `dragging`, `flat`, `panning`
- `elemenx-game-scene-canvas`
- `elemenx-game-scene-card`
- `elemenx-game-scene-card-actions`
- `elemenx-game-scene-card-header`
- `elemenx-game-scene-card-kind`
- `elemenx-game-scene-card-row`
- `elemenx-game-scene-card-rows`
- `elemenx-game-scene-card-title`
- `elemenx-game-scene-fallback`
- `elemenx-game-scene-hud`
- `elemenx-game-scene-label`
- `elemenx-game-scene-labels`: `hidden`
- `elemenx-game-scene-marks`
- `elemenx-game-scene-minimap`
- `elemenx-game-scene-takeoff`

## GameSlot

- `elemenx-game-slot`: `active`, `drop-over`, `empty`, `epic`, `filled`, `large`, `legendary`, `rare`, `small`, `uncommon`
- `elemenx-game-slot-badge`
- `elemenx-game-slot-count`
- `elemenx-game-slot-glass`
- `elemenx-game-slot-gloss`
- `elemenx-game-slot-image`
- `elemenx-game-slot-key`
- `elemenx-game-slot-sweep`
- `elemenx-game-slot-timer`

## GameTabs

- `elemenx-game-tab`: `active`
- `elemenx-game-tab-label`
- `elemenx-game-tab-number`
- `elemenx-game-tabs`: `horizontal`, `vertical`


## Keyboard

- `elemenx-keyboard`: `clickable`, `large`, `small`
- `elemenx-keyboard-block`
- `elemenx-keyboard-key`: `dual`, `held`, `marked`, `pressed`
- `elemenx-keyboard-label`
- `elemenx-keyboard-second`

## Knob

- `elemenx-knob`: `active`, `disabled`, `large`, `small`
- `elemenx-knob-arc`
- `elemenx-knob-cap`
- `elemenx-knob-dial`
- `elemenx-knob-face`
- `elemenx-knob-label`
- `elemenx-knob-pointer`
- `elemenx-knob-ring`
- `elemenx-knob-tick`
- `elemenx-knob-value`

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

- `elemenx-menu`: `dragging`, `sheet`
- `elemenx-menu-back`
- `elemenx-menu-cancel`
- `elemenx-menu-grabber`
- `elemenx-menu-head`
- `elemenx-menu-host`
- `elemenx-menu-icon`
- `elemenx-menu-layer`
- `elemenx-menu-shade`
- `elemenx-menu-title`

## Menu

- `elemenx-menu-root`

## MenuBar

- `elemenx-menu-bar`
- `elemenx-menu-bar-entry`
- `elemenx-menu-bar-host`

## Meter

- `elemenx-meter`: `danger`, `dial`, `large`, `small`, `value-below`, `value-corner`, `vertical`, `warning`
- `elemenx-meter-arc`
- `elemenx-meter-center`
- `elemenx-meter-content`
- `elemenx-meter-dial`
- `elemenx-meter-face`
- `elemenx-meter-fill`
- `elemenx-meter-head`
- `elemenx-meter-label`
- `elemenx-meter-mark`
- `elemenx-meter-max`
- `elemenx-meter-min`
- `elemenx-meter-needle`
- `elemenx-meter-range`
- `elemenx-meter-readout`
- `elemenx-meter-ring`
- `elemenx-meter-scale`
- `elemenx-meter-tick`
- `elemenx-meter-track`
- `elemenx-meter-value`

## Mixer

- `elemenx-mixer`
- `elemenx-mixer-channels`

## MixerChannel

- `elemenx-mixer-bar`
- `elemenx-mixer-buttons`
- `elemenx-mixer-channel`: `disabled`, `master`, `muted`, `silenced`
- `elemenx-mixer-fill`
- `elemenx-mixer-knobs`
- `elemenx-mixer-meter`
- `elemenx-mixer-name`
- `elemenx-mixer-peak`
- `elemenx-mixer-readout`
- `elemenx-mixer-strip`
- `elemenx-mixer-toggle`: `mute`, `solo`

## MoneyInput

- `elemenx-money`
- `elemenx-money-input`

## Mosaic

- `elemenx-mosaic`: `selectable`, `treemap`
- `elemenx-mosaic-caption`
- `elemenx-mosaic-content`
- `elemenx-mosaic-custom`
- `elemenx-mosaic-image`
- `elemenx-mosaic-item`: `colored`, `parent`, `picture`
- `elemenx-mosaic-text`

## NotificationHost

- `elemenx-notification-action`
- `elemenx-notification`: `bare`, `danger`, `held`, `success`, `warning`
- `elemenx-notification-actions`
- `elemenx-notification-body`
- `elemenx-notification-close`
- `elemenx-notification-custom`
- `elemenx-notification-frame`
- `elemenx-notification-host`: `bottom-left`, `bottom-right`, `page`, `top-left`, `top-right`
- `elemenx-notification-icon`
- `elemenx-notification-image`
- `elemenx-notification-more`
- `elemenx-notification-progress`
- `elemenx-notification-text`
- `elemenx-notification-timer`

## CallInvite

- `elemenx-call-invite`
- `elemenx-call-invite-actions`
- `elemenx-call-invite-avatar`
- `elemenx-call-invite-button`: `accept`
- `elemenx-call-invite-caller`
- `elemenx-call-invite-kind`
- `elemenx-call-invite-name`
- `elemenx-call-invite-text`

## CallTile

- `elemenx-call-tile`: `pinned`, `screen`, `self`, `speaking`
- `elemenx-call-tile-avatar`
- `elemenx-call-tile-hand`
- `elemenx-call-tile-name`
- `elemenx-call-tile-pin`
- `elemenx-call-tile-quality`
- `elemenx-call-tile-top`
- `elemenx-call-tile-video`

## CallControls

- `elemenx-call-controls`
- `elemenx-call-controls-group`
- `elemenx-call-controls-pair`
- `elemenx-call-control`: `leave`

## CallStage

- `elemenx-call-stage`: `grid`, `speaker`, `screen`, `side`, `has-main`, `has-self`, `has-status`, `has-controls`
- `elemenx-call-stage-area`
- `elemenx-call-stage-body`
- `elemenx-call-stage-controls`
- `elemenx-call-stage-main`
- `elemenx-call-stage-pages`
- `elemenx-call-stage-participants`
- `elemenx-call-stage-self`: `bottom-right`, `bottom-left`, `top-right`, `top-left`, `dragging`
- `elemenx-call-stage-side`
- `elemenx-call-stage-status`

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

## Piano

- `elemenx-piano`: `disabled`, `large`, `small`
- `elemenx-piano-key`: `black`, `marked`, `pressed`, `white`
- `elemenx-piano-name`
- `elemenx-piano-typing`

## PianoRoll

- `elemenx-piano-roll`: `readonly`
- `elemenx-piano-roll-bar-number`
- `elemenx-piano-roll-corner`
- `elemenx-piano-roll-grid`
- `elemenx-piano-roll-key`: `black`
- `elemenx-piano-roll-keys`
- `elemenx-piano-roll-loop`
- `elemenx-piano-roll-note`: `selected`
- `elemenx-piano-roll-playhead`
- `elemenx-piano-roll-row`: `black`
- `elemenx-piano-roll-ruler`
- `elemenx-piano-roll-scroll`


## PlanCard

- `elemenx-plan`: `disabled`, `popular`, `selected`
- `elemenx-plan-description`
- `elemenx-plan-features`
- `elemenx-plan-footer`
- `elemenx-plan-header`
- `elemenx-plan-name`
- `elemenx-plan-note`
- `elemenx-plan-popular`
- `elemenx-plan-price`

## PlanPicker

- `elemenx-plans`
- `elemenx-plans-period`

## Popover

- `elemenx-popover`
- `elemenx-popover-root`
- `elemenx-popover-title`
- `elemenx-popover-trigger`

## PostCard

- `elemenx-post`: `overlay`
- `elemenx-post-category`
- `elemenx-post-excerpt`
- `elemenx-post-tags`

## ProductCard

- `elemenx-product`: `corner`
- `elemenx-product-badge`
- `elemenx-product-brand`
- `elemenx-product-color`: `active`
- `elemenx-product-corner`
- `elemenx-product-dot`: `active`
- `elemenx-product-dots`
- `elemenx-product-favorite`: `on`
- `elemenx-product-footer`
- `elemenx-product-media`
- `elemenx-product-options`
- `elemenx-product-price`
- `elemenx-product-rating`
- `elemenx-product-size`: `active`
- `elemenx-product-title`

## ProfileCard

- `elemenx-profile`: `card`, `compact`
- `elemenx-profile-actions`
- `elemenx-profile-avatar`
- `elemenx-profile-bio`
- `elemenx-profile-cover`
- `elemenx-profile-head`
- `elemenx-profile-name`
- `elemenx-profile-names`
- `elemenx-profile-stat`
- `elemenx-profile-stats`
- `elemenx-profile-status-label`

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

- `elemenx-ribbon`: `collapsed`, `floating`, `narrow`, `tabs-menu`
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
- `elemenx-ribbon-gallery`: `labelled`
- `elemenx-ribbon-gallery-caption`
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
- `elemenx-ribbon-tabs-button`
- `elemenx-ribbon-tabs-list`
- `elemenx-ribbon-tabs-menu`

## RichEditor

- `elemenx-rich-editor`: `disabled`, `growing`, `readonly`
- `elemenx-rich-editor-action`
- `elemenx-rich-editor-actions`
- `elemenx-rich-editor-content`: `empty`
- `elemenx-rich-editor-find`
- `elemenx-rich-editor-link`
- `elemenx-rich-editor-menu`
- `elemenx-rich-editor-print`
- `elemenx-rich-editor-separator`

## Ruler

- `elemenx-ruler`: `horizontal`, `vertical`
- `elemenx-ruler-guide`
- `elemenx-ruler-label`
- `elemenx-ruler-marker`
- `elemenx-ruler-range`

## Sampler

- `elemenx-sampler`
- `elemenx-sampler-key`
- `elemenx-sampler-label`
- `elemenx-sampler-pad`: `active`, `empty`, `over`


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

## SettingsMenu

- `elemenx-settings-menu`: `ios`, `material`
- `elemenx-settings-menu-back`
- `elemenx-settings-menu-badge`
- `elemenx-settings-menu-check`
- `elemenx-settings-menu-chevron`
- `elemenx-settings-menu-description`
- `elemenx-settings-menu-group`
- `elemenx-settings-menu-group-title`
- `elemenx-settings-menu-item`
- `elemenx-settings-menu-knob`
- `elemenx-settings-menu-label`
- `elemenx-settings-menu-list`
- `elemenx-settings-menu-main`
- `elemenx-settings-menu-note`
- `elemenx-settings-menu-page`: `back`, `forward`
- `elemenx-settings-menu-query`
- `elemenx-settings-menu-row`: `checked`, `danger`
- `elemenx-settings-menu-search`
- `elemenx-settings-menu-switch`
- `elemenx-settings-menu-text`
- `elemenx-settings-menu-tile`
- `elemenx-settings-menu-title`
- `elemenx-settings-menu-value`

## Signal

- `elemenx-signal`: `accent`, `danger`, `muted`, `small`, `success`, `warning`
- `elemenx-signal-bar`: `on`

## Slider

- `elemenx-slider`: `disabled`, `large`, `small`, `vertical`
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

## Spectrum

- `elemenx-spectrum`
- `elemenx-spectrum-canvas`


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

## Suprematism

- `elemenx-suprematism`

## Table

- `elemenx-table-box`
- `elemenx-table-check-box`
- `elemenx-table-check`
- `elemenx-table-empty`
- `elemenx-table-filter-select`
- `elemenx-table-filters`
- `elemenx-table-sort`
- `elemenx-table-tree`
- `elemenx-table-twisty`
- `elemenx-table-wrap`: `scrolling`

## Tab

- `elemenx-tab-panel`

## Tabs

- `elemenx-tab`: `active`, `disabled`
- `elemenx-tab-close`
- `elemenx-tabs`: `editor`, `large`, `left`, `line`, `pill`, `right`, `rotated`, `small`, `vertical`
- `elemenx-tabs-extra`
- `elemenx-tabs-list`

## TabGroup

- `elemenx-tab-group`: `declared`
- `elemenx-tab-group-body`
- `elemenx-tab-group-close`
- `elemenx-tab-group-label`
- `elemenx-tab-group-pin`
- `elemenx-tab-group-strip`
- `elemenx-tab-group-tab`: `active`, `disabled`, `dragging`, `pinned`
- `elemenx-tab-group-zone`: `bottom`, `left`, `right`, `top`

## TabSplit

- `elemenx-tab-split`
- `elemenx-tab-split-divider`: `column`, `row`
- `elemenx-tab-split-group`

## TabRow

- `elemenx-tab-row`

## TabColumn

- `elemenx-tab-column`

## TagInput

- `elemenx-tags`
- `elemenx-tags-control`
- `elemenx-tags-field`: `large`, `small`

## Terminal

- `elemenx-terminal`
- `elemenx-terminal-actions`
- `elemenx-terminal-command`
- `elemenx-terminal-find`
- `elemenx-terminal-header`
- `elemenx-terminal-input`
- `elemenx-terminal-line`: `error`, `info`, `input`, `output`, `success`
- `elemenx-terminal-output`
- `elemenx-terminal-prompt`
- `elemenx-terminal-title`

## TextArea

- `elemenx-textarea-counter`

## TileGrid

- `elemenx-tile`: `dragging`, `large`, `locked`, `medium`, `small`, `spanned`, `tall`, `wide`, `xlarge`
- `elemenx-tile-badge`
- `elemenx-tile-cells`
- `elemenx-tile-content`
- `elemenx-tile-gap`: `after`, `below`, `drop-over`, `drop-target`, `side`
- `elemenx-tile-grid`: `columns`, `drop-over`, `drop-target`, `editable`, `horizontal`, `scroll`, `sorting`, `stacks`
- `elemenx-tile-group`: `drop-over`, `drop-target`, `growing`, `new`
- `elemenx-tile-group-action`
- `elemenx-tile-group-actions`
- `elemenx-tile-group-header`
- `elemenx-tile-group-resize`
- `elemenx-tile-group-stretch`: `bottom`, `corner`
- `elemenx-tile-group-title`
- `elemenx-tile-lane`
- `elemenx-tile-new`
- `elemenx-tile-source-content`
- `elemenx-tile-stack`
- `elemenx-tile-text`
- `elemenx-tile-title`

## TitleBar

- `elemenx-title-bar`: `overlay`
- `elemenx-title-bar-actions`
- `elemenx-title-bar-content`
- `elemenx-title-bar-control`: `close`
- `elemenx-title-bar-controls`
- `elemenx-title-bar-host`
- `elemenx-title-bar-icon`
- `elemenx-title-bar-space`
- `elemenx-title-bar-title`

## TimeInput

- `elemenx-time`
- `elemenx-time-column`
- `elemenx-time-columns`
- `elemenx-time-popup`

## ToastHost

- `elemenx-toast`: `danger`, `success`, `warning`
- `elemenx-toast-action`: `primary`
- `elemenx-toast-actions`
- `elemenx-toast-custom`
- `elemenx-toast-host`: `bottom`, `bottom-left`, `bottom-right`, `top`, `top-left`, `top-right`
- `elemenx-toast-text`
- `elemenx-toast-timer`

## Toggle

- `elemenx-toggle`: `checked`, `disabled`, `position-1`, `position-2`, `small`, `three`, `vertical`
- `elemenx-toggle-name`: `current`
- `elemenx-toggle-names`
- `elemenx-toggle-stop`
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

## Waveform

- `elemenx-waveform`: `selectable`
- `elemenx-waveform-canvas`
- `elemenx-waveform-selection`
- `elemenx-waveform-time`


## Window

- `elemenx-window`: `active`, `fixed`, `game`, `maximized`, `minimized`, `moving`, `trapezoid`
- `elemenx-window-body`
- `elemenx-window-control`: `close`
- `elemenx-window-controls`
- `elemenx-window-extra`
- `elemenx-window-footer`
- `elemenx-window-handle`: `e`, `n`, `ne`, `nw`, `s`, `se`, `sw`, `w`
- `elemenx-window-header`
- `elemenx-window-overline`
- `elemenx-window-tab`
- `elemenx-window-title`
- `elemenx-window-titles`

## WorkspaceToolWindow

- `elemenx-workspace-tool-window`
- `elemenx-workspace-tool-window-actions`
- `elemenx-workspace-tool-window-body`: `padded`
- `elemenx-workspace-tool-window-header`
- `elemenx-workspace-tool-window-title`

## WorkspaceToolbar

- `elemenx-workspace-toolbar`

## Workspace

- `elemenx-workspace`: `customizing`, `ribbon`
- `elemenx-workspace-band`: `bottom`, `top`
- `elemenx-workspace-body`
- `elemenx-workspace-center`
- `elemenx-workspace-dock`: `bottom`
- `elemenx-workspace-header`
- `elemenx-workspace-main`
- `elemenx-workspace-panel`: `bottom`, `left`, `right`
- `elemenx-workspace-ribbon`
- `elemenx-workspace-status`
- `elemenx-workspace-stripe`: `left`, `right`
- `elemenx-workspace-tool-button`
- `elemenx-workspace-tools`

## Board

- `elemenx-board`: `grid-dots`, `grid-lines`, `panning`
- `elemenx-board-content`
- `elemenx-board-controls`
- `elemenx-board-host`
- `elemenx-board-world`
- `elemenx-board-zoom`

## Breadcrumbs

- `elemenx-breadcrumbs`: `large`, `small`
- `elemenx-breadcrumbs-end`
- `elemenx-breadcrumbs-item`: `current`, `disabled`, `more`
- `elemenx-breadcrumbs-label`
- `elemenx-breadcrumbs-link`
- `elemenx-breadcrumbs-list`
- `elemenx-breadcrumbs-separator`
- `elemenx-breadcrumbs-start`
- `elemenx-breadcrumbs-text`

## Presence

- `elemenx-presence`: `away`, `busy`, `connecting`, `dnd`, `large`, `offline`, `online`, `small`
- `elemenx-presence-dot`
- `elemenx-presence-label`

## Avatar

- `elemenx-avatar`: `large`, `rounded`, `small`, `square`, `xlarge`
- `elemenx-avatar-art`
- `elemenx-avatar-face`
- `elemenx-avatar-image`
- `elemenx-avatar-initials`
- `elemenx-avatar-status`

## Barcode

- `elemenx-barcode`


## Image

- `elemenx-image`: `circle`, `loading`, `rounded`, `sized`, `stretch-both`, `stretch-height`, `stretch-width`
- `elemenx-image-broken`
- `elemenx-image-picture`
- `elemenx-image-placeholder`

## Form

- `elemenx-form`
- `elemenx-form-fields`

## FindBar

- `elemenx-find`
- `elemenx-find-count`
- `elemenx-find-indent`
- `elemenx-find-option`
- `elemenx-find-query`
- `elemenx-find-replacement`
- `elemenx-find-row`

## Markdown

- `elemenx-markdown`: `interface`

## CodeView

- `elemenx-code-view`: `folding`, `limited`, `numbered`, `wrap`
- `elemenx-code-view-copy`: `copied`
- `elemenx-code-view-fold`
- `elemenx-code-view-line`: `folded`, `marked`
- `elemenx-code-view-more`
- `elemenx-code-view-tail`
- `elemenx-code-view-text`

## Formula

- `elemenx-formula`: `display`

## SplitButton

- `elemenx-split-button`
- `elemenx-split-button-arrow`
- `elemenx-split-button-main`

## Accordion

- `elemenx-accordion`: `bordered`

## Countdown

- `elemenx-countdown`: `ended`, `large`, `small`
- `elemenx-countdown-line`
- `elemenx-countdown-part`
- `elemenx-countdown-unit`
- `elemenx-countdown-value`

## Clock

- `elemenx-clock`: `large`, `small`
- `elemenx-clock-date`
- `elemenx-clock-face`
- `elemenx-clock-hour`
- `elemenx-clock-label`
- `elemenx-clock-mark`
- `elemenx-clock-minute`
- `elemenx-clock-pin`
- `elemenx-clock-rim`
- `elemenx-clock-second`
- `elemenx-clock-time`

## Consent

- `elemenx-consent`: `bottom`, `center`, `inline`
- `elemenx-consent-actions`
- `elemenx-consent-body`
- `elemenx-consent-purposes`
- `elemenx-consent-text`
- `elemenx-consent-title`

## DiffView

- `elemenx-diff-added`
- `elemenx-diff-body`
- `elemenx-diff-fold`
- `elemenx-diff-header`
- `elemenx-diff-number`
- `elemenx-diff-removed`
- `elemenx-diff-row`: `add`, `folded`, `remove`
- `elemenx-diff-side`: `add`, `empty`, `remove`
- `elemenx-diff-sign`
- `elemenx-diff-text`
- `elemenx-diff-title`
- `elemenx-diff-view`: `split`, `wrap`
- `elemenx-diff-word`

## SignaturePad

- `elemenx-signature-canvas`
- `elemenx-signature-controls`
- `elemenx-signature-field`
- `elemenx-signature-line`
- `elemenx-signature-pad`: `readonly`
- `elemenx-signature-result`: `match`, `mismatch`
- `elemenx-signature-placeholder`

## Drawing

- `elemenx-drawing`: `readonly`
- `elemenx-drawing-brush`
- `elemenx-drawing-color`
- `elemenx-drawing-editor`
- `elemenx-drawing-group`
- `elemenx-drawing-handle`
- `elemenx-drawing-marquee`
- `elemenx-drawing-selection`
- `elemenx-drawing-stage`
- `elemenx-drawing-svg`
- `elemenx-drawing-tool`: `active`
- `elemenx-drawing-toolbar`
- `elemenx-drawing-width`

## DrawingLayers

- `elemenx-drawing-layer`: `current`, `hidden`
- `elemenx-drawing-layer-count`
- `elemenx-drawing-layer-field`
- `elemenx-drawing-layer-name`
- `elemenx-drawing-layer-toggle`
- `elemenx-drawing-layers`
- `elemenx-drawing-layers-actions`
- `elemenx-drawing-layers-list`

## MediaCard

- `elemenx-media-card`: `large`, `small`
- `elemenx-media-card-badge`
- `elemenx-media-card-blank`
- `elemenx-media-card-favorite`: `on`
- `elemenx-media-card-kind`
- `elemenx-media-card-link`
- `elemenx-media-card-play`
- `elemenx-media-card-poster`
- `elemenx-media-card-progress`
- `elemenx-media-card-score`: `high`, `low`
- `elemenx-media-card-subtitle`
- `elemenx-media-card-tags`
- `elemenx-media-card-text`
- `elemenx-media-card-title`

## MediaShelf

- `elemenx-media-shelf`
- `elemenx-media-shelf-arrows`
- `elemenx-media-shelf-header`
- `elemenx-media-shelf-item`
- `elemenx-media-shelf-more`
- `elemenx-media-shelf-title`
- `elemenx-media-shelf-track`

## MediaHero

- `elemenx-media-hero`: `backdrop`, `compact`
- `elemenx-media-hero-actions`
- `elemenx-media-hero-backdrop`
- `elemenx-media-hero-description`
- `elemenx-media-hero-inner`
- `elemenx-media-hero-meta`
- `elemenx-media-hero-poster`
- `elemenx-media-hero-progress`
- `elemenx-media-hero-score`
- `elemenx-media-hero-subtitle`
- `elemenx-media-hero-tags`
- `elemenx-media-hero-text`
- `elemenx-media-hero-title`

## FacetFilter

- `elemenx-facet`: `active`
- `elemenx-facet-body`
- `elemenx-facet-count`
- `elemenx-facet-filter`
- `elemenx-facet-filter-chip`
- `elemenx-facet-filter-chips`
- `elemenx-facet-filter-clear`
- `elemenx-facet-filter-head`
- `elemenx-facet-filter-remove`
- `elemenx-facet-header`
- `elemenx-facet-label`
- `elemenx-facet-more`
- `elemenx-facet-option`
- `elemenx-facet-option-label`
- `elemenx-facet-options`
- `elemenx-facet-range`
- `elemenx-facet-search`
- `elemenx-facet-unit`

## TrackList

- `elemenx-track`: `current`, `disabled`, `playing`
- `elemenx-track-action`
- `elemenx-track-artist`
- `elemenx-track-bars`
- `elemenx-track-column`
- `elemenx-track-duration`
- `elemenx-track-explicit`
- `elemenx-track-index`
- `elemenx-track-list`: `with-album`, `with-artist`
- `elemenx-track-list-rows`
- `elemenx-track-list-total`
- `elemenx-track-main`
- `elemenx-track-number`
- `elemenx-track-title`

## CastList

- `elemenx-cast`: `grid`, `list`, `row`
- `elemenx-cast-name`
- `elemenx-cast-people`
- `elemenx-cast-person`
- `elemenx-cast-role`
- `elemenx-cast-text`
- `elemenx-cast-title`

## VideoTimeline

- `elemenx-video-timeline`
- `elemenx-video-timeline-body`
- `elemenx-video-timeline-clip`: `pictured`, `selected`
- `elemenx-video-timeline-content`
- `elemenx-video-timeline-corner`
- `elemenx-video-timeline-edge`: `end`, `start`
- `elemenx-video-timeline-guide`
- `elemenx-video-timeline-head`
- `elemenx-video-timeline-heads`
- `elemenx-video-timeline-knob`
- `elemenx-video-timeline-label`
- `elemenx-video-timeline-lane`: `hidden`, `locked`, `muted`
- `elemenx-video-timeline-marker`
- `elemenx-video-timeline-name`
- `elemenx-video-timeline-playhead`
- `elemenx-video-timeline-ruler`
- `elemenx-video-timeline-scroller`
- `elemenx-video-timeline-tick`: `major`
- `elemenx-video-timeline-timecode`
- `elemenx-video-timeline-toggle`
- `elemenx-video-timeline-toolbar`
- `elemenx-video-timeline-wave`

## ImageCropper

- `elemenx-cropper`: `disabled`, `round`
- `elemenx-cropper-box`
- `elemenx-cropper-field`
- `elemenx-cropper-handle`: `e`, `n`, `ne`, `nw`, `s`, `se`, `sw`, `w`
- `elemenx-cropper-image`
- `elemenx-cropper-size`

## Jog

- `elemenx-jog`: `disabled`, `touched`
- `elemenx-jog-face`
- `elemenx-jog-groove`
- `elemenx-jog-label`
- `elemenx-jog-marker`
- `elemenx-jog-platter`
- `elemenx-jog-ring`
- `elemenx-jog-ring-mark`
- `elemenx-jog-spindle`
- `elemenx-jog-subtitle`
- `elemenx-jog-title`
- `elemenx-jog-vinyl`


## QRCode

- `elemenx-qr-code`

## QRScanner

- `elemenx-qr-scanner`: `done`
- `elemenx-qr-scanner-frame`
- `elemenx-qr-scanner-status`
- `elemenx-qr-scanner-video`
- `elemenx-qr-scanner-view`

## FileBrowser

- `elemenx-file-browser`: `grid`
- `elemenx-file-browser-bar`
- `elemenx-file-browser-empty`
- `elemenx-file-browser-head`
- `elemenx-file-browser-icon`
- `elemenx-file-browser-item`: `selected`
- `elemenx-file-browser-items`
- `elemenx-file-browser-modified`
- `elemenx-file-browser-name`
- `elemenx-file-browser-path`
- `elemenx-file-browser-size`
- `elemenx-file-browser-sort`: `active`, `modified`
- `elemenx-file-browser-view`
- `elemenx-file-browser-views`

## MediaPlayer

- `elemenx-media-big`
- `elemenx-media-button`: `text`
- `elemenx-media-controls`
- `elemenx-media-element`
- `elemenx-media-player`: `full`
- `elemenx-media-row`
- `elemenx-media-seek`
- `elemenx-media-spacer`
- `elemenx-media-speed`
- `elemenx-media-stage`
- `elemenx-media-time`
- `elemenx-media-title`
- `elemenx-media-volume`
