---
name: document-review
description: "Use when: reviewing or proofreading a document, checking for errors, auditing text, or when the user says 'Check errors'. Best for Markdown, plain text, comments, and documentation files where the goal is to preserve structure and meaning while fixing spelling, grammar, links, or obvious inconsistencies."
argument-hint: "[file-path] [--mode={report|fix}] [--scope={spelling|grammar|links|all}]"
user-invocable: true
disable-model-invocation: false
---

# Document Review Skill

## Purpose
Review a document for errors — spelling, grammar, punctuation, broken internal references/links, inconsistent terminology, formatting glitches, and obvious factual or logical contradictions — while treating the file as append/patch-only and never regenerating it from scratch.

## Hard rules (integrity guardrails)
These are non-negotiable regardless of how the request is phrased:

1. Never rewrite the whole file. Only touch the specific lines that contain an actual error.
2. Never delete content to fix a problem. If something looks wrong but removing it would lose information, flag it instead of deleting it.
3. Preserve the original formatting exactly: heading levels, list styles, indentation, line breaks, code blocks, tables, front matter, and custom markup.
4. Preserve encoding and line endings of the original file.
5. Always work on a copy first or use a minimal diff-based edit. Before changing anything, read the full file and compute a minimal patch.
6. Default to report mode. Only fix automatically when the user explicitly asks for fix mode or says to fix it directly.
7. When scope is unspecified, do one category of change per pass so the review stays easy to audit.
8. Never touch code inside fenced code blocks, quoted text, citations, licenses, or front-matter metadata values.
9. If something is uncertain, flag it as a question rather than guessing.
10. Stop and ask before any change that would affect more than about 5% of the document, or where the file has unclear version-control state.

## Workflow

1. Locate and read the target file. If no path is given, ask which file to review.
2. Check repo state if in a git repo so the user knows whether there are uncommitted changes before applying a fix.
3. Scan the requested scope:
   - spelling: typos, misspellings
   - grammar: subject/verb agreement, tense consistency, punctuation
   - links: broken internal anchors, dead relative file paths, malformed Markdown links/images
   - all: perform separate passes for each category
4. Produce a findings report listing:
   - line number
   - original text excerpt
   - suggested correction
   - confidence (high/medium/low) with a brief reason
5. If fix mode is enabled, apply only the high-confidence fixes as a minimal patch and show the diff.
6. Verify after fixing by re-reading the file and confirming the heading structure, code blocks, and overall layout remain unchanged except for the intended edits.
7. Summarize findings concisely: number found, number auto-fixed, and number left for manual review.

## Invocation
This skill can be used by name, such as: /document-review
It also works naturally when the user says: "Check errors" or asks to review, proofread, audit, or fix text errors.

## Output format
- Findings report as a Markdown table: Line | Issue | Suggestion | Confidence.
- If fixing, show a unified diff with the usual --- a/file and +++ b/file syntax.
- Never paste the full revised document back into chat unless the user explicitly asks for it.

## Quality checklist
Before concluding, confirm that:
- the file was reviewed in the requested scope
- the patch was minimal and targeted
- structure and meaning were preserved
- any uncertain issues were flagged rather than guessed
- the user gets a concise summary instead of a full rewrite
