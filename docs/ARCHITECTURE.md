# Architecture

React + TypeScript provides the application shell, tools, dialogs, layers and properties. React Konva renders board items in world coordinates, with one camera mapping `screen = world * zoom + translation`. Zoom preserves the point under the pointer. Objects use local dimensions, rotation, and local stroke points.

Zustand holds project, active board, selection, tool and undo snapshots. Drag and multi-object transform operations commit one history entry at their end. A new note and its initial text edit share one history entry. Selection is transient. Toolbar position and collapse state are workspace preferences, separate from scene data and undo history. A save revision can clear the dirty flag only if no newer edit occurred while saving. Camera motion uses immutable shallow board updates, without cloning all objects on every pointer move.

The file codec stores a versioned `scene.json` with asset references, plus PNG/JPEG/WebP assets in a ZIP container. Unreferenced assets are pruned across all boards before saving; background assets are retained. Opening validates format, finite geometry, unique object IDs, camera ranges, asset paths and size limits before accepting a scene.

IndexedDB version 2 contains full projects, lightweight gallery summaries, the active-project preference, and a legacy recovery snapshot. These four records update in one transaction. Writes are serialized and capture their snapshot before entering the queue. Workspace preferences share the serialized write queue and have their own transaction in the existing preferences store; deleting a project does not delete the layout preference. Project switches await the previous project's local save. Old recovery records migrate when first opened. Native file exports create a same-directory temporary file, flush it, preserve an existing `.bak`, and rename the completed temporary file into place.

Electron's renderer uses a sandboxed window with context isolation. The preload exposes only project open/save, PNG export and dirty-state calls. File paths come from native user dialogs. The portable application has no network, login or cloud dependency. The optional Tauri source implements analogous file commands through Rust and native dialogs.

Single-finger selection-mode drags pan empty space or move objects. Adding a second finger cancels pending draft ink and object drags before pinching. The remaining finger is ignored until all contacts are released. Touch cancellation discards draft ink. Tablet text editing uses a modal textarea focused in the originating touch event so the native keyboard can open.

PDF.js embeds its worker as a local Blob module. PNG export allocates its independent Konva stage only after applying dimension/pixel caps, then transforms cloned scene nodes into that output. Dynamic theme effects and wallpaper remain in the view.

The HTTPS app includes a manifest and service worker. The worker caches the app shell, falls back to it offline, and rejects redirected sign-in pages when populating the editor cache. It does not upload projects or provide cross-device synchronization. Windows loads the same editor locally without the web host's account dependency.
