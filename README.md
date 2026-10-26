# Program

A PT writes a training program and sends it to a client. The client opens it on
their phone at the gym and logs every set as they go. The PT sees what was
actually lifted, instead of whatever the client remembers by Friday.

## Who it's for

A PT and the clients they program for. The PT signs up and gets a dashboard of
everyone they coach. Each client gets a private link to their program, which
works straight away, and can set a password from it so they can log in on any
device and message their PT. Nobody else can find a program or read a chat.

## What good means here

Good means the app fits what each person needs, where they are when they use
it. The PT and the client want different things from the same program, so they
get different views of the same data.

**The client is on a phone, mid-set.** They're standing at a bench with sweaty
hands and two minutes of rest. Their page opens in a phone layout and every row
comes pre-filled with what they did last workout, so most of the time it's
lift, tick, rest. The rest timer starts on its own and removing a set is a
swipe. Anything that needs typing or a menu mid-session is a failure. I took the
row layout from Hevy, which already gets this right.

**The PT is at a desk, planning.** They write programs and check in on clients
between sessions, so their pages are built for a desktop. The dashboard answers
the questions a PT has about a list of clients: who's gone quiet, who's done
this week's sessions, and which lifts are moving or stalled. Each of those opens
up into the detail behind it, down to the progress chart for one lift. That's
the point of sending a program instead of a PDF.

**Questions go to the PT, next to the training.** A client mid-program has
small questions ("bench felt heavy, should I drop the weight?"). They message
their PT from the app, with photos for form checks, and it shows up live on the
other side. One thread per PT and client, kept for good like everything else.

Either person can flip layouts, since sometimes the PT checks in from the gym
floor. The default is just the guess that's right most of the time.

**Progress has to read the way a PT reads it.** Most PTs program a rep range.
You add reps at one weight until you hit the top, then go up a weight and drop
back to the bottom. A chart of weight times reps dips every time you go up a
weight. The default chart scores each set as the weight plus a share of one
weight step for every rep above the bottom of the range, so adding reps and
adding weight both push the line up.

**What's logged stays logged.** A workout from eight weeks ago needs to still be
there or the progress line means nothing.

## How to use it

**As a PT.** Go to the home page and sign up. On your dashboard, click New
program, write the days and exercises, and send the client link with the Email
button (it opens your own mail app). Your client shows up on the dashboard
straight away. Click a client to see their week, recent workouts and which lifts
are moving, and click a lift to see its chart. Once your client has set a
password, Message opens your chat with them. The Inbox has every client
conversation in one list. Check-ins is where you write the weekly questions
your clients answer and read what they said. Save a program as a template in
the builder, and start the next client from it.

**As a client.** Open the link your PT sent you on your phone. Pick a workout,
tick each set as you finish it (rows are filled in from last time), and press
Finish. Set a password in the box at the top if you want to log in from another
device or message your PT. After that you can log in from the home page, and
My programs has your PT's weekly check-in.

## What I chose not to build

Accounts came late. For the first three weeks a private link was all there was,
since it does the job for two people who already trust each other. They came in
when the PT needed one place for all their clients and a client needed somewhere
to ask questions, and the links still work so nobody has to sign up to start
training. `docs/adr/0003-accounts-and-chat.md` has the reasoning. No video
calls yet, that's next. No exercise library, because the PT already has names they
use. No feed or leaderboards. No email from the server either. The PT's own
mail app sends the link, so it comes from someone the client knows.

## Enforced and judged

The checks in `spec/` enforce that only the client link can log sets, that the
client link never gives away the PT link, that removing a set closes the gap in
set numbers, and that finishing a workout keeps its sets. They also check that a
PT's dashboard only shows their own clients, that only a logged-in PT can write
a program, and that only the PT and client on a program can read their chat. The rest I have to
judge. Is logging really one tap between sets? I'll find out on my phone at the
gym. Does the progress line match how a PT reads progress? That needs an actual
PT.

## Sources

- Robin Sloan, [An app can be a home-cooked meal](https://www.robinsloan.com/notes/home-cooked-app/).
  Software for a few people you know gets to skip a lot of what public apps need.
- Clay Shirky, [Situated Software](https://web.archive.org/web/20040411202042/http://www.shirky.com/writings/situated_software.html).
  Building for one small group, and leaning on the trust that's already there.
- Luke Wroblewski, [Mobile First](https://abookapart.com/products/mobile-first).
  Starting from the phone forces you to work out what matters on the screen.
- [Hevy](https://www.hevyapp.com/), the workout logger I copied the set rows
  from.
