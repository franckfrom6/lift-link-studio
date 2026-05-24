# F6GYM — Athlete Testing Script
**Purpose:** UX audit + bug detection for the athlete (student) experience  
**Device target:** iOS Safari PWA (primary) + Chrome desktop (secondary)  
**Precondition:** Test account with an active coach program assigned. Run each section top-to-bottom before moving to the next.

---

## SECTION 0 — Authentication & Onboarding

### T-A-01 · Sign up (new account)
1. Open the app on a fresh browser session (no cookies).
2. Tap **"S'inscrire"** on the landing page.
3. Fill in email + password and submit.
4. **Expected:** Email verification or direct redirect to `/onboarding`.
5. **Watch for:** Spinner stuck, no feedback on submit, redirect to wrong page.

### T-A-02 · Onboarding flow
1. Complete each onboarding step in order (personal info → goals → coach code if any).
2. Submit the last step.
3. **Expected:** Redirect to `/student` (weekly calendar).
4. **Watch for:** Any step that lets you advance with required fields empty, broken back navigation, duplicate profiles.

### T-A-03 · Log in (existing account)
1. Log out (via Profile → Déconnexion).
2. Log back in with valid credentials.
3. **Expected:** Direct redirect to `/student`, no onboarding re-triggered.
4. **Watch for:** Redirect to `/onboarding` even though it was already completed.

### T-A-04 · Forgot password
1. On `/auth`, tap **"Mot de passe oublié"**.
2. Enter registered email, submit.
3. **Expected:** Confirmation message shown, email received.
4. **Watch for:** No success feedback, form stays loading.

---

## SECTION 1 — Weekly Calendar (`/student`)

### T-A-10 · Page load
1. Navigate to `/student`.
2. **Expected:** Week grid renders with correct days, current day highlighted, programmed sessions shown on the right days.
3. **Watch for:** Blank page, wrong week displayed, sessions on wrong days.

### T-A-11 · Week navigation
1. Tap the **←** and **→** arrows to browse previous and next weeks.
2. **Expected:** Grid updates, session data loads for each week, no stale data from previous week.
3. **Watch for:** Spinner that never resolves, sessions from last week persisting.

### T-A-12 · Session day click — programmed session
1. Tap a day that has a programmed session (filled card).
2. **Expected:** Navigate to `/student/session/:id/preview`.
3. **Watch for:** Nothing happens, error toast, wrong session opened.

### T-A-13 · Session day click — empty day (future)
1. Tap a future empty day.
2. **Expected:** `SessionTypeChooser` bottom sheet opens with two cards: **Musculation** and **Course à pied**.
3. **Watch for:** Sheet doesn't open, wrong sheet opens (e.g., old FreeSessionCreator directly), cards missing.

### T-A-14 · Session day click — past day
1. Tap a past empty day.
2. **Expected:** Nothing happens (no sheet), or a "Ajouter une activité externe" option only.
3. **Watch for:** Session creation allowed on past dates.

### T-A-15 · Multiple sessions same day
1. On a day that has 2+ sessions, tap it.
2. **Expected:** Multi-session picker bottom sheet opens listing all sessions with emoji (💪 or 🏃), tapping one navigates correctly.
3. **Watch for:** Only the first session opens, sheet never appears.

### T-A-16 · External activity log
1. Long-press or use the day dropdown menu → **"Ajouter une activité externe"**.
2. Fill in activity type, duration, notes.
3. Submit.
4. **Expected:** Activity appears as a small chip on the calendar day, no full page reload.
5. **Watch for:** Form submits but nothing appears, duplicate entries on re-open.

### T-A-17 · Weekly check-in
1. Tap the **"Check-in"** button in the weekly header.
2. Fill in the form (fatigue, sleep, mood, etc.) and submit.
3. **Expected:** Confirmation shown, check-in badge updated on the week header.
4. **Watch for:** Form clears on scroll, submit does nothing, badge doesn't update.

### T-A-18 · VOLT AI sidebar
1. Tap the VOLT/AI icon to open the sidebar chat.
2. Type: **"Crée moi une séance de footing 40 minutes pour demain"**.
3. **Expected:** VOLT responds, session appears on tomorrow's calendar tile after the response.
4. **Watch for:** VOLT says "créé" but nothing appears on the calendar (cache not invalidated — known bug), sidebar won't open, spinner stuck.

### T-A-19 · Session swap (drag/swap mode)
1. On the week grid, use the **swap icon** or day dropdown to enter swap mode.
2. Select a source day, then a target day.
3. **Expected:** Sessions swap positions, toast confirms, swap mode exits.
4. **Watch for:** Both sessions disappear, only one moves, mode never exits.

---

## SECTION 2 — Session Preview (`/student/session/:id/preview`)

### T-A-20 · Preview renders
1. Open a session preview.
2. **Expected:** Session name, exercise list with sets/reps/rest per exercise, muscles targeted, estimated duration.
3. **Watch for:** Empty list, all exercises show same reps (data bug — verify with coach program), missing rest values.

### T-A-21 · Video thumbnail on exercise
1. In the preview, find an exercise card.
2. **Expected:** Video thumbnail visible (active icon, not grey). Tapping it opens the video embed.
3. **Watch for:** All thumbnails grey (no video URL), tapping does nothing.

### T-A-22 · Start session CTA
1. Tap **"Démarrer la séance"**.
2. **Expected:** Navigate to `/student/session/:id` (live session).
3. **Watch for:** Button disabled, navigate to wrong page, page loads blank.

---

## SECTION 3 — Live Session (`/student/session/:id`)

### T-A-30 · Session loads correctly
1. Start a session from the preview.
2. **Expected:** First exercise is active (expanded), elapsed timer starts (00:00 ticking up), exercise name, target sets/reps visible.
3. **Watch for:** No active exercise, timer frozen at 00:00, wrong exercise highlighted.

### T-A-31 · Previous session weight suggestion
1. Look at the weight input for any exercise you've done before.
2. **Expected:** Weight input pre-filled with last logged weight OR a suggested weight badge shown (e.g., "52 kg").
3. **Watch for:** All weight inputs at 0 with no suggestion, comparison arrows missing.

### T-A-32 · Log a set
1. For the active exercise, enter a weight and reps, then tap **"Valider"**.
2. **Expected:** Set is marked done (green check), next set becomes active, weight auto-propagates to the next set input.
3. **Watch for:** Set disappears instead of being marked done, weight doesn't propagate, button unresponsive.

### T-A-33 · Comparison arrows
1. After logging a set, look for up/down comparison arrows next to the weight.
2. **Expected:** Arrow shows ↑ if heavier than last session, ↓ if lighter (advanced mode only).
3. **Watch for:** Arrows missing even in advanced mode, always showing same direction.

### T-A-34 · Rest timer — start
1. Validate the last set of an exercise.
2. **Expected:** Rest timer appears automatically and starts counting down.
3. **Watch for:** Timer doesn't appear, timer starts at wrong duration, timer starts at 0 and immediately fires.

### T-A-35 · Rest timer — background / return
1. Start the rest timer, then switch to another app for 30 seconds, then return.
2. **Expected:** Timer shows the correct remaining time (not reset to the original value).
3. **Watch for:** Timer reset to full duration, timer froze at the value it was when you left.

### T-A-36 · Rest timer — silent mode (iOS)
1. Put the iPhone on silent (ringer switch off).
2. Let the rest timer reach 00:00.
3. **Expected:** Beep sound plays despite silent mode (audio session unlocked).
4. **Watch for:** Completely silent, vibration only.

### T-A-37 · Rest timer — alarm volume
1. Let the rest timer reach 00:00 with sound on.
2. **Expected:** Beep is clearly audible (not a faint notification-level sound).
3. **Watch for:** Almost inaudible beep.

### T-A-38 · Demo video button
1. On the active exercise card, look for the video button.
2. **Expected:** Button clearly visible with accent colour (not grey-on-grey). Tapping it opens a YouTube embed.
3. **Watch for:** Button invisible against background, no button shown at all, video embed doesn't load.

### T-A-39 · Add a set after completion
1. Complete all sets of an exercise (all validated).
2. Tap **"Ajouter une série"**.
3. **Expected:** A new set row appears and is editable.
4. **Watch for:** Button disabled or hidden after all sets are done (known bug).

### T-A-40 · Exercise video replay after done
1. After completing all sets of an exercise, tap the demo video button.
2. **Expected:** Video plays without triggering session completion.
3. **Watch for:** App immediately marks the session as done / navigates away.

### T-A-41 · Skip exercise
1. On an exercise, tap **"Passer"** (skip).
2. **Expected:** Exercise is greyed out and skipped, next exercise becomes active.
3. **Watch for:** Skip does nothing, app crashes, exercise can't be returned to.

### T-A-42 · Swap exercise
1. Tap **"Remplacer"** on an exercise.
2. Choose an alternative from the list.
3. **Expected:** Exercise name and sets update to the new exercise, original is shown as substituted.
4. **Watch for:** Sheet empty, substitution doesn't persist after scrolling, original name still shown.

### T-A-43 · Session elapsed timer — after app switch
1. Note the elapsed time, switch to another app for 1 minute, return.
2. **Expected:** Elapsed timer shows approximately 1 minute more than when you left (not reset to 0).
3. **Watch for:** Timer reset to 0 or to original start time.

### T-A-44 · Active exercise key restored after reload
1. Navigate to the 3rd exercise in a session, then force-reload the page (or simulate iOS eviction by switching apps).
2. Return to the app.
3. **Expected:** App restores to roughly the same exercise position (or at least doesn't restart from exercise 1 with zeroed state).
4. **Watch for:** Always resets to exercise 1, elapsed timer at 0.

### T-A-45 · End session — undo
1. Near the end of the session, tap **"Terminer la séance"**.
2. **Expected:** A confirmation dialog or an undo option is offered before saving.
3. **Watch for:** Session immediately marked complete with no confirmation possible.

### T-A-46 · Session saves correctly
1. Complete a full session and confirm ending.
2. **Expected:** Redirect to session recap with stats (duration, volume, sets). Session appears as "completed" on the calendar.
3. **Watch for:** Saving spinner stuck, toast error, redirect to wrong page, session not marked on calendar.

---

## SECTION 4 — Free Session (Strength)

### T-A-50 · Create strength session
1. From the calendar, open `SessionTypeChooser` and tap **"Musculation"**.
2. **Expected:** `FreeSessionCreator` opens.
3. Search for an exercise, add it, set sets/reps, save.
4. **Expected:** Session appears on the calendar for the selected date.
5. **Watch for:** Search returns cardio/running exercises (filter bug), session saves but doesn't appear on calendar.

### T-A-51 · Cardio exercises excluded
1. In `FreeSessionCreator`, search for "run" or "course".
2. **Expected:** No running/cardio exercise appears in results.
3. **Watch for:** Running exercises mixed in with strength exercises.

---

## SECTION 5 — Running Session

### T-A-55 · Create running session
1. From `SessionTypeChooser`, tap **"Course à pied"**.
2. **Expected:** `RunBlockEditor` opens.
3. Enter a session name, select a template (e.g., "Footing facile").
4. **Expected:** Blocks are pre-populated (warmup + easy + cooldown).
5. Save the session.
6. **Expected:** Session appears on the calendar with a 🏃 icon.
7. **Watch for:** Editor opens blank with no templates, session saves but doesn't appear, wrong icon shown.

### T-A-56 · VOLT description in RunBlockEditor
1. In `RunBlockEditor` Step 1, paste a description in the "Décrire via VOLT" text area.
2. Example: **"15 minutes échauffement, 3 fois 5 minutes au seuil avec 2 minutes récupération, 10 minutes retour au calme"**
3. Tap **"Générer les blocs ✨"**.
4. **Expected:** Blocks appear in Step 2 matching the description.
5. **Watch for:** Spinner stuck, no blocks generated, invalid JSON error in console.

### T-A-57 · Open a running session from calendar
1. Tap a day with a running session (🏃 icon).
2. **Expected:** Navigate to `/student/run/:id` (RunningLiveSession), NOT to `/student/session/:id/preview`.
3. **Watch for:** Opens the strength session preview (blank exercises page) — this is the known navigation bug.

### T-A-58 · Run session — checklist
1. On the RunningLiveSession page, verify blocks are listed.
2. Tap each block to mark it as done (checkmark).
3. **Expected:** Block shows a green check, tapping again unchecks it.
4. Tap **"Terminer la séance"**.
5. **Expected:** Session saved, navigate to `/student`.
6. **Watch for:** Blocks not tappable, save fails, navigate to wrong page.

---

## SECTION 6 — Progress (`/student/progress`)

### T-A-60 · Charts load
1. Navigate to Progress.
2. **Expected:** Charts render with real data (volume, sessions per week, muscle groups worked).
3. **Watch for:** All charts empty/blank even with completed sessions, loading spinner that never resolves.

### T-A-61 · Period filter
1. Toggle between 7 days / 30 days / 3 months / all time.
2. **Expected:** Charts update with data for the selected period.
3. **Watch for:** Charts don't change, period button has no visible active state.

### T-A-62 · Exercise detail drill-down
1. Tap on an exercise name or chart bar (if drill-down exists).
2. Navigate to `/student/exercise/:id`.
3. **Expected:** Exercise page shows history, previous weights per session plotted.
4. **Watch for:** Navigation goes to a blank page, chart doesn't render.

---

## SECTION 7 — Nutrition

### T-A-70 · Nutrition diary (`/student/nutrition`)
1. Navigate to Nutrition.
2. **Expected:** Today's meals displayed, macro totals shown, log food button accessible.
3. **Watch for:** Blank page, macros always 0.

### T-A-71 · Log a food
1. Tap **"Ajouter"** on a meal section.
2. Search for a food item.
3. Select it, adjust quantity, confirm.
4. **Expected:** Food appears in the meal, macros update.
5. **Watch for:** Search returns no results, quantity input non-functional, macros don't recalculate.

### T-A-72 · Nutrition plan (`/student/nutrition-plan`)
1. Navigate to the nutrition plan page.
2. **Expected:** Coach-defined macros and calorie targets visible.
3. **Watch for:** Empty page if no plan was set by coach (should show a placeholder, not blank).

---

## SECTION 8 — Recommendations (`/student/recommendations`)

### T-A-80 · Cards load
1. Navigate to Recommendations.
2. **Expected:** At least one recommendation card displayed.
3. **Watch for:** Blank page, loading spinner forever.

### T-A-81 · Card interaction
1. Tap a recommendation card to expand or dismiss.
2. **Expected:** Card state updates, doesn't re-appear on next visit if dismissed.
3. **Watch for:** Tap does nothing, dismissed card reappears immediately.

---

## SECTION 9 — Profile (`/student/profile`)

### T-A-90 · Profile data loads
1. Navigate to Profile.
2. **Expected:** Name, photo (or initials), email, role, linked coach shown.
3. **Watch for:** Blank fields, coach name missing.

### T-A-91 · Edit profile
1. Tap the edit button.
2. Change the display name, save.
3. **Expected:** Name updates everywhere (nav header, profile page).
4. **Watch for:** Save button unresponsive, name reverts after navigation.

### T-A-92 · Theme toggle
1. Switch between light and dark mode.
2. **Expected:** Theme applies immediately, persists after page reload.
3. **Watch for:** Toggle has no effect, theme resets on reload.

### T-A-93 · Language toggle
1. Switch the app language (if available).
2. **Expected:** UI text updates globally.
3. **Watch for:** Some strings stay untranslated, layout breaks with longer text.

### T-A-94 · Sign out
1. Tap **"Déconnexion"**.
2. **Expected:** Redirect to `/auth`, session cleared.
3. **Watch for:** Still logged in after sign out, redirect to blank page.

---

## SECTION 10 — Edge Cases & Regression

### T-A-99 · No program assigned
1. Log in as an athlete with NO coach program assigned.
2. Navigate to `/student`.
3. **Expected:** Onboarding banner or empty state shown — not a crash or spinner.
4. **Watch for:** Error thrown, blank white screen.

### T-A-100 · Offline behaviour
1. Disconnect from WiFi/data.
2. Try navigating between tabs.
3. **Expected:** Cached data still visible, offline indicator shown, graceful error on data-dependent actions.
4. **Watch for:** Complete white screen, crashes, data loss.

### T-A-101 · iOS PWA install + reopen
1. Add the app to the iOS home screen.
2. Open from home screen, complete a session partially.
3. Press the Home button, wait 10 seconds, reopen the app.
4. **Expected:** Session state restored (elapsed timer continues, correct exercise highlighted).
5. **Watch for:** Full page reload, all state lost, timer at 0.
