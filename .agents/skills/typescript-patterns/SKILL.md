---
name: typescript-patterns
description: >-
  Enforces TypeScript code patterns: factory/companion-object pattern instead of
  classes, type aliases over interfaces, and no `this` keyword. Use when writing
  new TypeScript code, creating services/managers/stateful modules, defining
  types, or reviewing TypeScript for pattern compliance.
---

# TypeScript Patterns

## Quick Reference (For LLMs)

**When to use this doc**: When writing any TypeScript code — creating modules, defining types, or reviewing existing code.

**Key rules**:

- DO: Use closure-based factory pattern with companion object for stateful modules
- DO: Use `type` for all type definitions by default
- DO: Derive instance types with `ReturnType<typeof X.create>`
- DO: Use arrow functions to avoid `this` binding
- DON'T: Use `class` (except custom errors extending `Error`)
- DON'T: Use `interface` (except for declaration merging / third-party extensibility)
- DON'T: Use `this` (except when there is literally no alternative)

---

## Type Aliases over Interfaces

**Always prefer `type` over `interface`.**

### Why

Based on the practical analysis from the TypeScript community ([reference](https://github.com/peerigon/eslint-config-peerigon/issues/64)):

1. **`type` is a superset** — you can express everything `interface` does and more (unions, mapped types, conditional types, tuples, utility type composition)
2. **Consistency** — it's impossible to have a large project without `type`, but entirely possible without `interface`. One construct for all type definitions eliminates decision fatigue
3. **Composition via `&`** — intersection types are more flexible than `extends` chains
4. **No accidental declaration merging** — two `type` aliases with the same name produce a compile error (fail-fast), whereas two `interface` declarations silently merge
5. **Utility type ergonomics** — `Readonly<T>`, `Pick<T, K>`, `Omit<T, K>` return type aliases; wrapping an interface in a utility type already produces a type alias anyway

### GOOD

```typescript
type UserProps = {
  name: string;
  email: string;
};

type ReadonlyUser = Readonly<UserProps>;

type Result = Success | Failure;

type EventMap = {
  [K in EventName]: EventPayload<K>;
};
```

### BAD

```typescript
interface UserProps {
  name: string;
  email: string;
}
```

### Allowed exceptions for `interface`

| Exception | Reason |
| --- | --- |
| Declaration merging for third-party lib extensibility | The consumer of your library needs to augment your types |
| Explicit `extends` contract in a public API | Rare — when you want compile-time enforcement of structural subtyping hierarchy |

When using an exception, add a comment explaining why `interface` is necessary.

---

## Factory + Companion Object Pattern

Use this closure-based factory pattern **instead of classes** for services, managers, and any stateful module.

### Pattern structure

```typescript
export type MyModule = ReturnType<typeof MyModule.create>;

export type MyModuleOptions = {
  dependency: SomeDep;
};

export const MyModule = {
  create(options: MyModuleOptions) {
    // Private state — captured by closure, not exposed
    let internalState = initialValue;

    const doInternalWork = () => {
      /* uses internalState */
    };

    // Public API
    const publicMethod = () => {
      doInternalWork();
      return internalState;
    };

    return { publicMethod };
  },
};
```

### How the companion type works

TypeScript allows a `const` and a `type` to share the same name. The compiler disambiguates by context:

| Context | Resolves to | Example |
| --- | --- | --- |
| Value position | The `const` (factory namespace) | `MyModule.create(...)` |
| Type position | The `type` (instance type) | `const x: MyModule = ...` |

### Why not classes

1. **No `this` binding issues** — arrow functions capture variables by closure
2. **True encapsulation** — private state is unreachable (not just `private` keyword, which is only compile-time)
3. **Simpler testing** — no `new`, no prototype chain, just call `.create()` and assert on the returned object
4. **Tree-shakeable** — bundlers can eliminate unused factory methods

### Allowed exceptions for `class`

| Exception | Reason |
| --- | --- |
| Custom errors extending `Error` | `instanceof` checks require prototype chain; `class AppError extends Error {}` is idiomatic |
| Framework/library requirement | Some frameworks (e.g., NestJS providers, TypeORM entities) mandate classes |

### BAD — class

```typescript
class WorkerManager {
  private workers: Worker[] = [];

  connect(payload: ConnectPayload) {
    this.workers.forEach((w) => w.disconnect());
  }
}
```

### GOOD — factory

```typescript
export type WorkerManager = ReturnType<typeof WorkerManager.create>;

export const WorkerManager = {
  create() {
    const workers: Worker[] = [];

    const connect = (payload: ConnectPayload) => {
      workers.forEach((w) => w.disconnect());
    };

    return { connect };
  },
};
```

### File naming

Name the file after the module — PascalCase, matching the `const` name:

| Export | File name |
| --- | --- |
| `WorkerManager` | `WorkerManager.ts` |
| `NotificationService` | `NotificationService.ts` |

### Conventions table

| Element | Convention | Example |
| --- | --- | --- |
| Factory namespace | PascalCase noun | `NotificationService` |
| `create` options | `{Name}Options` type | `NotificationServiceOptions` |
| Instance type | Same name as namespace | `type X = ReturnType<typeof X.create>` |
| Export order | Type first, then const | `export type X = ...; export const X = { ... };` |
| Return shape | Explicit object literal | `return { start, stop };` |

---

## No `this` Keyword

**Avoid `this` entirely.** Use closure captures and arrow functions instead.

### Why

1. **`this` is context-dependent** — its value changes based on how a function is called, not where it is defined
2. **Common source of bugs** — passing a method as a callback loses `this` binding
3. **Unnecessary with factory pattern** — closures give you lexical scoping for free

### GOOD

```typescript
const create = () => {
  const items: string[] = [];

  const add = (item: string) => {
    items.push(item);
  };

  const getAll = () => [...items];

  return { add, getAll };
};
```

### BAD

```typescript
class Store {
  items: string[] = [];

  add(item: string) {
    this.items.push(item);
  }

  getAll() {
    return [...this.items];
  }
}
```

### Allowed exceptions for `this`

| Exception | Reason |
| --- | --- |
| Custom error classes | `class` requires `this` in the constructor (`super()` / property assignment) |
| Framework-mandated class methods | Some decorators/lifecycle hooks only work with `this` |
| Fluent/builder APIs where no closure alternative exists | Extremely rare — document why |

When using an exception, ensure there is **no closure-based alternative** and add a comment explaining the necessity.

---

## Components (React / UI)

Components are **functions**, not classes and not factories:

```typescript
type UserCardProps = {
  name: string;
  avatar: string;
};

export const UserCard = ({ name, avatar }: UserCardProps) => {
  return (
    <div>
      <img src={avatar} alt={name} />
      <span>{name}</span>
    </div>
  );
};
```

- Use `type` for props (not `interface`)
- Use arrow function expressions
- Co-locate the props type with the component

---

## Detection Commands

```bash
# Find class declarations (excluding custom errors)
rg "^\s*class\s+" --type ts | rg -v "extends\s+Error"

# Find interface declarations
rg "^\s*(export\s+)?interface\s+" --type ts

# Find this usage outside of constructors and super calls
rg "\bthis\." --type ts | rg -v "constructor|super\("
```

---

## Pre-Commit Checklist

- [ ] No `class` unless it extends `Error` or is framework-mandated
- [ ] No `interface` unless needed for declaration merging
- [ ] No `this` unless there is no closure-based alternative
- [ ] Factory modules use companion type pattern (`type X = ReturnType<typeof X.create>`)
- [ ] Factory files named in PascalCase matching the export
- [ ] Components are arrow functions with `type` for props
