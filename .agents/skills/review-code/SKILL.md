---
name: review-code
description: >-
  Review and refactor TypeScript code by applying project coding patterns and
  conventions. Use when the user asks for a code review, refactor, or quality
  check on TypeScript files.
---

# Code Review & Refactor

## Quick Reference (For LLMs)

**When to use this doc**: When reviewing or refactoring TypeScript code — pull requests, individual files, or whole modules.

**Key rules**:

- DO: Load and apply all related skills before starting the review
- DO: Provide concrete refactored code, not just suggestions
- DO: Categorize findings by severity
- DON'T: Nitpick formatting that a formatter handles (prettier, eslint --fix)
- DON'T: Suggest changes that alter public API behavior unless explicitly asked

---

## Before You Review

**Load these skills first** — they define the patterns this review enforces:

1. **[typescript-patterns](../typescript-patterns/SKILL.md)** — factory pattern, `type` over `interface`, no `this`

Read each skill file and internalize its rules before analyzing any code.

---

## Review Workflow

### Step 1: Gather context

1. Identify the files to review (from user request, PR diff, or staged changes)
2. Read each file fully
3. Understand the module's purpose and public API

### Step 2: Apply pattern checks

Run through each loaded skill's rules systematically:

**From typescript-patterns:**

| Check | What to look for |
| --- | --- |
| No unnecessary `class` | `class` that doesn't extend `Error` and isn't framework-mandated |
| No `interface` | `interface` that isn't needed for declaration merging |
| No `this` | `this.` usage outside custom error constructors |
| Factory pattern | Stateful modules not using `create()` + companion type |
| Type for props | React components using `interface` for props |
| Arrow components | Components declared as `function` instead of arrow |

### Step 3: Structural analysis

Beyond pattern compliance, check for:

| Category | What to look for |
| --- | --- |
| **Dead code** | Unused exports, unreachable branches, commented-out code |
| **Complexity** | Functions > 30 lines, deeply nested conditionals (> 3 levels), long parameter lists (> 4) |
| **Naming** | Vague names (`data`, `info`, `item`, `handle`), abbreviations not in the allowed list |
| **Error handling** | Swallowed errors (`catch {}`), missing error boundaries, untyped catch |
| **Side effects** | Mutations of function arguments, hidden state changes, uncontrolled global access |
| **Type safety** | `any` casts, non-null assertions (`!`), type assertions (`as`) without justification |
| **Duplication** | Repeated logic that could be extracted into a shared function |

### Step 4: Produce the review

---

## Review Output Format

Structure every review as follows:

```markdown
## Review: `<file or module name>`

### Summary
<1-3 sentences on overall quality and main themes>

### Findings

#### Critical — must fix
- **[pattern-id]** `file:line` — Description of the issue
  <before/after code block>

#### Suggestion — should fix
- **[pattern-id]** `file:line` — Description
  <before/after code block>

#### Nit — optional
- **[pattern-id]** `file:line` — Description

### Refactored Code
<full refactored file or diff when requested>
```

### Pattern IDs

Use these short IDs to tag findings:

| ID | Rule |
| --- | --- |
| `no-class` | Class used where factory pattern applies |
| `no-interface` | Interface used where type alias applies |
| `no-this` | `this` used where closure capture applies |
| `no-factory` | Stateful module missing factory + companion type |
| `dead-code` | Unused or unreachable code |
| `complexity` | Function too long or deeply nested |
| `naming` | Vague or abbreviated names |
| `error-handling` | Missing or swallowed error handling |
| `side-effect` | Unexpected mutation or global state |
| `type-safety` | Unsafe type assertion or `any` |
| `duplication` | Repeated logic |

---

## Refactoring Strategy

When the user asks for a refactor (not just review):

1. **Start with the highest-severity findings** — fix critical issues first
2. **Apply one pattern at a time** — don't mix a class-to-factory refactor with a naming cleanup in the same step
3. **Preserve behavior** — refactors must not change what the public API returns or accepts unless explicitly asked
4. **Show before/after** — always show the original and refactored code side by side

### Class to Factory conversion

This is the most common refactor. Follow these steps:

1. Identify all `private` fields → they become closure variables
2. Identify all `public` methods → they become the returned object's properties
3. Constructor parameters → `create(options)` parameter
4. Remove all `this.` references → use direct variable names
5. Convert methods to arrow functions
6. Add companion type: `type X = ReturnType<typeof X.create>`
7. Verify no `this` remains

### Interface to Type conversion

1. Replace `interface X {` with `type X = {`
2. Replace `extends A, B` with `A & B &`
3. Add closing `};`
4. If the interface used `this` polymorphism, evaluate if a generic type parameter can replace it

---

## Detection Commands

Run these to find violations quickly:

```bash
# Classes (excluding custom errors)
rg "^\s*class\s+" --type ts | rg -v "extends\s+Error"

# Interfaces
rg "^\s*(export\s+)?interface\s+" --type ts

# this keyword
rg "\bthis\." --type ts | rg -v "constructor|super\("

# any casts
rg "\bas\s+any\b|\:\s*any\b" --type ts

# non-null assertions
rg "\w+!" --type ts | rg -v "\.d\.ts"
```

---

## Pre-Review Checklist

- [ ] Loaded all related skill files
- [ ] Read all files under review completely
- [ ] Ran detection commands to identify hotspots
- [ ] Categorized all findings by severity
- [ ] Provided refactored code for critical and suggestion findings
- [ ] Verified refactored code preserves public API behavior
