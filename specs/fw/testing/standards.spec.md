# Framework Spec: Testing Standards
**spec-id:** `fw/testing/standards`
**version:** `1.0.0`
**status:** `active`
**layer:** `2`
**owner:** UI Architecture
**last-reviewed:** 2026-03-20
**applies-to:** Angular 19+, Jest, Angular Testing Library

---

## 1. Intent

Defines the minimum required test coverage and testing patterns for all generated components, stores, and services. Tests are not optional — they are part of the definition of done.

> **Agent instruction:** Generate a spec file for every component, store, and service you create. The spec file must cover all items in the agent checklist below. Do not generate placeholder/empty test files.

---

## 2. Scope

### In scope
- Unit test patterns for Angular 19 standalone components, services, and stores
- Integration test patterns for component + store interaction
- Required test coverage thresholds by file type
- Mock data and test fixture conventions
- Angular Testing Library patterns (preferred over TestBed for component tests)

### Out of scope
- E2E / Playwright tests → `fw/testing/e2e-standards` (reserved)
- Visual regression tests → no spec yet
- API contract / integration tests → backend testing standards (not in spec framework)
- Performance benchmarks → no spec yet

---

## 3. Required coverage by file type

| File type | Minimum required tests |
|---|---|
| Component | Renders, input/output contract, loading state, empty state, user interactions |
| Store | Initial state, each method (success + error paths), computed values |
| Service | Each public method with mocked HttpClient |
| Composition spec component | Persona-specific columns visible, restricted columns absent |

---

## 4. Component test pattern

```typescript
// [feature].component.spec.ts
import { render, screen, fireEvent } from '@testing-library/angular';
import { [Feature]Component } from './[feature].component';

describe('[Feature]Component', () => {

  // ── Rendering ─────────────────────────────────────────────────────────
  it('renders without errors', async () => {
    await render([Feature]Component, {
      inputs: { /* required inputs */ }
    });
    expect(screen.getByRole('...')).toBeTruthy();
  });

  // ── Loading state (required) ──────────────────────────────────────────
  it('shows loading overlay when loading input is true', async () => {
    await render([Feature]Component, { inputs: { loading: true } });
    expect(screen.getByRole('status')).toBeTruthy();
  });

  // ── Empty state (required) ────────────────────────────────────────────
  it('shows empty state when data is empty', async () => {
    await render([Feature]Component, { inputs: { items: [] } });
    expect(screen.getByText(/no results/i)).toBeTruthy();
  });

  // ── Input contract ─────────────────────────────────────────────────────
  it('renders items when provided', async () => {
    const items = [{ id: '1', name: 'Test' }];
    await render([Feature]Component, { inputs: { items } });
    expect(screen.getByText('Test')).toBeTruthy();
  });

  // ── Output contract ────────────────────────────────────────────────────
  it('emits rowAction when action is triggered', async () => {
    const onRowAction = jest.fn();
    await render([Feature]Component, {
      inputs:  { items: [mockItem] },
      outputs: { rowAction: onRowAction },
    });
    fireEvent.click(screen.getByRole('button', { name: /view/i }));
    expect(onRowAction).toHaveBeenCalledWith({ action: 'view', row: mockItem });
  });
});
```

---

## 5. Store test pattern

```typescript
// [feature].store.spec.ts
import { TestBed }      from '@angular/core/testing';
import { [Feature]Store } from './[feature].store';
import { [Feature]Service } from '../services/[feature].service';

describe('[Feature]Store', () => {
  let store: InstanceType<typeof [Feature]Store>;
  let service: jest.Mocked<[Feature]Service>;

  beforeEach(() => {
    service = { getItems: jest.fn() } as any;
    TestBed.configureTestingModule({
      providers: [
        [Feature]Store,
        { provide: [Feature]Service, useValue: service },
      ]
    });
    store = TestBed.inject([Feature]Store);
  });

  it('has correct initial state', () => {
    expect(store.requestState()).toBe('idle');
    expect(store.items()).toEqual([]);
    expect(store.isLoading()).toBe(false);
  });

  it('sets loading state during fetch', fakeAsync(() => {
    service.getItems.mockReturnValue(NEVER);
    store.loadItems({ page: 1, size: 25 });
    expect(store.isLoading()).toBe(true);
  }));

  it('populates items on success', fakeAsync(() => {
    const mockResponse = { items: [mockItem], totalCount: 1 };
    service.getItems.mockReturnValue(of(mockResponse));
    store.loadItems({ page: 1, size: 25 });
    tick();
    expect(store.items()).toEqual([mockItem]);
    expect(store.requestState()).toBe('success');
  }));

  it('sets error state on failure', fakeAsync(() => {
    service.getItems.mockReturnValue(throwError(() => new Error('API error')));
    store.loadItems({ page: 1, size: 25 });
    tick();
    expect(store.requestState()).toBe('error');
    expect(store.error()).toBe('API error');
  }));
});
```

---

## 6. Persona/composition test requirements

Components generated from a domain composition spec must include column visibility tests:

```typescript
// Required for any domain composition component
describe('column visibility — [persona]', () => {
  it('shows required columns', () => {
    // Assert columns defined in composition spec §1 are present
  });

  it('does not show restricted columns', () => {
    // Assert columns not in composition spec are absent
  });

  it('applies correct entitlement-gated columns', () => {
    // Assert MNPI columns absent at restricted entitlement level
  });
});
```

---

## 7. Agent checklist

- [ ] Spec file exists for every generated component, store, and service
- [ ] Renders test present
- [ ] Loading state test present (components)
- [ ] Empty state test present (components)
- [ ] All outputs tested
- [ ] Store: initial state, success path, error path tested
- [ ] Persona components: column visibility tests present

---

## 7. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial | UI Architecture |
