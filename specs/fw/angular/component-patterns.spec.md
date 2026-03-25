# Framework Spec: Angular Component Patterns
**spec-id:** `fw/angular/component-patterns`
**version:** `1.0.0`
**status:** `active`
**layer:** `2`
**owner:** UI Architecture
**last-reviewed:** 2026-03-20
**applies-to:** Angular 19+

---

## 1. Intent

This spec defines the structural contract for all Angular components generated in this codebase. It is the first spec an agent reads before any pattern or domain spec. All generated components must conform to this contract regardless of what they render.

> **Agent instruction:** Read this spec before any ds/ or domain/ spec. All structural decisions — file layout, change detection, signal usage, injection patterns — are defined here and take precedence over library-specific guidance.

---

## 2. Scope

### In scope
- Standalone component structure and file layout
- Signal-based reactivity patterns
- Dependency injection
- Lifecycle and cleanup
- Change detection

### Out of scope
- State management (NgRx SignalStore) → `fw/state/signalstore`
- Data access layer → `fw/services/dal-patterns`
- Testing → `fw/testing/standards`
- Visual patterns → `ds/patterns/*`

---

## 3. Component anatomy

### 3.1 Required file layout

```
[feature]/
└── [feature].component.ts       ← component class + template (inline for simple)
└── [feature].component.html     ← template (if complex)
└── [feature].component.scss     ← styles (semantic tokens only)
└── [feature].component.spec.ts  ← unit tests
└── [feature].types.ts           ← interfaces, types, enums for this component
└── [feature].component.stories.ts ← Storybook stories (required for DS components)
```

### 3.2 Required decorator shape

```typescript
@Component({
  selector:          'app-[feature]',
  standalone:        true,
  changeDetection:   ChangeDetectionStrategy.OnPush,
  imports:           [ /* DS components only — no direct Material/CDK imports */ ],
  templateUrl:       './[feature].component.html',
  styleUrl:          './[feature].component.scss',
})
export class [Feature]Component {
  // 1. Injected services (inject() only)
  // 2. Required inputs
  // 3. Optional inputs with defaults
  // 4. Outputs
  // 5. Internal signals
  // 6. Computed signals
  // 7. Effects (sparingly)
  // 8. Public methods
  // 9. Private methods
}
```

---

## 4. Signal patterns

### 4.1 Inputs and outputs

```typescript
// ✓ Always — Angular 19 signals API
id       = input.required<string>();
label    = input<string>('');
items    = input<Item[]>([]);
disabled = input<boolean>(false);

selected = output<Item>();
changed  = output<string>();

// ✗ Never
@Input()  id: string;
@Output() selected = new EventEmitter<Item>();
```

### 4.2 Internal state

```typescript
// ✓ Internal reactive state
private readonly _isOpen   = signal(false);
private readonly _selected = signal<Item | null>(null);

// ✓ Derived state — always computed, never manually synced
readonly displayLabel = computed(() =>
  this._selected()?.label ?? this.label()
);

readonly hasSelection = computed(() => this._selected() !== null);

// ✗ Never maintain derived state manually
// this._displayLabel.set(this._selected()?.label ?? '');  ← wrong
```

### 4.3 Effects

Use sparingly. Effects are for side effects that can't be expressed as computed signals — logging, external DOM manipulation, analytics. Never use effects to sync signals.

```typescript
// ✓ Legitimate effect use
private readonly logEffect = effect(() => {
  analytics.track('item-selected', { id: this._selected()?.id });
});

// ✗ Never sync signals with effects
private readonly syncEffect = effect(() => {
  this._displayLabel.set(this._selected()?.label ?? '');  // use computed instead
});
```

---

## 5. Dependency injection

```typescript
// ✓ Always — inject() function
private readonly dealService   = inject(DealService);
private readonly destroyRef    = inject(DestroyRef);
private readonly router        = inject(Router);

// ✗ Never — constructor injection
constructor(private dealService: DealService) {}
```

---

## 6. Subscriptions and cleanup

```typescript
// ✓ Always — takeUntilDestroyed with inject pattern
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

private readonly destroyRef = inject(DestroyRef);

ngOnInit() {
  this.dealService.deals$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(deals => this._deals.set(deals));
}

// ✓ Alternative — toSignal (preferred when possible)
readonly deals = toSignal(this.dealService.deals$, { initialValue: [] });

// ✗ Never — manual unsubscribe
private sub: Subscription;
ngOnDestroy() { this.sub.unsubscribe(); }
```

---

## 7. Template conventions

```html
<!-- ✓ Use @if / @for / @switch (Angular 17+ control flow) -->
@if (isLoading()) {
  <ds-loading-spinner />
} @else if (items().length === 0) {
  <ds-empty-state [title]="emptyTitle()" />
} @else {
  @for (item of items(); track item.id) {
    <app-item-card [item]="item" (selected)="onSelect($event)" />
  }
}

<!-- ✗ Never — structural directives -->
<div *ngIf="isLoading">...</div>
<div *ngFor="let item of items">...</div>
```

---

## 8. Import rules

```typescript
// ✓ DS components — always via DS package
import { DsButtonComponent }      from '@company/ds/actions';
import { DsCardComponent }        from '@company/ds/layout';
import { DsInputComponent }       from '@company/ds/forms';

// ✗ Never — direct Material imports in feature components
import { MatButtonModule }        from '@angular/material/button';
import { MatCardModule }          from '@angular/material/card';

// ✓ Angular CDK — only if no DS equivalent exists, document why
import { CdkTrapFocus }          from '@angular/cdk/a11y'; // no DS equivalent
```

---

## 9. Accessibility

- Every interactive component must have a meaningful `aria-label` or `aria-labelledby`
- Focus management: use `cdkTrapFocus` for modals and overlays
- Color alone must never convey state — pair with icon or text
- All `@for` loops rendering interactive items must `track` by stable id

---

## 10. Agent checklist

> Verify before outputting any component:

- [ ] Standalone component with `ChangeDetectionStrategy.OnPush`
- [ ] `input()` / `output()` — no `@Input` / `@Output` decorators
- [ ] `inject()` — no constructor injection
- [ ] `takeUntilDestroyed()` or `toSignal()` for all subscriptions
- [ ] `@if` / `@for` — no structural directives (`*ngIf`, `*ngFor`)
- [ ] Derived state uses `computed()` — not manually synced signals
- [ ] No direct Material/CDK imports — DS components only
- [ ] File layout matches §3.1

---

## 11. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial | UI Architecture |

---

## 12. Related Specs

- `fw/state/signalstore` — NgRx SignalStore patterns
- `fw/services/dal-patterns` — data access layer
- `fw/testing/standards` — testing requirements
- `ds/tokens/semantic` — token adapter
