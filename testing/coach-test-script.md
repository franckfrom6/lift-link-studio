# F6GYM — Coach Testing Script
**Purpose:** UX audit + bug detection for the coach experience  
**Device target:** Desktop Chrome (primary) + iOS Safari (secondary)  
**Precondition:** Coach account with at least 2 linked athletes, one of whom has a completed session. Run each section top-to-bottom before moving to the next.

---

## SECTION 0 — Authentication

### T-C-01 · Log in
1. Open `/auth` on a fresh browser session.
2. Enter coach credentials and submit.
3. **Expected:** Redirect to `/coach` (dashboard). No onboarding triggered.
4. **Watch for:** Redirect to `/student`, redirect to `/onboarding`, spinner stuck.

### T-C-02 · Direct URL protection
1. While logged in as coach, manually navigate to `/student`.
2. **Expected:** Redirect back to `/coach`.
3. **Watch for:** Coach can access the student UI without impersonating.

---

## SECTION 1 — Dashboard (`/coach`)

### T-C-10 · KPI cards load
1. Land on the dashboard.
2. **Expected:** 4 KPI cards render with real numbers: Active students, Sessions this week, Avg adherence %, Alerts count.
3. **Watch for:** All cards show 0, loading spinners that never resolve, wrong data.

### T-C-11 · Alerts badge
1. If `alertCount > 0`, the Alerts KPI card should have a warning variant (orange/red).
2. Tap an alert (if interactive).
3. **Expected:** Navigates to the relevant student or opens a detail sheet.
4. **Watch for:** Card non-interactive, badge always 0 even with at-risk students.

### T-C-12 · Student list — list mode
1. Ensure **"Liste"** tab is active.
2. **Expected:** Each student shows name, avatar/initials, last activity, adherence indicator.
3. **Watch for:** Empty list with students linked, missing fields.

### T-C-13 · Student list — Kanban mode
1. Switch to **"Kanban"** tab.
2. **Expected:** Students grouped into columns (e.g., On Track / At Risk / Inactive).
3. **Watch for:** Kanban renders with all students in the same column, blank columns, layout broken on desktop.

### T-C-14 · Alerts only filter
1. Tap the **"Alertes seulement"** toggle button.
2. **Expected:** List/kanban filters to only show students with alerts.
3. **Watch for:** Filter has no effect, all students hidden.

### T-C-15 · Student search / filter
1. Type in the search field.
2. **Expected:** List filters in real-time by student name.
3. **Watch for:** No filtering, search clears itself, results include wrong students.

### T-C-16 · Pinned students sidebar
1. On desktop, check if a sidebar shows pinned students.
2. Click a pinned student chip.
3. **Expected:** Navigate to `/coach/students/:id`.
4. **Watch for:** Sidebar missing, clicks not registered, wrong student opened.

---

## SECTION 2 — Student List (`/coach/students`)

### T-C-20 · List renders
1. Navigate to `/coach/students`.
2. **Expected:** All linked students shown with name, email, status, last session date.
3. **Watch for:** Empty list, incomplete data.

### T-C-21 · Search student
1. Type a student name in the search box.
2. **Expected:** Instant filter.
3. **Watch for:** Lag > 500 ms, no results for exact match.

### T-C-22 · Open student detail
1. Click on a student row.
2. **Expected:** Navigate to `/coach/students/:id`.
3. **Watch for:** Click does nothing, wrong student opened.

---

## SECTION 3 — Student Detail (`/coach/students/:id`)

### T-C-30 · Page loads
1. Open any student's detail page.
2. **Expected:** Student name, photo/initials, check-in summary, linked program, quick actions visible.
3. **Watch for:** Blank page, 404, data from a different student.

### T-C-31 · Back navigation
1. Tap the back arrow.
2. **Expected:** Navigate to `/coach/students`.
3. **Watch for:** Navigate to `/coach` (wrong parent), browser back goes nowhere.

### T-C-32 · Check-in summary
1. Find the check-in section.
2. **Expected:** Latest check-in metrics (fatigue, sleep, mood) displayed with a date.
3. **Watch for:** "Aucun check-in" even when the student has submitted one.

### T-C-33 · View full bilan
1. Tap **"Voir le bilan complet"**.
2. **Expected:** Navigate to `/coach/students/:id/bilan`.
3. **Watch for:** Button missing, navigation to wrong page.

### T-C-34 · Edit coach notes
1. Tap the **"Notes coach"** edit button.
2. Modify the note, save.
3. **Expected:** Note persists, last-updated timestamp updated.
4. **Watch for:** Save unresponsive, note reverts on reload.

### T-C-35 · Open program
1. Tap the active program card.
2. **Expected:** Navigate to `/coach/students/:id/program/:programId`.
3. **Watch for:** Tap does nothing, wrong program opened.

### T-C-36 · Create new program
1. Tap **"Nouveau programme"**.
2. **Expected:** Navigate to `/coach/students/:id/program/new`.
3. **Watch for:** Button missing when student has no program, navigation fails.

### T-C-37 · Nutrition plan shortcut
1. Tap the nutrition plan card/button.
2. **Expected:** Navigate to `/coach/students/:id/nutrition-plan`.
3. **Watch for:** 404, blank page.

### T-C-38 · Add external session for student
1. Use the external session form on the student detail.
2. Fill in activity type, date, duration.
3. Submit.
4. **Expected:** Success toast, activity appears on the student's calendar.
5. **Watch for:** Form submits silently with no feedback, activity doesn't appear on student side.

### T-C-39 · Impersonation — "Voir comme l'athlète" (FIRST CLICK)
1. Tap **"Voir comme l'athlète"** button on a student detail page.
2. **Expected:** Navigate to `/student` showing the athlete's data (NOT the coach's).
3. **Watch for (known bug):** First click redirects back to `/coach` — the `startImpersonation()` async call is not awaited before `navigate()`.

### T-C-40 · Impersonation — student calendar data
1. Once impersonating (second click or after fix), look at the weekly calendar.
2. **Expected:** The athlete's sessions, free sessions, check-ins, and external activities are shown.
3. **Watch for (known bug):** Blank calendar even though the athlete has sessions. Data loads for the coach's own account, not the student's.

### T-C-41 · Impersonation banner visible
1. While impersonating, look at the top of the screen.
2. **Expected:** An impersonation banner is visible showing **"Vous voyez l'app en tant que [Student Name]"** with a "Quitter" button.
3. **Watch for:** Banner missing, cannot exit impersonation mode.

### T-C-42 · Impersonation — live session student_id
1. While impersonating, start a session.
2. Complete and save it.
3. **Expected:** The completed session is saved with the **student's** `student_id`, NOT the coach's.
4. **Watch for (known bug):** Session saved under the coach's ID — data doesn't appear in the student's history.

### T-C-43 · Exit impersonation
1. Tap **"Quitter"** on the impersonation banner.
2. **Expected:** Return to coach view (`/coach`), athlete data no longer shown.
3. **Watch for:** Banner disappears but still viewing athlete data, redirect to `/auth`.

---

## SECTION 4 — Program Editor (`/coach/students/:id/program/new` or `/edit`)

### T-C-50 · Empty program creates correctly
1. Navigate to new program creation.
2. Enter a program name and confirm.
3. **Expected:** Program created in DB, navigate to the program detail/editor.
4. **Watch for:** Name field required validation missing, duplicate programs created on double-submit.

### T-C-51 · Add a session
1. In the program editor, tap **"Ajouter une séance"**.
2. Enter a session name and select a day.
3. **Expected:** Session appears in the week grid at the correct day.
4. **Watch for:** Session added on wrong day, no visual feedback.

### T-C-52 · Add exercises to a session
1. Open a session in the editor.
2. Search for and add an exercise.
3. Set sets (e.g., 4), reps_min (8), reps_max (12), rest (90s), suggested weight (optional).
4. Save.
5. **Expected:** Exercise appears in the session with correct values.
6. **Watch for:** Values not persisted, all exercises default to 10-12 reps (data issue), sets/reps fields not editable.

### T-C-53 · Different reps per exercise
1. Set exercise A to 4×6, exercise B to 3×15.
2. Save and reopen the session.
3. **Expected:** Each exercise shows its own rep range.
4. **Watch for:** All exercises show 10-12 (same default — this is the "same reps everywhere" bug to diagnose).

### T-C-54 · Reorder exercises
1. Drag or use arrow buttons to reorder exercises within a session.
2. **Expected:** Order persists after save and on the athlete's side.
3. **Watch for:** Reorder reverts on save, drag has no visible feedback.

### T-C-55 · Delete exercise
1. Delete an exercise from a session.
2. **Expected:** Exercise removed immediately, no orphaned rows in DB.
3. **Watch for:** Exercise reappears after page reload (soft-delete not working).

### T-C-56 · Programme sections (if supported)
1. Add a section header (e.g., "Échauffement", "Bloc principal").
2. Assign exercises to sections.
3. **Expected:** Sections appear in the live session view on the athlete side.
4. **Watch for:** Sections ignored in the athlete view, all exercises in one flat list.

### T-C-57 · Program week navigation
1. In the editor, navigate across multiple weeks.
2. **Expected:** Sessions for each week loaded correctly.
3. **Watch for:** Week 2 shows Week 1 sessions, empty weeks even when populated.

### T-C-58 · Progression phases
1. Check if progression phases (e.g., "Semaine 1-4 : Fondamentaux") are editable.
2. Add or edit a phase label and description.
3. **Expected:** Phases display on the athlete's progression timeline.
4. **Watch for:** Phases field missing, changes not saved.

---

## SECTION 5 — Program Detail (`/coach/students/:id/program/:programId`)

### T-C-60 · Overview loads
1. Navigate to the program detail.
2. **Expected:** Program name, week count, adherence stats, session list.
3. **Watch for:** Blank page, stats always 0%.

### T-C-61 · Adherence metrics
1. Find the adherence percentage.
2. **Expected:** Calculated from student's completed sessions / total scheduled sessions.
3. **Watch for:** Always 0% even with completed sessions, always 100% with no sessions done.

### T-C-62 · Edit program link
1. Tap **"Modifier"** or the edit icon.
2. **Expected:** Navigate to the program editor.
3. **Watch for:** Navigation to wrong page, button missing.

---

## SECTION 6 — Student Bilan (`/coach/students/:id/bilan`)

### T-C-70 · Bilan page loads
1. Navigate to the bilan page.
2. **Expected:** Charts and data for the student's check-ins, session history, trends.
3. **Watch for:** Blank page, no charts even with data.

### T-C-71 · Date range filter
1. Change the date range filter.
2. **Expected:** Charts update to the selected period.
3. **Watch for:** Charts don't update, filter selection not retained.

---

## SECTION 7 — Programs Library (`/coach/programs`)

### T-C-80 · Library loads
1. Navigate to `/coach/programs`.
2. **Expected:** All programs created by this coach listed with name, athlete count, week count.
3. **Watch for:** Blank list, shows other coaches' programs.

### T-C-81 · Template / duplicate
1. If a duplicate/template option exists, duplicate a program.
2. **Expected:** A copy appears in the list with "(copie)" or similar suffix.
3. **Watch for:** Duplicate creates a program with no sessions, original is modified instead of copied.

---

## SECTION 8 — Exercise Library (`/coach/exercises`)

### T-C-90 · Exercise list loads
1. Navigate to `/coach/exercises`.
2. **Expected:** Full exercise library with muscle group filter, search, tracking type shown.
3. **Watch for:** Blank list, cardio exercises mixed in with strength (filter bug).

### T-C-91 · Filter by muscle group
1. Select a muscle group filter (e.g., "Dos").
2. **Expected:** Only exercises targeting that group shown.
3. **Watch for:** Filter does nothing, shows all exercises.

### T-C-92 · Search exercise
1. Type an exercise name.
2. **Expected:** Instant filtered list.
3. **Watch for:** No results, search clears itself.

### T-C-93 · Suggest video for exercise
1. Find the video suggestion feature (if present on an exercise card).
2. Submit a YouTube URL.
3. **Expected:** Suggestion recorded (sent to admin for review).
4. **Watch for:** Form submits with no feedback, no confirmation.

---

## SECTION 9 — Recommendations (`/coach/recommendations`)

### T-C-100 · Page loads
1. Navigate to `/coach/recommendations`.
2. **Expected:** Recommendation cards or content loaded.
3. **Watch for:** Blank page.

---

## SECTION 10 — Nutrition Plan (`/coach/students/:id/nutrition-plan`)

### T-C-110 · Plan loads
1. Navigate to a student's nutrition plan.
2. **Expected:** Current macro targets (calories, protein, carbs, fat) shown with editable fields.
3. **Watch for:** Blank page, always shows 0 for all macros.

### T-C-111 · Edit and save macros
1. Change the protein target by +10g.
2. Save.
3. **Expected:** New value persists on reload, student sees updated target on their side.
4. **Watch for:** Save button non-responsive, value reverts.

---

## SECTION 11 — Invite / Join Link

### T-C-120 · Generate invite link
1. Find the invite/join link feature (in coach profile or students page).
2. Generate or copy the invite link.
3. **Expected:** A URL starting with `/join/` is copied to clipboard or displayed.
4. **Watch for:** Link generation fails, clipboard permission not requested.

### T-C-121 · Student joins via link
1. Open the invite URL in a fresh browser (as a student or new user).
2. **Expected:** Student is prompted to sign up / log in, then linked to the coach automatically.
3. **Watch for:** Link shows a 404, student is linked to wrong coach, link works only once but shows no error on reuse (if multi-use).

---

## SECTION 12 — Edge Cases & Regression

### T-C-130 · Coach with no students
1. Log in as a coach with 0 linked students.
2. Navigate to the dashboard and `/coach/students`.
3. **Expected:** Empty state shown ("Invitez votre premier athlète") — not a blank or error page.
4. **Watch for:** Crash, spinner forever, broken KPI division-by-zero.

### T-C-131 · Student with no program
1. Open the student detail for a student who has no program.
2. **Expected:** "Créer un programme" CTA shown in the program section.
3. **Watch for:** Blank section, crash, wrong student's program shown.

### T-C-132 · Program with 0 sessions
1. Create a program but add no sessions.
2. View it.
3. **Expected:** Empty state shown, no crash, adherence shows "—" not NaN%.
4. **Watch for:** Division by zero shown in the UI, blank adherence.

### T-C-133 · Rapid navigation (stress test)
1. Click through coach → student detail → program editor → back → different student → program → back rapidly.
2. **Expected:** No stale data shown (data from previous student appearing in new student view).
3. **Watch for:** Wrong student's data displayed, duplicate API calls stacking, ghost UI states.

### T-C-134 · Mobile layout
1. Open the coach interface on a 390px viewport (iPhone 15).
2. Verify the dashboard, student list, and student detail are usable.
3. **Expected:** All content accessible, no horizontal overflow, tap targets ≥ 44px.
4. **Watch for:** Columns cut off, buttons unreachable, text overflowing containers.
