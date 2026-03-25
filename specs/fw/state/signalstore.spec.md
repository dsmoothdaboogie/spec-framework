# Framework Spec: NgRx SignalStore Patterns
**spec-id:** `fw/state/signalstore`
**version:** `1.0.0`
**status:** `active`
**layer:** `2`
**owner:** UI Architecture
**last-reviewed:** 2026-03-20
**applies-to:** Angular 19+, NgRx 18+

---

## 1. Intent

Defines the standard pattern for state management using NgRx SignalStore. All feature state that needs to be shared across components or persisted beyond a component lifecycle must use this pattern.

> **Agent instruction:** Use SignalStore for any state that is shared between two or more components, or that needs to survive navigation. For local component-only state, use component signals per `fw/angular/component-patterns`. Never use BehaviorSubject or plain services with state for shared state.

---

## 2. Scope

### In scope
- Feature store structure and file layout
- State shape conventions
- Loading / error state patterns
- Entity collections
- Store composition

### Out of scope
- Component-local state → `fw/angular/component-patterns` §4
- Server communication → `fw/services/dal-patterns`
- Router state → `fw/angular/component-patterns`

---

## 3. Store file layout

```
[feature]/
└── state/
    ├── [feature].store.ts         ← store definition
    ├── [feature].store.spec.ts    ← store tests
    └── [feature].models.ts        ← state interfaces
```

---

## 4. Standard store shape

Every store follows this shape. The `RequestState` pattern is mandatory for any async operation.

```typescript
// [feature].models.ts
export type RequestState = 'idle' | 'loading' | 'success' | 'error';

export interface [Feature]State {
  // Entity collection
  items:        [Feature][];
  selectedId:   string | null;

  // Async state — always paired together
  requestState: RequestState;
  error:        string | null;

  // Pagination (if server-side)
  totalCount:   number;
  currentPage:  number;
  pageSize:     number;
}

export const initial[Feature]State: [Feature]State = {
  items:        [],
  selectedId:   null,
  requestState: 'idle',
  error:        null,
  totalCount:   0,
  currentPage:  1,
  pageSize:     25,
};
```

---

## 5. Store definition

```typescript
// [feature].store.ts
import { signalStore, withState, withComputed,
         withMethods, patchState } from '@ngrx/signals';
import { inject }  from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap } from 'rxjs';

export const [Feature]Store = signalStore(
  { providedIn: 'root' },   // or component-level: remove this line

  withState(initial[Feature]State),

  withComputed(({ items, selectedId, requestState }) => ({
    // Derived state — always computed
    selectedItem:  computed(() => items().find(i => i.id === selectedId()) ?? null),
    isLoading:     computed(() => requestState() === 'loading'),
    hasError:      computed(() => requestState() === 'error'),
    isEmpty:       computed(() => requestState() === 'success' && items().length === 0),
  })),

  withMethods((store, service = inject([Feature]Service)) => ({

    // ── Async method pattern (always rxMethod) ───────────────────────────────
    loadItems: rxMethod<LoadParams>(
      pipe(
        tap(() => patchState(store, { requestState: 'loading', error: null })),
        switchMap(params =>
          service.getItems(params).pipe(
            tapResponse({
              next:  ({ items, totalCount }) =>
                patchState(store, { items, totalCount, requestState: 'success' }),
              error: (err: Error) =>
                patchState(store, { requestState: 'error', error: err.message }),
            })
          )
        )
      )
    ),

    // ── Sync method pattern ──────────────────────────────────────────────────
    selectItem(id: string): void {
      patchState(store, { selectedId: id });
    },

    clearSelection(): void {
      patchState(store, { selectedId: null });
    },

    setPage(page: number): void {
      patchState(store, { currentPage: page });
    },
  }))
);
```

---

## 6. Consuming a store in a component

```typescript
@Component({ ... })
export class [Feature]TableComponent {
  private readonly store = inject([Feature]Store);

  // ✓ Expose store signals directly — no local copies
  readonly items        = this.store.items;
  readonly isLoading    = this.store.isLoading;
  readonly isEmpty      = this.store.isEmpty;
  readonly selectedItem = this.store.selectedItem;

  // ✓ Initialise on load
  ngOnInit() {
    this.store.loadItems({ page: 1, size: 25 });
  }

  onRowSelect(item: [Feature]) {
    this.store.selectItem(item.id);
  }

  onPageChange(event: PageChangeEvent) {
    this.store.setPage(event.page);
    this.store.loadItems({ page: event.page, size: event.pageSize });
  }
}
```

---

## 7. Store scope

| Scenario | Scope |
|---|---|
| Shared across multiple routes | `providedIn: 'root'` |
| Scoped to a feature module/route | Provide in route config |
| Scoped to a single component tree | Provide in component `providers: []` |

---

## 8. Agent checklist

- [ ] State shape follows §4 — `RequestState` + `error` always paired
- [ ] Async operations use `rxMethod` + `tapResponse` per §5
- [ ] Derived state uses `withComputed` — not duplicated in state
- [ ] Components consume store signals directly — no local copies per §6
- [ ] Store scope matches usage pattern per §7

---

## 9. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial | UI Architecture |

---

## 10. Related Specs

- `fw/angular/component-patterns` — component structure
- `fw/services/dal-patterns` — service layer
