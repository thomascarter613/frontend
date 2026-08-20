# Maximum Workspace

Implementation of the ten-pass **Maximum Workspace** product/design/engineering specification in `docs/0000.md` through `docs/0009.md`.

The product is a desktop-first, domain-neutral professional workstation. The implementation keeps the specification's major contracts explicit: persistent shell geometry, stable Resource identity, Views as representations, command-driven intent, recursive editor layout, serializable workspace state, capability-based permissions, bounded extension contributions, structured failure state, offline/local draft preservation, background Jobs, theme/density switching, keyboard operation, and bounded overlays.

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

This discovers all Node-native contract tests and creates a deployable static build in `dist/`.

## Implemented platform concepts

- Persistent Global Bar, Activity Rail, Primary Sidebar, Workspace Header, Breadcrumb Bar, Inspector, Bottom Panel, Status Bar, and Overlay Layer
- Maximum, Focus, Research, Development, Review, and Zen workspace presets
- Semantic dark/light theme tokens and Compact/Default/Comfortable density modes
- Recursive editor split-tree supporting nested vertical/horizontal splits and 3+ groups
- Split-ratio persistence plus v1 → v2 workspace-state migration
- Stable Resource IDs and canonical View resolution through a View registry
- Registries for Views, Editors, Fields, Actions, Commands, Inspector sections, and Panels
- Bounded Extension host with namespaced contributions, capability checks, atomic rollback, and uninstall cleanup
- Capability-based permissions rather than hard-coded role assumptions
- Permission revocation that makes editors read-only while preserving unsaved drafts
- Structured platform error/result contract with recovery/resource/operation context
- Command registry reused by keyboard shortcuts and Command Palette, with capability gating
- Multi-tab editor groups with close, activate, drag-to-move, recursive split creation, split resizing, and group collapse
- Offline simulation and local draft preservation
- Background Jobs with global status feedback
- Context-sensitive Inspector, utility panel, context menus, settings, and toasts
- Responsive desktop degradation that preserves workstation semantics
- Modular UI renderer and CSS boundaries so platform systems do not depend on feature surfaces

## Architecture

```text
docs/                         authoritative Pass 1–10 specification
src/
├── platform/
│   ├── commands.js           stable command IDs + capabilities
│   ├── editor-layout.js      recursive split-tree model
│   ├── errors.js             structured platform errors/results
│   ├── extensions.js         bounded extension host
│   ├── permissions.js        capability policy/evaluation
│   ├── registries.js         contribution registries
│   ├── resources.js          canonical Resource fixtures
│   ├── runtime.js            core registry/runtime composition
│   └── state.js              serializable platform/workspace state + migration
├── ui/
│   ├── editor.js             editor tree + tab composition
│   ├── html.js               output escaping
│   ├── icons.js              reusable semantic SVG icons
│   ├── overlays.js           Command Palette/settings/context/toasts
│   ├── panels.js             Inspector/Bottom Panel/Status Bar
│   ├── resource-views.js     registered Resource representations
│   ├── shell.js              persistent shell/navigation chrome
│   └── templates.js          top-level UI composition
├── styles/
│   ├── foundations.css
│   ├── workspace.css
│   ├── panels.css
│   ├── overlays.css
│   └── editor-splits.css
├── workspace/
│   └── presets.js
├── main.js                   controller + interaction wiring
└── styles.css                modular stylesheet entrypoint
```

Dependency direction follows the specification:

```text
Design decisions
  → semantic tokens
  → components
  → workspace platform
  → resources / commands / registries / permissions / state
  → feature surfaces
  → extensions through bounded contribution points
```

The implementation intentionally does **not** invent backend APIs, authentication services, databases, or network protocols that the supplied frontend specification does not concretely define. Those can be introduced later behind these platform contracts.
