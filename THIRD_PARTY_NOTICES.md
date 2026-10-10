# Third-party components

CanvasNote's application source is MIT licensed. Bundled components keep their original licenses. License texts are collected under `third-party-licenses/` in source and desktop packages.

| Component | License | Purpose |
|---|---|---|
| React / React DOM | MIT | User interface |
| Konva / React Konva | MIT | Editable canvas |
| Zustand | MIT | Editor state |
| Lucide | ISC | Icons |
| JSZip | MIT or GPL-3.0-or-later, used under MIT | Project container |
| PDF.js | Apache-2.0 | Local PDF page import |
| Electron | MIT | Windows desktop runtime |
| Tauri | MIT or Apache-2.0 | Optional native source project |

Electron's original license is preserved as `ELECTRON-LICENSE.txt`, and Chromium's runtime notices remain in `LICENSES.chromium.html`. Node runtime and Chromium notices shipped with Electron are retained. Build tools and their dependencies are listed in `package-lock.json`; consult their package licenses when modifying or redistributing them. No external web fonts, generated images, or stock imagery are needed to run the application.
