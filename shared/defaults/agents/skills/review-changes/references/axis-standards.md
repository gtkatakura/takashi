# Axis: Standards

Does the change follow this repository's documented standards, and does its shape hold up?

## Inputs

- The diff command and commit list.
- The standards sources the orchestrator found: `AGENTS.md`, `CONTRIBUTING.md`, `CODING_STANDARDS.md`, `docs/adr/`, `GLOSSARY.md`/`CONTEXT.md`, and the project's own skills for the area (architecture, testing, CI/CD). Read them before the diff.
- When the change touches an area with its own installed review skill (CI workflows, Kubernetes config, agent docs), that skill is a standards source too.

## What to report

1. Every place the diff violates a documented standard. Cite the standard (file and rule). This can be a hard violation.
2. Architecture: boundaries between domain, application, ports, adapters and infrastructure, and the direction of dependencies, as the repository defines them.
3. Tests: assertions that check behavior, not implementation; mocks narrowed to what the code calls and not hiding real behavior; the scenarios a risky path needs. Name the missing test concretely.
4. Any smell from the baseline below. Name it and quote the hunk.

Skip anything a linter or formatter already enforces. A documented repository standard always overrides the baseline: where it endorses something the baseline would flag, drop the smell.

## Smell baseline (Fowler, *Refactoring*, ch. 3)

Always a judgement call, reported as "possible <smell>", never as a hard violation. Each reads *what it is* → *how to fix*.

- **Mysterious Name**: a function, variable or type whose name does not reveal what it does or holds. → Rename it; if no honest name comes, the design is murky.
- **Duplicated Code**: the same logic shape in more than one hunk or file. → Extract the shared shape and call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. → Move it onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together. → Bundle them into one type.
- **Primitive Obsession**: a primitive or string standing in for a domain concept. → Give the concept its own small type.
- **Repeated Switches**: the same `switch`/`if` cascade on the same type recurs. → Polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files. → Gather what changes together into one module.
- **Divergent Change**: one module edited for several unrelated reasons. → Split so each changes for one reason.
- **Speculative Generality**: abstraction, parameters or hooks for needs the spec does not have. → Delete it; inline until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller should not depend on. → Hide the walk behind one method.
- **Middle Man**: a class or function that mostly delegates onward. → Cut it; call the real target.
- **Refused Bequest**: a subclass that ignores or overrides most of what it inherits. → Composition instead of inheritance.

## Output

Findings in the report format of `review-changes`, most severe first, hard violations before judgement calls. At most 400 words.
