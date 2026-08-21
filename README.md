# Maximum Workspace

Implementation of the ten-pass **Maximum Workspace** product/design/engineering specification in `docs/0000.md` through `docs/0009.md`.

The product is a desktop-first, domain-neutral professional workstation rather than a marketing site, dashboard landing page, or disconnected CRUD application. The implementation keeps the specification's major contracts explicit: persistent shell geometry, stable Resource identity, Views as representations, command-driven intent, serializable workspace state, independent panel visibility, offline/local draft preservation, background Jobs, theme/density switching, keyboard operation, and bounded overlays.

## Run

Requires Node.js 20+ and has no runtime package dependencies.

```bash
npm run dev
```

Open `http://127.0.0.1:4173`.

## Verify

```bash
npm run check
```

This runs Node's built-in test runner and creates a deployable static build in `dist/`.

## Current implementation slice

- Persistent Global Bar, Activity Rail, Primary Sidebar, Workspace Header, Breadcrumb Bar, recursive-ready Editor Groups, Inspector, Bottom Panel, Status Bar, and Overlay Layer
- Maximum, Focus, Research, Development, Review, and Zen workspace presets
- Semantic dark/light theme tokens and Compact/Default/Comfortable density modes
- Resizable Sidebar, editor split, Inspector, and Bottom Panel with persisted user sizes
- Activity Rail module switching that preserves open Resources
- Stable Resource IDs and module/resource fixtures
- Multi-tab editor groups with close, activate, drag-to-move between groups, and split toggle
- Document editor with local draft preservation and `Ctrl/Cmd+S`
- Dense Table View, Task View, Project View, and Workflow View
- Context-sensitive Inspector tabs
- Activity/Problems/Output/Logs/Terminal utility panel container
- Command registry and `Ctrl/Cmd+K` command palette
- Context menu on Resource rows
- Offline simulation and local draft state
- Background export Job with global status feedback
- Toast feedback and ordered Escape-stack dismissal with modal focus restoration
- Generic selection architecture with single/multiple/range/all-matching modes
- Shared undo/redo service reused by workspace, appearance, permission, and selection commands
- Canonical background-operation lifecycle with retryable Jobs
- Recovery Center for unresolved drafts, unsynced work, failed Jobs, and recoverable errors
- Diagnostics Center with connectivity, sync, Jobs, extensions, workspace, and recent-error summaries
- Recursive editor split-tree layout with vertical/horizontal nested groups and persisted split ratios
- Capability-based permissions plus bounded View/Editor/Field/Action/Command/Inspector/Panel registries
- Extension contribution host with namespaced contributions and atomic rollback
- Responsive desktop degradation rules that preserve workstation semantics
- State, command, editor-layout, permissions, extensions, operations, selection, undo, recovery, diagnostics, and renderer tests

## Architecture

```text
docs/                     authoritative Pass 1–10 specification
src/
├── platform/
│   ├── commands.js        stable user-intent command IDs
│   ├── diagnostics.js     readable platform-health snapshots
│   ├── editor-layout.js   recursive editor split-tree operations
│   ├── errors.js          structured error contract
│   ├── extensions.js      bounded extension contribution host
│   ├── operations.js      canonical operation lifecycle
│   ├── permissions.js     capability-based authorization
│   ├── recovery.js        unresolved recoverable-work selectors
│   ├── registries.js      View/Editor/Field/Action/etc registries
│   ├── resources.js       canonical Resource fixtures and module mapping
│   ├── runtime.js         platform registry bootstrap/resolution
│   ├── selection.js       generic selection model
│   ├── state.js           serializable workspace/application state
│   └── undo.js            shared reversible-operation history
├── ui/                    modular shell/editor/panel/overlay renderers
├── styles/                foundations, workspace, panels, overlays, splits
├── workspace/
│   └── presets.js         canonical workspace configurations
├── main.js                controller, focus, keyboard, Jobs, persistence
└── styles.css             stylesheet composition entrypoint
```

Dependency direction follows the specification:

```text
Design decisions
  → semantic tokens
  → components
  → workspace platform
  → resources / commands / state
  → application experiences
```

The current slice intentionally does **not** invent backend APIs, authentication services, databases, extension runtimes, or network protocols that the supplied frontend specification does not concretely define. Those will be introduced behind the platform contracts as implementation progresses.
