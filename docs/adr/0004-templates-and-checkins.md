# 4. Templates and weekly check-ins

## Context

A PT with several clients writes the same kind of program again and again, and
only sees how a client is going through their sets. I picked templates and
weekly check-ins to build from the dashboard previews (`notes/decisions.md`,
2026-10-26).

## Decision

- **Templates are copies.** A `templates` row holds the exercises as JSON.
  Starting a program from one copies them into the builder, and the program is
  saved the normal way. Nothing links a program back to its template, so
  editing or deleting a template can't change a client's program, and no
  logged set ever depends on a template.
- **Check-in questions belong to the PT.** Stored as JSON in
  `users.checkin_questions`, with a default set until the PT saves their own.
  Each answer is either a 1 to 5 scale or written text.
- **A check-in keeps its questions.** A `checkins` row stores the questions it
  was answered against next to the answers, so changing the questions later
  doesn't rewrite what a client already said.
- **Who can see what.** The same rule as chat: a client can check in only with
  a PT a program links them to, and a PT only sees check-ins from their own
  clients. Templates are only ever seen by the PT who saved them. Every save,
  rename, delete and check-in goes through `audit()`. The spec checks both.

All of it is additive: two new tables and one guarded `ALTER TABLE`. No
dependency.

## Update, same day: templates became the program library

Writing a program and assigning it are now separate. The PT writes a program
with no client (stored in `templates`, the name kept so no table is renamed on
the volume) and assigns it from the Programs page. Assigning runs the same
`createProgram` as before, so each client gets their own copy and their logged
sets never point at a library program. `/new` and `/templates` redirect to
`/programs/new` and `/programs`.

## What this means

No reminders or schedule for check-ins yet; the client checks in from My
programs whenever. Saving a client's live program as a template isn't built.
