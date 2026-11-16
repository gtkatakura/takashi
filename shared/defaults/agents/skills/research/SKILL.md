---
name: research
description: Run a research study that supports one decision — owner intake, a written charter with premises, a blind inventory, a wide scout, then rounds of independent seats, a separate judge, spikes and an evidence audit until stop criteria hold. Use for "pesquisa X", "compara opções para Y", "qual a melhor arquitetura/ferramenta/lib para Z", market or competitor mapping, or any question whose answer needs many sources and should survive review. A narrow factual question takes the short path.
metadata:
  kind: workflow
  source: versatile-sh/agents-control-research (docs/methodology.md, docs/agents.md, docs/intake.md)
---

# Research

One study supports one owner decision. A study that cannot name the decision it supports does not start. A single pass is a draft, never a result.

## Pick the path

- **Short path**: a narrow question ("does X have SCIM?", "which licence is Y?"). Recover what is known, check two independent sources, answer with the proof level of each claim. Skip to the report.
- **Full study**: comparing options, mapping a market, choosing an architecture. Run every step below.

## Steps

1. **Intake.** Read what already exists (repo, notes, earlier studies) and ask only what it does not answer: `references/intake.md`, up to four questions per batch, each with a recommended answer. Record answers with the date.
2. **Recover.** List what is already closed on this topic, with date and commit or link, so it is not reopened.
3. **Charter.** Write `CHARTER.md` (`references/intake.md` template): decision, judged by whom, unit of analysis and map axes, scope, floors, premises (each with class, who declared it, evidence or HYPOTHESIS, and what would overturn it), proof required, sources, seats, budget, stop criteria. **The owner releases it.**
4. **Frame attack.** One agent attacks the question and premises before any answer exists. BLOCKING objections go back to the owner.
5. **Blind inventory.** List the units from the outside in (what the user of the result would name) and the inside out (code, docs), by agents that have seen no proposal.
6. **Scout.** One macro table: many candidates, one line and one source each, licence recorded. **The owner picks what to deepen.**
7. **Rounds** (`references/roles.md`): seats write complete proposals (round 1 blind; later rounds read all, object, rewrite) → judge decides each objection and names spikes → experimenter runs them on an isolated copy → auditor reopens a seeded sample and reports an error rate. Release rounds in tranches of three; each tranche ends in a continuation note and an owner decision. Ceiling: eight rounds.
8. **Synthesis.** The map or matrix (every cell: value, proof level, evidence), one card per unit, owner decisions with recommendations, deferred items each with the event that reopens it, defects found on the way, and "what this does not claim". A final auditor who is not the judge checks it; a closing pass answers that audit.
9. **Close.** Write what changed and what was overturned, spend per agent with its model, and a five-line retro. Amend this method when the retro says so.

## Rules

- **Proof level on every claim.** Read (`path:line` at a pinned commit, or URL + access date), specified (spec, version, section), run (command, result, commit, date). Anything else is HYPOTHESIS and never enters as fact. "Run" counts only for the part of the claim the run actually executed, in the kind of setup the claim describes.
- **Market claims** carry URL, access date, confidence (high: official docs, code or a local test; medium: a detailed review or thread; low: marketing or rumor) and the source's bias. A direct competitor needs three independent sources; the vendor's own count as one. Record licence and whether it can ship inside a closed product.
- **Demand** is the owner's statement or a cited public signal; a simulated buyer is a HYPOTHESIS.
- **Separate roles.** The judge wrote no proposal; the auditor is not the judge; a reviewer gets the sources, never the conclusion. The lead (you) writes no cell. Put a model from another vendor, when available, where a frame can be wrong: the frame attack and the final audit.
- **Compute what can be computed.** Keep the map as data, derive tables and counts with a script (TypeScript on Bun), and check every locator with a script plus the writer reading the cited lines.
- **Say what was observed and what is only proposed** in the same sentence.
- **Experiments** run in a temp dir outside every real repo, on a copy, with no real credentials; save their test files and logs in the study before deleting the copy. The charter says what may be downloaded.
- **Set `model` on every spawn** (haiku: mechanical checks; sonnet: inventory, scouts, experimenter; default model: seats, judge, auditor) and keep a round within ten agents. Agents get a brief with their role, scope and allowed paths, never your conversation.

## Stop criteria

All hold at the end of a round: no new BLOCKING objection; auditor error rate under 5% on at least 30 cells drawn by a seeded script from the whole result; every cell has a proof level and evidence, or is `unknown`/HYPOTHESIS; for a market study, one round with no new relevant candidate. A tranche that ends with one unmet ends in a continuation note, never in silence.

## Report

The answer in one sentence a first-time reader understands, the counts it quotes (from the tool), the owner decisions each with a recommendation, what stays open, and what the study does not claim.

## References

- `references/intake.md` (~700 tokens): the twelve intake questions and the charter template.
- `references/roles.md` (~600 tokens): roles, models, the round, objections and the audit.
