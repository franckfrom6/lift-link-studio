# Parsing test scripts (Mode B)

How to extract structured test data from `docs/testing/coach-test-script.md` and `docs/testing/athlete-test-script.md`.

## Script structure

Both scripts follow the same format:

```markdown
# F6GYM — <Coach|Athlete> Testing Script
**Purpose:** ...
**Device target:** ...
**Precondition:** ...

---

## SECTION 0 — <Section Title>

### T-X-NN · <Test Title>
1. <Step 1>
2. <Step 2>
3. **Expected:** <Expected result>
4. **Watch for:** <What to flag if seen>
```

Where:
- `X` is `C` for coach or `A` for athlete
- `NN` is a zero-padded 2-3 digit test ID (T-A-01, T-A-30, T-A-101)
- Steps are numbered, may include sub-bullets
- **Expected** and **Watch for** sections are bold-prefixed

## Parsing approach

Read the script with `view` from filesystem. **Do not** attempt to maintain state across calls — parse what you need per request.

For each test you want to handle:

1. Locate the `### T-X-NN · <Title>` line
2. Capture everything until the next `### ` or `## ` heading
3. Extract structured fields:
   - `id` : e.g. "T-A-30"
   - `persona` : derived from prefix — `T-A-*` → athlete, `T-C-*` → coach
   - `title` : after the `·` separator
   - `section` : the parent `## SECTION N — <name>` heading
   - `steps` : list of numbered step strings (excluding the **Expected:** and **Watch for:** lines)
   - `expected` : the **Expected** content (single string)
   - `watch_for` : the **Watch for** content (single string)

## Example extraction

Input :
```markdown
### T-A-30 · Session loads correctly
1. Start a session from the preview.
2. **Expected:** First exercise is active (expanded), elapsed timer starts (00:00 ticking up), exercise name, target sets/reps visible.
3. **Watch for:** No active exercise, timer frozen at 00:00, wrong exercise highlighted.
```

Output (conceptual) :
```json
{
  "id": "T-A-30",
  "persona": "athlete",
  "section": 3,
  "section_title": "Live Session (`/student/session/:id`)",
  "title": "Session loads correctly",
  "steps": [
    "Start a session from the preview."
  ],
  "expected": "First exercise is active (expanded), elapsed timer starts (00:00 ticking up), exercise name, target sets/reps visible.",
  "watch_for": "No active exercise, timer frozen at 00:00, wrong exercise highlighted."
}
```

## Edge cases to handle

- **Steps with sub-bullets** (e.g. "Search for an exercise, add it, set sets/reps, save.") — preserve as a single step string, don't split on commas.
- **Multi-line Expected** — Expected/Watch-for may span multiple lines until the next `**`-prefixed marker or end of test. Concatenate with a space.
- **Tests with no Watch-for** — some tests omit it. Use empty string, never null.
- **Tests referencing other tests** — e.g. "After T-A-46" — preserve the reference verbatim, don't try to resolve it.

## Section filtering

When the user asks for "Section 3", filter by the parent `## SECTION N` heading.

The section number is in the heading text (e.g. `## SECTION 3 — Live Session`). Extract it via regex on `SECTION (\d+)`.

## What this skill does not do

- **Modify the script files**. Scripts in `docs/testing/` are the source of truth, maintained by the human. The skill reads them, never writes them.
- **Parse the full script when only one section is needed**. Be lazy — read only what's in scope.
- **Validate test IDs**. Trust the script's numbering. If IDs collide or look wrong, flag to the user, don't silently fix.
