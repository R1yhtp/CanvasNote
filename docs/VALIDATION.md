# CanvasNote 0.1.0 validation

The first public release puts undo/redo in a movable drawing toolbar, supports collapsing controls, and persists bottom/left/right layout preferences independently of project history. Pen settings use a dismissible popover; the eraser includes undoable clearing of the active board. Fresh projects and the bundled starter file are blank.

## Automated checks

50 automated checks passed: 26 core, workspace and service-worker checks; 24 DOM/Canvas integration checks.

- TypeScript checks and Vite production build.
- Core model and file checks: pointer-anchored zoom, rotated bounds, bundled images and Chinese-text file round trips, missing/invalid assets, undo/redo, locked-object deletion, independent pasted groups, stale-save handling, text sizing, and atomic overwrite failure recovery.
- Workspace checks: moving pinch anchors, zoom limits, group selection, large PNG allocation caps, merged initial text-edit history, one-action clear/undo/redo with locked and hidden content, restored image assets after autosave, empty-board no-op behavior, IndexedDB snapshots, ordered writes, project switching, and active-project deletion.
- DOM and actual Canvas renderer integration using jsdom and a native Canvas adapter: blank default interface, pen-popover dismissal and retained drawing style, direct main-toolbar erasing with mouse and simulated touch, one-action clearing with autosaved undo, direct text editing, mouse shape drawing, multi-object resize history, focused tablet text sheet, touch pan/draw/pinch cancellation, Help and appearance, project switching and reopening, and PNG encoding.
- Toolbar checks: dock-only undo/redo, collapse while retaining the drawing tool, keyboard undo when collapsed, position changes without editing history, side-dock popover dismissal, simulated tablet drawing while collapsed, and reopened layout preferences. Preference snapshots and ordered writes preserve project records.
- Service-worker checks: application-cache installation, offline fallback, rejecting sign-in pages, and scoped cache cleanup.

The README interface SVG is a layout illustration, not a browser screenshot or device test.

The DOM tests simulate touch events and pointer media queries. They do not exercise a browser engine's layout, native keyboard, operating-system gestures, install UI, or device hardware.

## Packaging checks

Source export: includes source, lockfile, tests, bilingual documentation, MIT license, third-party notices, and GitHub templates/CI configuration. It excludes hosting metadata, credentials, local data, build output, dependencies, and runtime binaries. The workflow is configured but has not yet been run on GitHub.

Windows runtime package: official Electron win32-x64 runtime with the built app, native bridge, blank starter project, and license files. ZIP integrity, application version and AMD64 executable header are checked during delivery. This does not constitute a Windows launch test.

## Verification limits

No physical Windows, iPad, or Android tablet was available. The managed Sites browser-control capability was unavailable, so real-browser preview and screenshot checks were skipped. Hosted deployment is verified through the publishing service's successful terminal result.

Before a public release, validate iPad Safari text input and home-screen offline use, Android touch/stylus behavior, tablet portrait/landscape layout, Windows native dialogs, and storage limits with real user files. No pressure sensitivity or palm rejection is claimed.
