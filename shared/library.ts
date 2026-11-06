import type { Action, AlternativeAction, CheckInRequest, Intervention, Quote } from "./intervention";
import { MOODS, findMood } from "./moods";

/**
 * MoodLens' built-in content library.
 *
 * It provides the fallback when the AI provider is unavailable, and the full
 * experience when the user has turned AI suggestions off. Every mood has an
 * acknowledgement, a thought and at least two action + smaller-alternative
 * pairs, so a library response is always complete.
 *
 * QUOTE POLICY
 *  - `curated_quote` entries must be real, verified quotations with author and
 *    source. Do not add one unless the wording and source have been checked
 *    against the original work. When in doubt, write an original reflection.
 *  - `original_reflection` entries are written for MoodLens and are never
 *    attributed to a person.
 */

interface ActionPair {
  action: Action;
  alternative: AlternativeAction;
}

interface LibraryEntry {
  acknowledgement: string;
  reflection: string;
  thoughts: Quote[];
  actions: ActionPair[];
  journal_prompt: string;
}

const thought = (text: string): Quote => ({ type: "original_reflection", text, author: null, source: null });
const quote = (text: string, author: string, source: string): Quote => ({ type: "curated_quote", text, author, source });

const pair = (
  title: string,
  description: string,
  duration_minutes: 2 | 5 | 10,
  alt: [string, string, (2 | 5)?],
  difficulty: "easy" | "moderate" = duration_minutes === 10 ? "moderate" : "easy",
): ActionPair => ({
  action: { title, description, duration_minutes, difficulty },
  alternative: { title: alt[0], description: alt[1], duration_minutes: alt[2] ?? 2 },
});

const breathe = pair(
  "Take a short grounding pause",
  "Notice five things you can see, four you can hear and three you can feel. Then take three slow breaths, making each out-breath a little longer than the in-breath.",
  2,
  ["Three slow breaths", "Breathe in for a count of four and out for a count of six, three times."],
);

export const LIBRARY: Record<string, LibraryEntry> = {
  overwhelmed: {
    acknowledgement: "It sounds like a lot is competing for your attention right now.",
    reflection:
      "Sometimes the difficulty isn't knowing what to do, but trying to hold everything in your head at once. Getting it out of your head is often the first bit of relief.",
    thoughts: [
      thought("You do not have to do everything today. You only have to decide what deserves your attention first."),
      thought("A full mind isn't a failing. It's a sign you're carrying more than one head can hold."),
    ],
    actions: [
      pair(
        "Empty your head onto a page",
        "Write down everything competing for your attention, big or small, in any order. Don't organise it yet. Just get it out of your head.",
        5,
        ["Write down just three things", "Name the three things taking up the most space in your head right now."],
      ),
      pair(
        "Choose the one thing that matters today",
        "Look at what's on your plate and pick one task that genuinely needs attention today. Everything else can wait until that one is moving.",
        5,
        ["Name one thing that can wait", "Pick a single item you can consciously set aside until tomorrow."],
      ),
      pair(
        "Do only the first step",
        "Pick one task and spend ten minutes on just its first step. Stop when the time is up, even if you're mid-flow.",
        10,
        ["Define the first step", "Write one sentence describing the very first physical action for one task."],
      ),
    ],
    journal_prompt: "What would feel lighter if you let it wait until tomorrow?",
  },

  anxious: {
    acknowledgement: "Anxiety can make everything feel urgent and uncertain at the same time.",
    reflection:
      "It's often less about the situation itself and more about not knowing how it will turn out. Focusing on what's within reach can steady things a little.",
    thoughts: [
      thought("You can take the next step without having certainty about every step that follows."),
      quote("You can't stop the waves, but you can learn to surf.", "Jon Kabat-Zinn", "Wherever You Go, There You Are (1994)"),
    ],
    actions: [
      pair(
        "Separate what you can and can't control",
        "Draw two columns. In one, write what's worrying you that you can influence. In the other, what you can't. Circle one thing in the first column.",
        5,
        ["Name one thing you can control", "Say or write one small thing about this situation that is within your control."],
      ),
      breathe,
      pair(
        "Shrink the worry to one step",
        "Write the concern in a single sentence, then write the smallest step you could take on it today.",
        5,
        ["Write the worry in one sentence", "Putting it into words can make it feel more contained."],
      ),
    ],
    journal_prompt: "What is one part of this that you already know how to handle?",
  },

  stressed: {
    acknowledgement: "It sounds like you're under real pressure right now.",
    reflection:
      "Stress often builds when demands outpace the time and energy available. You may not be able to remove the pressure, but you can choose where your attention goes first.",
    thoughts: [
      thought("Not everything that feels urgent is important. You're allowed to decide what comes first."),
      quote("I'm not afraid of storms, for I'm learning how to sail my ship.", "Louisa May Alcott", "Little Women (1868)"),
    ],
    actions: [
      pair(
        "Find one thing that can wait",
        "Look at your responsibilities and identify one that can genuinely wait, be shortened, or be handed to someone else.",
        5,
        ["Name the most pressing thing", "Write down the single thing that most needs your attention next."],
      ),
      pair(
        "Step away from the screen",
        "Take a short break away from your desk. Stand, stretch, get some water or look out of a window.",
        5,
        ["Stand and stretch", "Stand up, roll your shoulders and stretch for a moment."],
      ),
      pair(
        "Decide what needs attention first",
        "Spend ten minutes ordering what's in front of you: what's due soonest, what's blocking other things, what matters most. Then start the top item.",
        10,
        ["Pick the next task only", "Choose only what you'll do next, not the whole plan."],
      ),
    ],
    journal_prompt: "What is one expectation you could lower this week without anything bad happening?",
  },

  sad: {
    acknowledgement: "I'm sorry today feels heavy.",
    reflection:
      "Sadness doesn't always need to be solved or explained. Sometimes it just needs room, and a little gentleness while it's here.",
    thoughts: [
      thought("You don't have to turn every difficult day into a lesson. Sometimes getting through it is enough."),
      thought("Feeling low isn't a sign you're doing something wrong. It's a sign you're human."),
    ],
    actions: [
      pair(
        "Give yourself permission to pause",
        "Take a few minutes to do nothing productive. Sit somewhere comfortable, have a warm drink and let yourself feel what you feel without judging it.",
        5,
        ["Write one kind sentence", "Write one sentence you'd say to a friend who felt the way you do."],
      ),
      pair(
        "Step outside for a few minutes",
        "If it feels comfortable, step outside or open a window. Notice the air, the light and any sounds around you.",
        5,
        ["Let some daylight in", "Open a curtain or window, wherever you are."],
      ),
      pair(
        "Reach out to someone you trust",
        "Send a short message to someone you trust. It doesn't need to explain anything. 'Thinking of you' is enough.",
        5,
        ["Think of one person", "Bring to mind one person who makes you feel safe. You don't have to contact them."],
      ),
    ],
    journal_prompt: "What would being gentle with yourself look like for the rest of today?",
  },

  lonely: {
    acknowledgement: "Feeling lonely can be painful, even when there are people around you.",
    reflection:
      "Loneliness is a signal that you need connection, not a sign that something is wrong with you. Even a small moment of contact can help.",
    thoughts: [
      thought("You deserve connection, even on the days when reaching out feels difficult."),
      thought("Reaching out doesn't have to be big to count."),
    ],
    actions: [
      pair(
        "Send one low-pressure message",
        "Message someone you haven't spoken to in a while: a memory, a link or a simple 'how are you?'. It counts even if they don't reply straight away.",
        5,
        ["Choose who you'd message", "Just choose the person. You can decide later whether to send anything."],
      ),
      pair(
        "Be around people, gently",
        "If it feels manageable, spend a little time somewhere with other people nearby, such as a café, park or library.",
        10,
        ["Listen to a familiar voice", "Put on a podcast, voice note or programme with a voice you find comforting.", 5],
      ),
    ],
    journal_prompt: "Who is one person who has made you feel understood?",
  },

  stuck: {
    acknowledgement: "Feeling stuck is frustrating, especially when you know something matters.",
    reflection:
      "Being stuck often isn't about effort. It can mean the next step is unclear or too large to start. Making it smaller usually helps more than pushing harder.",
    thoughts: [
      quote("The best way out is always through.", "Robert Frost", "A Servant to Servants (1914)"),
      thought("You don't need the whole path. You need the next foothold."),
    ],
    actions: [
      pair(
        "Make the next step tiny",
        "Take what you're stuck on and write the smallest possible next action, so small it feels almost too easy. Then do it.",
        5,
        ["Name what you're stuck on", "Write one sentence describing what you're stuck on."],
      ),
      pair(
        "Change your setting",
        "Move to a different room, switch to paper, or set a ten-minute timer and work on it somewhere new.",
        10,
        ["Change your position", "Stand up, move to a different seat or clear one thing from your desk."],
      ),
    ],
    journal_prompt: "If this didn't have to be done well, what would you do first?",
  },

  unmotivated: {
    acknowledgement: "Low motivation is common, and it isn't a character flaw.",
    reflection:
      "Motivation doesn't always arrive before action. Often it shows up after you've started, so starting smaller is usually more useful than waiting to feel ready.",
    thoughts: [
      thought("Motivation does not always arrive before action. Sometimes it follows the decision to begin."),
      thought("Five minutes of something can matter more than an hour of waiting to feel like it."),
    ],
    actions: [
      pair(
        "Open the task and work for five minutes",
        "Open the thing you've been avoiding and work on it for five minutes. When the time's up, decide honestly whether to stop or carry on. Both are fine.",
        5,
        ["Just open it", "Open the document, app or file. That's the whole task."],
      ),
      pair(
        "Prepare, don't perform",
        "Spend a few minutes setting up: gather what you need, clear a space and write down the first step. You don't have to start the task itself.",
        5,
        ["Write down the first step", "One line describing where you'd begin."],
      ),
    ],
    journal_prompt: "What would make starting feel 10% easier?",
  },

  tired: {
    acknowledgement: "It sounds like your energy is low right now.",
    reflection:
      "Tiredness can make everything feel harder than it is. It may be a signal to rest or to lower the bar, rather than to push through.",
    thoughts: [
      quote(
        "Almost everything will work again if you unplug it for a few minutes, including you.",
        "Anne Lamott",
        "TED talk, 12 truths I learned from life and writing (2017)",
      ),
      thought("Rest is part of the work, not a reward for finishing it."),
    ],
    actions: [
      pair(
        "Take a proper short break",
        "Step away from screens for a few minutes. Drink some water, stretch, or sit with your eyes closed.",
        5,
        ["Drink a glass of water", "Get a glass of water and drink it slowly."],
      ),
      pair(
        "Lower the bar for today",
        "Pick one thing you planned for today and choose a smaller version of it that would still count.",
        5,
        ["Let one thing go", "Choose one task you'll consciously drop for today."],
      ),
    ],
    journal_prompt: "What is draining your energy that you could protect yourself from tomorrow?",
  },

  lost: {
    acknowledgement: "Feeling unsure of your direction can be unsettling.",
    reflection:
      "Not knowing where you're heading doesn't mean you're getting everything wrong. Clarity often comes from noticing what matters to you, one small thing at a time.",
    thoughts: [
      quote("Not all those who wander are lost.", "J.R.R. Tolkien", "The Fellowship of the Ring (1954)"),
      thought("You don't need a map of your whole life to choose a good next step."),
    ],
    actions: [
      pair(
        "Write down what matters to you right now",
        "List three things that genuinely matter to you at the moment, whether people, values or goals. Notice whether any of them point to a next step.",
        5,
        ["Name one thing that matters", "Write down one thing that matters to you today."],
      ),
      pair(
        "Ask a smaller question",
        "Instead of 'What should I do with my life?', write 'What would make next week a little better?' and answer it in a few lines.",
        10,
        ["Finish one sentence", "Complete this: 'Something I'd like more of is…'"],
      ),
    ],
    journal_prompt: "When did you last feel on the right track, and what were you doing?",
  },

  frustrated: {
    acknowledgement: "Frustration makes sense when things aren't going the way they should.",
    reflection:
      "Frustration often points to something you care about that's being blocked. Naming what's in the way can turn some of that energy into something useful.",
    thoughts: [
      thought("Your frustration is information. It shows you what you care about."),
      thought("You can pause without giving up."),
    ],
    actions: [
      pair(
        "Name what's in the way",
        "Write down what is blocking you, as specifically as you can. Then note one thing you could change, ask for, or let go of.",
        5,
        ["Name the blocker in one line", "Write one sentence about what's frustrating you most."],
      ),
      pair(
        "Release some tension first",
        "Move for a few minutes with a brisk walk, the stairs, or by shaking out your arms. Come back to the problem afterwards.",
        5,
        ["Unclench", "Notice your jaw, shoulders and hands, and let them soften."],
      ),
    ],
    journal_prompt: "What outcome would you be satisfied with here, even if it isn't perfect?",
  },

  angry: {
    acknowledgement: "Anger is a strong feeling, and it usually has a reason behind it.",
    reflection:
      "It can be a sign that a boundary has been crossed or something feels unfair. Giving it a little space before acting usually leads to choices you'll feel better about.",
    thoughts: [
      thought("Feeling angry doesn't mean you have to act on it right now."),
      thought("Your frustration is information. It shows you what you care about."),
    ],
    actions: [
      pair(
        "Pause before you respond",
        "If you're about to reply to someone, wait. Write what you'd like to say somewhere private first. You can decide later whether to send any of it.",
        5,
        ["Three slow breaths", "Breathe in for a count of four and out for a count of six, three times."],
      ),
      pair(
        "Move the energy",
        "Go for a brisk walk or take the stairs for a few minutes before deciding what to do next.",
        5,
        ["Unclench", "Notice your jaw, shoulders and hands, and let them soften."],
      ),
    ],
    journal_prompt: "What feels unfair here, and what would make it fairer?",
  },

  calm: {
    acknowledgement: "It's good to notice when you feel calm.",
    reflection:
      "Calm moments are worth paying attention to. Noticing what helped you get here can make it easier to find your way back on harder days.",
    thoughts: [
      thought("Calm isn't the absence of things to do. It's having room to choose."),
      thought("A quiet moment is not wasted time."),
    ],
    actions: [
      pair(
        "Note what's helping",
        "Write down two or three things that contributed to feeling calm today, so you can return to them later.",
        2,
        ["Name one thing", "Notice one thing that is helping you feel settled."],
      ),
      pair(
        "Use the calm for something that matters",
        "Spend ten minutes on something important that usually gets crowded out: planning, a message you've meant to send, or simply rest.",
        10,
        ["Enjoy it for a minute", "Pause and enjoy the feeling before moving on."],
      ),
    ],
    journal_prompt: "What helped you feel this way today?",
  },

  hopeful: {
    acknowledgement: "It's good to feel some hope.",
    reflection: "Hope can be a useful guide. It often points towards something you care about and would like more of.",
    thoughts: [
      quote("Hope is the thing with feathers / That perches in the soul", "Emily Dickinson", "“Hope” is the thing with feathers (c. 1861)"),
      thought("Hope doesn't need to be certain to be useful."),
    ],
    actions: [
      pair(
        "Take one small step towards it",
        "Write down what you're hopeful about and one small action that moves it forward. Then do that action.",
        5,
        ["Write down what you're hopeful about", "A single line is enough."],
      ),
      pair(
        "Share it with someone",
        "Tell someone about what you're looking forward to. Saying it out loud can make it feel more real.",
        5,
        ["Picture the first sign", "Imagine the first small sign that things are moving in the right direction."],
      ),
    ],
    journal_prompt: "What are you hoping for, and what would be a first sign that it's happening?",
  },

  motivated: {
    acknowledgement: "It sounds like you have some energy to work with.",
    reflection:
      "Motivation is valuable, but it comes and goes. Pointing it at what matters most, rather than at the easiest thing, gets the most from it.",
    thoughts: [
      thought("Use the momentum while it's here, and be kind to yourself when it fades."),
      thought("Energy is best spent on what matters, not just on what's next."),
    ],
    actions: [
      pair(
        "Start the most important task",
        "Pick the task that matters most and give it ten focused minutes before anything else.",
        10,
        ["Choose the most important task", "Decide what it is and write it down."],
      ),
      pair(
        "Make a future task easier",
        "Spend five minutes preparing something you'll need to do later, so that future you has less to start.",
        5,
        ["Write tomorrow's first step", "Note the first thing you'll do tomorrow."],
      ),
    ],
    journal_prompt: "What would you like to have made progress on by the end of the week?",
  },

  inspired: {
    acknowledgement: "Inspiration is worth capturing while it's fresh.",
    reflection: "Ideas can fade quickly. Getting it down in some form makes it easier to return to once the feeling has passed.",
    thoughts: [
      thought("Write it down before it becomes 'that idea I once had'."),
      thought("Inspiration starts things. Small steps keep them going."),
    ],
    actions: [
      pair(
        "Capture the idea",
        "Spend five minutes writing down the idea, why it excites you and one possible next step.",
        5,
        ["Write one line", "A single sentence that will remind you of the idea later."],
      ),
      pair(
        "Give it ten minutes",
        "Spend ten minutes doing the first small piece of it, such as a sketch, an outline or a message to someone who could help.",
        10,
        ["Set a reminder", "Put a time in your calendar to come back to it."],
      ),
    ],
    journal_prompt: "What about this idea feels most alive to you?",
  },

  grateful: {
    acknowledgement: "It's lovely that you're noticing something to be grateful for.",
    reflection: "Gratitude can be easy to rush past. Pausing on it, even briefly, can help the feeling last a little longer.",
    thoughts: [
      thought("Noticing what's good doesn't erase what's hard. It just gives it company."),
      thought("Small good things count."),
    ],
    actions: [
      pair(
        "Tell someone you appreciate them",
        "Send a short message thanking someone for something specific.",
        5,
        ["Write down three good things", "Note three things, however small, that went well recently."],
      ),
      pair(
        "Savour it",
        "Take a couple of minutes to think about what you're grateful for in detail: who was involved, how it felt, why it mattered.",
        2,
        ["Name it", "Say to yourself what you're grateful for."],
      ),
    ],
    journal_prompt: "What is something small that made today better?",
  },
};

/** Used when a typed mood doesn't match any known state. */
export const GENERIC_ENTRY: LibraryEntry = {
  acknowledgement: "Thank you for checking in.",
  reflection:
    "Whatever you're feeling, it makes sense to pause and notice it. You don't need to fix it straight away. Just choose one small thing that would help.",
  thoughts: [
    thought("You don't have to have it all figured out to take one small step."),
    thought("Noticing how you feel is already a step."),
  ],
  actions: [
    pair(
      "Write down what's on your mind",
      "Spend a few minutes writing whatever is on your mind, without editing. Then underline the one thing that matters most.",
      5,
      ["Name the feeling", "Put what you're feeling into a single word or phrase."],
    ),
    breathe,
  ],
  journal_prompt: "What do you need most right now?",
};

/** Simple synonyms so typed moods still get a relevant library response. */
const SYNONYMS: Array<[RegExp, string]> = ([
  ["overwhelm|too much|swamped|drowning", "overwhelmed"],
  ["anxi|worr|nervous|panick|uneasy|on edge", "anxious"],
  ["stress|pressure|tense", "stressed"],
  ["sad|down\\b|low\\b|blue\\b|upset|heartbroken|grief|griev", "sad"],
  ["lonely|alone|isolated", "lonely"],
  ["stuck|blocked|procrastinat", "stuck"],
  ["unmotivated|no motivation|lazy|apathetic|meh\\b", "unmotivated"],
  ["tired|exhaust|drained|burn(t|ed)? ?out|sleepy|fatigue", "tired"],
  ["lost|confus|unsure|uncertain|directionless", "lost"],
  ["frustrat|annoyed|irritat", "frustrated"],
  ["angry|furious|mad\\b|rage", "angry"],
  ["calm|peaceful|relaxed|content", "calm"],
  ["hope|optimis", "hopeful"],
  ["motivated|driven|focused|productive|energi[sz]ed", "motivated"],
  ["inspired|creative|excited", "inspired"],
  ["grateful|thankful|happy|joy", "grateful"],
] as Array<[string, string]>).map(([words, id]) => [new RegExp(`\\b(?:${words})`), id]);

export function resolveMoodId(mood: string): string | undefined {
  const known = findMood(mood);
  if (known) return known.id;
  const lower = mood.toLowerCase();
  return SYNONYMS.find(([re]) => re.test(lower))?.[1];
}

/**
 * Build a complete intervention from the library.
 *
 * `variant` lets "another suggestion" and "another thought" rotate through the
 * options. Actions whose titles are in `exclude` are skipped where possible.
 */
export function buildLibraryIntervention(
  req: Pick<CheckInRequest, "mood" | "exclude">,
  variant = 0,
): Intervention {
  const id = resolveMoodId(req.mood);
  const entry = (id && LIBRARY[id]) || GENERIC_ENTRY;
  const exclude = new Set((req.exclude ?? []).map((t) => t.toLowerCase()));

  const fresh = entry.actions.filter((p) => !exclude.has(p.action.title.toLowerCase()));
  const pool = fresh.length > 0 ? fresh : entry.actions;
  const chosen = pool[variant % pool.length];
  const offset = variant + (req.exclude?.length ?? 0);

  return {
    acknowledgement: entry.acknowledgement,
    reflection: entry.reflection,
    quote: entry.thoughts[offset % entry.thoughts.length],
    action: chosen.action,
    alternative_action: chosen.alternative,
    journal_prompt: entry.journal_prompt,
    origin: "library",
  };
}

/** Every mood in the taxonomy must have a library entry. */
export const LIBRARY_COVERAGE = MOODS.every((m) => m.id in LIBRARY);
