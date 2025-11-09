
# AV Schematic Builder — Starter v5

React + TypeScript + @xyflow/react with:
- Custom equipment node (resizable, inputs left, outputs right).
- Custom cable edge with inline label and routing (bezier/step/straight).
- Double-click metadata dialogs for nodes and edges.
- Templates panel: save selected node as template, drag to canvas to instantiate. Auto-labels `{PREFIX}-{NN}`.
- Connectors panel: add/remove/reorder connectors for selected node with stable port IDs.
- File menu: New/Open/Save/Close using File System Access API with download fallback.
- Export: PNG and SVG. Page-frame overlay with paper, orientation, margins, DPI. PNG export crops to frame.

## Quick start

```bash
pnpm i
pnpm dev
```

## Notes

- Default units: mm with 10 mm grid. Snap converts to px at 96 DPI base.
- Page frame overlays the canvas center. Pan/zoom canvas to position content, then Export PNG to crop to frame.


## Page Frame controls
Use the Toolbar → Page Frame → Settings to set paper size, orientation, margins, and DPI. PNG export crops to the inner frame at chosen DPI.
# avflow
