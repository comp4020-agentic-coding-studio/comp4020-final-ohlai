# Crit 10: Writing it down as I go

## What was the breakthrough that moved the work forward?

Getting Claude to ask me before it decides things. For the logging I asked it to
brainstorm first, and it came back with four actual choices (how to name
someone, what to log, what format, where to keep it) with a recommendation for
each. Picking from options took a couple of minutes, and at the end I could say
why every part of the log looks the way it does, which is the thing I couldn't
do for most of crits 8 and 9.

The crit feedback has been pointing at the same gap the whole time. Be more
niche, make the multi-user side clearer, explain how decisions were made. All
of that is hard to write at the end if nothing was written down during. So now
there's a `notes/` folder with a feature board, a decision log and a log of each
session, and `CLAUDE.md` tells Claude to ask me when a decision comes up and
record it. The final docs should come out of those instead of out of my memory.

## What did this work change about who I want to be as a software developer?

I want to be the one making the decisions, not just approving whatever comes
out. The agent is fast enough that it's easy to let it pick everything and only
look at the result. That's how I ended up with an app that works but doesn't
have a strong point of view. Being asked forces me to have an opinion, and
having it written down means I can be held to it, by a marker or by me in two
weeks when I've forgotten why something works the way it does.
