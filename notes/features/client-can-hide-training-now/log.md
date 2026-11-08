# Client can hide "Training now": log

Imported word for word from the board in `notes/features.md` on 2026-11-08, when the board moved to one folder per feature. It was on the board before the feature agents dashboard existed, and hasn't been built, so there's no prompts.md yet.

- 2026-10-26: Preview on My programs. A client should be able to stop their PT
  seeing when they're mid-workout.

## 2026-11-08: built the hide switch

I asked: "Make sure that the PT side can see that the client has disabled the feature not just that they are not training otherwise its confusing for the pt".

- `server.js`: new `users.show_training` column (guarded `ALTER TABLE`, default 1). `POST /api/me/training` (client only) saves it, calls `audit()` and pushes a live update to the client's PTs. `dashRow` now returns `training_hidden`, and `in_progress` is null while hidden, so the PT never learns what the client is doing. `currentUser` returns `show_training`.
- `public/settings.html`: the Privacy checkbox was a disabled "Preview". It now loads and saves the setting, and puts the box back if the save fails.
- `public/dash.html`: when hidden, the table cell says "Training status hidden by client" instead of the last-workout time.
- Why a separate flag: showing nothing would look the same as "not training", which is what I said would confuse the PT.
- Got wrong: first call to `api()` passed fetch options, but `api(path, body)` takes the body directly. Fixed.
- Not done: no spec test for the new endpoint. Hidden clients are also left out of the "training now" count and filter.

## 2026-11-08: checkbox looks like the app

I asked: "change the checkbox to match the theme of the app not use the defualt".

- Before: the browser's default checkbox. Now: a toggle switch in `public/style.css` (`.notice input[type="checkbox"]`), built from the colour tokens so it follows mono and dark mode. I said it looks good.
