# Change assign client flow

Kept by the feature agents dashboard (`tools/feature-agents/`). Its notes are next to this file: `prompts.md` (everything I said, word for word), `log.md` and `decisions.md`.

- Status: building
- Created: 2026-11-08 17:51
- Started: 2026-11-08 17:51
- Branch: feat/change-assign-client-flow

## What I asked for

Let's change the current assigned client workflow, which goes from the dashboard to the Programmes page to assign popup. instead that's creating a new flow where from the main dashboard page you click onboard client which then takes you to a pop up (use the pop up from CANNU with the blurred bg and animation etc), this should have inputs for the clients name and email as well as program so we can send an invite link (saying Hi {name}, {PT name} just invited you to join their gym app) then the user shuold be able to click on the link they get sent in their email (can we send the email from our backend or do we still have to just open in default email client on PT computer?) which takes them to a sign up page where they can input their details.
