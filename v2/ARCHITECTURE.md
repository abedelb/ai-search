# Application Architecture

## Overview
This application follows a modular, component-based architecture with clear separation of concerns. Each major feature is organized into its own folder with smaller, focused sub-components.

## Folder Structure

```
src/
├── components/
│   ├── AIAgent/              # AI Chat feature
│   │   ├── index.tsx         # Main component (orchestration only)
│   │   ├── types.ts          # Feature-specific types
│   │   ├── constants.ts      # Feature-specific constants
│   │   ├── useAIChat.ts      # Chat logic hook
│   │   ├── useSlideFeedback.ts # Feedback logic hook
│   │   ├── ChatHeader.tsx    # Header UI
│   │   ├── EmptyChat.tsx     # Empty state UI
│   │   ├── AgentStep.tsx     # Step display UI
│   │   ├── MessageBubble.tsx # Message display UI
│   │   ├── ReferencedSlides.tsx # Slides grid UI
│   │   └── ChatInput.tsx     # Input UI
│   │
│   ├── SlideSearch/          # Slide search feature
│   │   ├── index.tsx         # Main component (orchestration only)
│   │   ├── useSlideSearch.ts # Search logic hook
│   │   ├── useSlideFeedback.ts # Feedback logic hook
│   │   └── SlideGrid.tsx     # Grid display UI
│   │
│   ├── DocumentSearch/       # Document search feature
│   │   ├── index.tsx         # Main component (orchestration only)
│   │   ├── useDocumentSearch.ts # Search logic hook
│   │   ├── useDocumentFeedback.ts # Feedback logic hook
│   │   └── DocumentList.tsx  # List display UI
│   │
│   ├── common/               # Shared components
│   │   ├── SearchHeader.tsx  # Reusable search header
│   │   ├── FeedbackContainer.tsx # Feedback widget wrapper
│   │   └── index.ts          # Exports
│   │
│   └── [other components]    # Single-file components
│
├── ui/                       # Presentational components (NO LOGIC)
│   ├── cards/                # Card components
│   │   ├── SlideCard.tsx     # Slide display card
│   │   ├── DocumentCard.tsx  # Document display card
│   │   └── index.ts          # Exports
│   │
│   ├── widgets/              # Small reusable widgets
│   │   ├── SearchBar.tsx     # Search input
│   │   ├── EmptyState.tsx    # Empty state display
│   │   ├── LoadingSpinner.tsx # Loading indicator
│   │   └── index.ts          # Exports
│   │
│   ├── layout/               # Layout components
│   │   ├── PageContainer.tsx # Page wrapper
│   │   ├── GridContainer.tsx # Responsive grid
│   │   └── index.ts          # Exports
│   │
│   └── index.ts              # Main UI exports
│
├── services/                 # Business logic & API calls
├── types/                    # TypeScript types
└── [other folders]
```

## Design Principles

### 1. Single Responsibility Principle
- Each component has ONE clear purpose
- Logic is separated into custom hooks
- UI is separated into presentational components

### 2. Component Organization

#### Main Components (index.tsx)
- **Purpose**: Orchestration only
- **Contains**: State management, hook calls, prop passing
- **Does NOT contain**: CSS classes, UI rendering logic

#### Custom Hooks (use*.ts)
- **Purpose**: Encapsulate business logic and state
- **Returns**: State, handlers, and computed values
- **Does NOT contain**: JSX or UI logic

#### UI Components (in ui/)
- **Purpose**: Pure presentation
- **Props**: All data and handlers passed in
- **Does NOT contain**: Business logic, API calls, or complex state

#### Feature Sub-components
- **Purpose**: Feature-specific UI pieces
- **Location**: In feature folder if used only there
- **Location**: In common/ if used by multiple features

### 3. Modularity
```
Feature Folder Structure:
├── index.tsx           # Orchestrates everything
├── types.ts            # Feature-specific types (optional)
├── constants.ts        # Feature-specific constants (optional)
├── use[Feature].ts     # Main logic hook
├── use[Aspect].ts      # Secondary logic hooks
└── [UI components].tsx # Feature-specific UI components
```

### 4. Reusability

**UI Components** (`/ui/`)
- Zero business logic
- Fully reusable across features
- Styled with TailwindCSS classes
- Controlled via props

**Common Components** (`/components/common/`)
- Shared across multiple features
- Contains composition of UI components
- Minimal business logic

**Feature Components** (`/components/[Feature]/`)
- Used within single feature only
- Can contain feature-specific logic
- Imports from ui/ and common/

## Component Communication

```
App.tsx
  ↓
Feature/index.tsx (orchestration)
  ↓
├── Custom Hooks (logic)
├── Common Components (shared UI)
└── UI Components (pure presentation)
```

## Benefits

1. **Maintainability**: Changes are localized to specific files
2. **Testability**: Logic and UI can be tested separately
3. **Reusability**: UI components work anywhere
4. **Scalability**: New features follow the same pattern
5. **Readability**: Clear file purpose from structure
6. **Developer Experience**: Easy to find and modify code

## File Naming Conventions

- **Components**: PascalCase (e.g., `SearchHeader.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useSlideSearch.ts`)
- **Types**: PascalCase (e.g., `types.ts`)
- **Constants**: camelCase (e.g., `constants.ts`)
- **Index files**: lowercase (e.g., `index.tsx`, `index.ts`)

## Import Guidelines

1. Always use index files for cleaner imports
2. Import from ui/ for presentational components
3. Import from common/ for shared logic components
4. Keep relative imports shallow (max 2 levels up)

## Adding New Features

1. Create feature folder: `src/components/[FeatureName]/`
2. Create `index.tsx` for orchestration
3. Create custom hooks for logic: `use[FeatureName].ts`
4. Create sub-components for UI pieces
5. Reuse from `ui/` and `common/` where possible
6. Add types to `types.ts` if feature-specific
7. Export from feature's `index.tsx`
