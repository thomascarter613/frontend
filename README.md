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
- Toast feedback and Escape-stack overlay dismissal
- Responsive desktop degradation rules that preserve workstation semantics
- State, command, and renderer smoke tests

## Architecture

```text
docs/                     authoritative Pass 1–10 specification
src/
├── platform/
│   ├── commands.js        stable command IDs and command search
│   ├── resources.js       canonical Resource fixtures and module mapping
│   └── state.js           workspace/resource/draft/job/persistence state
├── ui/
│   ├── icons.js           reusable semantic SVG icons
│   └── templates.js       compositional UI renderer
├── workspace/
│   └── presets.js         canonical workspace configurations
├── main.js                application controller + interactions
└── styles.css             semantic tokens + component/workspace styling
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
