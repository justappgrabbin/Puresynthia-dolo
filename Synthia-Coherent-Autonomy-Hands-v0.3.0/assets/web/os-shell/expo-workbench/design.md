# Zip Visual Editor — Mobile Interface Design

## Product Direction

Zip Visual Editor is a portrait-first, one-handed no-code builder for turning imported web project ZIPs into editable visual layouts. The primary interaction is a mobile canvas: users add interface blocks, drag them into place, tap to select them, and adjust properties through friendly controls rather than source code.

## Screen List

| Screen | Primary content and functionality |
|---|---|
| Projects | Recent imported projects, project thumbnails, last-edited status, and a prominent Import ZIP action. |
| Import ZIP | File picker entry point, import progress, supported-project guidance, and a clear success state. |
| Editor | Visual canvas, device preview toggle, selected-block outline, undo/redo, preview mode, and Save/Export actions. |
| Add Block Sheet | Bottom sheet containing draggable or tappable blocks: Section, Text, Image, Button, Card, Divider, Spacer, and Columns. |
| Block Inspector | Contextual controls for the selected block: content, colors, typography, spacing, alignment, size, border, radius, and visibility. |
| Project Settings | Rename project, choose preview viewport, manage imported assets, reset unsaved changes, and export ZIP. |
| Export Sheet | Export summary, destination/share action, and confirmation that the edited project is ready. |

## Editor Layout

The editor uses a compact navigation bar at the top with the project name, undo/redo buttons, and a preview toggle. The center of the screen is a light canvas with a subtle grid and a device-frame preview. Each block has a visible selection ring when active, with a small floating handle for moving and a resize affordance where supported. A bottom dock contains the Add Block button, Layers, and Inspector shortcuts so the main controls stay within thumb reach.

When a block is selected, the inspector appears as a bottom sheet rather than navigating away from the canvas. The sheet uses segmented sections for Content, Style, Layout, and Advanced. Controls are represented by sliders, color swatches, segmented buttons, stepper controls, and text inputs. The user can collapse the inspector to return to a larger canvas while preserving selection.

## Core User Flows

### Import and open a project

The user opens Projects, taps Import ZIP, chooses a ZIP from the device, and sees an import progress state. The app creates a local project model from supported web assets, then opens the project in Editor with a representative starting page. The imported project remains available in Projects for later editing.

### Build visually from blocks

The user taps Add Block, chooses a block type, and sees the new block inserted into the active section. They drag the block vertically to reorder it, tap it to select it, and use the Inspector to change text, colors, padding, alignment, and other properties. The canvas updates immediately after each change.

### Refine an existing interface

The user taps any visible block on the canvas. The app highlights the selected block and opens its Inspector. The user can change the block's content or styling without seeing source code. Duplicate, delete, move, and resize actions are available from the selection toolbar, with undo and redo available for recovery.

### Preview and export

The user taps Preview to hide editor affordances and inspect the result in a clean device frame. They return to Editor to continue adjusting. When satisfied, they tap Export, review the project summary, and use the system share/save flow to export the edited project as a ZIP.

## Interaction Principles

The app follows iOS-style interaction conventions: large touch targets, bottom sheets for contextual actions, clear navigation titles, subtle haptics for primary actions, and immediate visual feedback for dragging and selection. Dragging must never require precision; the active drop zone is expanded and the app displays a clear insertion indicator. Destructive actions such as Delete and Reset require confirmation or an undo path.

## Color Choices

The brand uses a deep ink canvas and electric coral accent to communicate creative tooling without looking like a developer IDE. The primary accent is **#FF6B5E**, used for selection handles, primary buttons, and active controls. The application background is **#F6F7F9**, surfaces are **#FFFFFF**, primary text is **#17202A**, secondary text is **#667085**, and borders are **#E4E7EC**. A dark editor canvas uses **#111827** with a warm off-white preview surface so imported interfaces remain easy to inspect.

## Typography and Tone

Use a clean system sans-serif hierarchy aligned with iOS conventions. Screen titles are compact and confident, labels are short and action-oriented, and empty states explain what to do next. Avoid developer-centric terms such as DOM, CSS selector, or source tree in the primary UI; use familiar concepts such as blocks, canvas, layers, style, layout, and preview.
