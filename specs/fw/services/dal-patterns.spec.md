# Framework Spec: Data Access Layer Patterns
**spec-id:** `fw/services/dal-patterns`
**version:** `1.0.0`
**status:** `active`
**layer:** `2`
**owner:** UI Architecture
**last-reviewed:** 2026-03-20
**applies-to:** Angular 19+

---

## 1. Intent

Defines the standard structure for data access services — the layer between stores and HTTP/external data sources. All server communication goes through DAL services. Components and stores never call HttpClient directly.

> **Agent instruction:** Generate a DAL service for every feature that communicates with an API. Components and stores import the DAL service — never HttpClient directly. All request/response types are defined in the service's types file.

---

## 2. Scope

### In scope
- Service file structure
- HttpClient usage patterns
- Request/response typing
- Error handling convention
- Caching pattern

### Out of scope
- Auth token handling → handled by HTTP interceptor (no spec needed)
- State management → `fw/state/signalstore`

---

## 3. File layout

```
[feature]/
└── services/
    ├── [feature].service.ts       ← DAL service
    ├── [feature].service.spec.ts  ← service tests
    └── [feature].api-types.ts     ← raw API request/response shapes
```

---

## 4. Service structure

```typescript
// [feature].service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { [Feature], [Feature]Response, [Feature]Params } from './[feature].api-types';

@Injectable({ providedIn: 'root' })
export class [Feature]Service {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/[feature]`;

  // ── Read ─────────────────────────────────────────────────────────────────
  getItems(params: [Feature]Params): Observable<[Feature]Response> {
    const httpParams = new HttpParams({ fromObject: { ...params } });
    return this.http
      .get<[Feature]ApiResponse>(`${this.baseUrl}`, { params: httpParams })
      .pipe(map(this.mapResponse));
  }

  getById(id: string): Observable<[Feature]> {
    return this.http
      .get<[Feature]ApiItem>(`${this.baseUrl}/${id}`)
      .pipe(map(this.mapItem));
  }

  // ── Mutations ────────────────────────────────────────────────────────────
  create(payload: Create[Feature]Payload): Observable<[Feature]> {
    return this.http
      .post<[Feature]ApiItem>(`${this.baseUrl}`, payload)
      .pipe(map(this.mapItem));
  }

  update(id: string, payload: Update[Feature]Payload): Observable<[Feature]> {
    return this.http
      .patch<[Feature]ApiItem>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(this.mapItem));
  }

  // ── Mapping (private) ─────────────────────────────────────────────────────
  // Keep API shape separate from domain shape.
  // Map in the service — never in components or stores.
  private mapResponse = (res: [Feature]ApiResponse): [Feature]Response => ({
    items:      res.data.map(this.mapItem),
    totalCount: res.meta.totalCount,
  });

  private mapItem = (item: [Feature]ApiItem): [Feature] => ({
    id:          item.id,
    // ... map fields
  });
}
```

---

## 5. Error handling

Error handling lives in the store (`tapResponse`), not the service. Services propagate errors — they do not swallow them.

```typescript
// ✓ Service propagates
getItems(params): Observable<[Feature]Response> {
  return this.http.get<...>(url).pipe(map(this.mapResponse));
  // No catchError here — let the store handle it
}

// ✗ Never swallow errors in the service
getItems(params): Observable<[Feature]Response> {
  return this.http.get<...>(url).pipe(
    catchError(() => of({ items: [], totalCount: 0 }))  // wrong
  );
}
```

---

## 6. Agent checklist

- [ ] Service uses `inject(HttpClient)` — not constructor injection
- [ ] `baseUrl` uses `environment.apiBaseUrl` — no hardcoded URLs
- [ ] API response types are in `.api-types.ts` — not inline
- [ ] Mapping is in the service — not in stores or components
- [ ] No `catchError` in service methods — error handling in store

---

## 7. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial | UI Architecture |

---

## 8. Related Specs

- `fw/state/signalstore` — consumes DAL services
- `fw/testing/standards` — service testing requirements
