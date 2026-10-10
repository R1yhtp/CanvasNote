# CanvasNote

[中文](README.zh-CN.md)

A local canvas notebook for computers and tablets. Collect study materials, write notes, sketch, and arrange ideas on an infinite canvas.

![CanvasNote interface layout illustration](docs/assets/interface.svg)

The illustration shows the default layout. New projects open on a blank canvas.

## Use

**Windows:** extract the entire portable ZIP and run `CanvasNote.exe`. Keep the files together. The package includes its Windows x64 runtime; Node.js is not required.

**Web and tablets:** serve the production `dist/` folder on HTTPS. Open it in a browser on your computer or tablet. The web app includes a home-screen manifest and an offline cache after the first successful load.

Usage instructions and keyboard shortcuts are in **Help**. Use **Menu → Toolbar** to place the toolbar at the bottom, left, or right. The double arrow collapses it; tap the remaining arrow to expand it. Drawing and keyboard shortcuts keep working while it is collapsed.

## Features

- Infinite canvas, pen, highlighter, eraser, sticky notes, text, shapes, and images.
- Single-page PDF import, selection, grouping, ordering, locking, and layers.
- Undo and redo in the drawing toolbar; one-action clear with undo.
- Local automatic saving and multiple projects.
- Editable `.canvasnote` files with bundled assets, plus PNG export.
- Light, dark, aurora, and electronic appearance; custom background images.
- Presentation regions and presentation mode.
- Toolbar position and collapsed state remembered on the device.

Notes and assets are processed locally. Web and desktop storage are separate; transfer projects by exporting and importing a `.canvasnote` file. Export important work for backup.

## Development

Node.js 22 or later is required.

```sh
npm ci
npm run dev
npm test
npm run build
```

Build output is in `dist/`.

```sh
npm run package:windows
npm run package:source
```

Release ZIPs are written to `release/`. Windows packaging downloads the official Electron runtime. To use an existing trusted extracted runtime, set `CANVASNOTE_RUNTIME_DIR` to its folder.

For desktop development, install Electron with `npm install --no-save electron@44.7.0`, then run `npm run desktop`.

The editor uses React, TypeScript, React Konva, Zustand, JSZip, and PDF.js. `desktop/` supplies the Electron bridge used in the portable package. The additional `src-tauri/` project is experimental and has not been compiled or validated.

## Current scope

The eraser removes whole objects. PDF pages are imported as images. Pressure sensitivity, palm rejection, full PDF editing, cloud sync, and collaboration are not included.

Project files are limited to 100 MB, individual imported images to 30 MB, and image dimensions to 4096 px on the longest edge. PNG allocation is capped at 8192 px per edge and 32 million pixels. PNG exports do not include wallpaper or animated interface effects.

50 automated checks cover the model, files, storage, gestures, DOM, and native Canvas integration. Browser layout and physical Windows, iPad, and Android devices still need release acceptance testing. See [validation](docs/VALIDATION.md), [architecture](docs/ARCHITECTURE.md), and [release guide](docs/RELEASE.md).

## License

[MIT](LICENSE). Third-party components retain their own licenses; see [notices](THIRD_PARTY_NOTICES.md).
