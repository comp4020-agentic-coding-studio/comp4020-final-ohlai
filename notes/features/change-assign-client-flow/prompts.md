# Change assign client flow: everything I said

Written by a hook, word for word. Never edited.

## 2026-11-08 18:04 (dashboard)

Let's change the current assigned client workflow, which goes from the dashboard to the Programmes page to assign popup. instead that's creating a new flow where from the main dashboard page you click onboard client which then takes you to a pop up (use the pop up from CANNU with the blurred bg and animation etc), this should have inputs for the clients name and email as well as program so we can send an invite link (saying Hi {name}, {PT name} just invited you to join their gym app) then the user shuold be able to click on the link they get sent in their email (can we send the email from our backend or do we still have to just open in default email client on PT computer?) which takes them to a sign up page where they can input their details.

---
[Added by the dashboard, not my words]
Feature: Change assign client flow

## 2026-11-08 18:55 (dashboard)

1. yep lets keep mailto but it shuoldnt read as being sent from a external source as its from the PTs email.
2. yep that looks ok.
3. keep as name email password for now. 
4. no the program page should just be to update the program itself and the clients or dash tabs should be for linking people to programs. 
5. no you need to have the program ready to give someone before you invite them.

## 2026-11-08 19:14 (dashboard)

its saying wrong email or password. did you not liink or change the db?

## 2026-11-08 20:01 (dashboard)

the button on the dash is all white and i cant see the text. Also How should we handle changing a clients program?

## 2026-11-08 20:48 (dashboard)

yes lets do option a, and then also add an option to duplicate a program in the programs page. 
then if someones mid workout when you change just queue it to change for them once they finish their workout. but let the PT submit the change with a note letting them know. 
Why would it live on the onboard client?? only have it on the clients side panel.

## 2026-11-08 21:14 (dashboard)

we can assume that no one has gotten an old link to a program so we dont have to depreciate them we can just dont aknowledge them or support them, Please check if we are doing any of that in the app atm?

## 2026-11-08 21:23 (dashboard)

i dont really get what you mean in the "Old program links after a Change program" section. Like if we send an invite link to a client it should be an invite to the app not a program so they should always be able to use that link to sign up but that link shuold not be tied to a program. The program shuold be tied to the user. Does that make sense? Is that how youve implemented it atm? 

As for "Links from before accounts existed" im happy with your recs. 

Yes remove old page addresses.

Just leave the old data for now.
