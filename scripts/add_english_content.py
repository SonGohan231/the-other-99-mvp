#!/usr/bin/env python3
"""Add English content columns to content.csv."""
import csv, io, sys, os

# English translations: id → (prompt_en, answer_options_en)
TRANSLATIONS = {
    "TO99-0001": ("Is there someone you've never been fully honest with — and you still think about it?", "Yes | No | Someone just came to mind"),
    "TO99-0002": ("If nobody knew your past, would you still choose the same version of yourself?", "Yes | No | Not sure"),
    "TO99-0003": ("Would you do something morally questionable if you were certain it would save someone you love?", "Yes | No | Depends how questionable"),
    "TO99-0004": ("Is there a decision that sent your life in a direction you never fully accepted?", "Yes | No"),
    "TO99-0005": ("Do you ever feel alone even when people are right next to you?", "Often | Sometimes | No"),
    "TO99-0006": ("Do you love the people closest to you the way you're supposed to?", "Yes | No | I'm not sure what I'm supposed to feel"),
    "TO99-0007": ("Are you more afraid of failing — or of succeeding and running out of excuses?", "Failing | Running out of excuses"),
    "TO99-0008": ("Does anyone truly know you — or do they know the version you show most often?", "They know me | They know my version | Not sure"),
    "TO99-0009": ("If nobody ever found out, would your values stay exactly the same?", "Yes | No | I'm not sure"),
    "TO99-0010": ("Are you more afraid of death — or of wasting your life before it comes?", "Death | Wasting my life"),
    "TO99-0011": ("Is it easier for you to walk away from someone — or to stay too long?", "Walk away | Stay too long"),
    "TO99-0012": ("What wears you down more — the work itself, or the feeling it isn't taking you anywhere?", "The work | The lack of direction"),
    "TO99-0013": ("What would give you more peace — more money, or fewer needs?", "More money | Fewer needs"),
    "TO99-0014": ("Have you ever pretended to be busy so no one would notice you were alone?", "Yes | No | It happened"),
    "TO99-0015": ("Do you feel relief when someone else makes the decision for you?", "Yes | No | Sometimes"),
    "TO99-0016": ("Do you miss the future that doesn't exist yet — or the past you can't get back?", "The future | The past"),
    "TO99-0017": ("Does technology more often make you feel powerful — or like you can't keep up?", "Powerful | Can't keep up"),
    "TO99-0018": ("In nature, do you feel more peace — or boredom?", "Peace | Boredom"),
    "TO99-0019": ("Do you more often regret what you did — or what you never tried?", "What I did | What I never tried"),
    "TO99-0020": ("Do you have a version of yourself that you hide even from people close to you?", "Yes | No | I can't say"),
    "TO99-0021": ("Is truth more important than peace?", "Yes | No | Depends on the cost"),
    "TO99-0022": ("Are there subjects in your family that nobody touches — even though everyone knows they exist?", "Yes | No | Probably"),
    "TO99-0023": ("Would success still feel like success without anyone else knowing?", "Yes | No | Not sure"),
    "TO99-0024": ("Is it easier for you to start something new — or to finish something old?", "Start something new | Finish the old"),
    "TO99-0025": ("Can you admit when you need someone?", "Yes | No | Only when it's really necessary"),
    "TO99-0026": ("Do you forgive others faster than you forgive yourself?", "Others | Myself"),
    "TO99-0027": ("Does silence at home mostly calm you — or weigh on you?", "Calm me | Weigh on me"),
    "TO99-0028": ("Do you want to be understood more — or admired more?", "Understood | Admired"),
    "TO99-0029": ("Would you rather have less freedom with clear rules — or more freedom with more chaos?", "Clear rules | More freedom"),
    "TO99-0030": ("Do you associate money more with freedom — or with security?", "Freedom | Security"),
    "TO99-0031": ("Can you be a good person and still consciously hurt someone?", "Yes | No | Depends why"),
    "TO99-0032": ("Do you prefer solving a problem yourself — or finding an app to do it for you?", "By myself | With an app"),
    "TO99-0033": ("Do plants and animals calm you more easily than people do?", "Yes | No | Sometimes"),
    "TO99-0034": ("Do you like knowing what comes next?", "Yes | No | Only for important things"),
    "TO99-0035": ("Do you more often imagine the perfect life — or analyze why you don't have it yet?", "Imagine it | Analyze why"),
    "TO99-0036": ("Is it easier to promise yourself change — or to take the first small step?", "Promise change | Take the step"),
    "TO99-0037": ("Does planning the future give you energy — or stress?", "Energy | Stress"),
    "TO99-0038": ("Is it easier to say what you think — or what you feel?", "What I think | What I feel"),
    "TO99-0039": ("Do people often mistake your silence for calm?", "Yes | No | Sometimes"),
    "TO99-0040": ("Are you more afraid of rejection — or of being truly seen?", "Rejection | Being truly seen"),
    "TO99-0041": ("In the morning, do you prefer silence — or contact with people right away?", "Silence | Contact"),
    "TO99-0042": ("Do you notice problems first — or possibilities?", "Problems | Possibilities"),
    "TO99-0043": ("Do you prefer working from a list — or improvising along the way?", "A list | Improvising"),
    "TO99-0044": ("Does a walk with no destination sound pleasant — or pointless?", "Pleasant | Pointless"),
    "TO99-0045": ("Do new gadgets mostly interest you — or annoy you?", "Interest me | Annoy me"),
    "TO99-0046": ("In a group, do you tend to watch — or take the lead?", "Watch | Take the lead"),
    "TO99-0047": ("Do you like having time to spare — or do you work best under pressure?", "Time to spare | Under pressure"),
    "TO99-0048": ("Do you more often start new things — or finish old ones?", "Start new | Finish old"),
    "TO99-0049": ("Is intention or outcome more important to you?", "Intention | Outcome"),
    "TO99-0050": ("Do you like having a plan for the next year?", "Yes | No | Just a rough one"),
    "TO99-0051": ("Do you easily notice when someone is pretending everything is fine?", "Yes | No | Sometimes"),
    "TO99-0052": ("Do you prefer one bigger risk — or many small steps?", "One big risk | Small steps"),
    "TO99-0053": ("Do you value calm more — or intensity?", "Calm | Intensity"),
    "TO99-0054": ("Is it easier to listen — or to talk about yourself?", "Listen | Talk about myself"),
    "TO99-0055": ("Does saving money feel more calming — or restricting?", "Calming | Restricting"),
    "TO99-0056": ("Do you prefer a paper notebook — or an app?", "Paper | App"),
    "TO99-0057": ("Does rain outside mostly calm you — or kill your mood?", "Calms me | Kills my mood"),
    "TO99-0058": ("Do you prefer starting imperfectly — or waiting until you're ready?", "Start imperfectly | Wait until ready"),
    "TO99-0059": ("Is silence sometimes more honest than the truth?", "Yes | No | Depends"),
    "TO99-0060": ("What tires you faster — noise, or monotony?", "Noise | Monotony"),
    "TO99-0061": ("Do you write your ideas down — or trust they'll come back?", "Write them down | Trust they'll return"),
    "TO99-0062": ("Do you prefer clear tasks — or ones you can make your own?", "Clear tasks | My own way"),
    "TO99-0063": ("After a conflict, do you need a conversation — or time alone?", "A conversation | Time alone"),
    "TO99-0064": ("Do you like changing your mind when you get new information?", "Yes | No | Depends"),
    "TO99-0065": ("Does clutter distract you — or not matter?", "Distracts me | Doesn't matter"),
    "TO99-0066": ("Do you more often think about what's coming — or what's happening now?", "What's coming | What's now"),
    "TO99-0067": ("Do you rest more easily without a screen?", "Yes | No | Sometimes"),
    "TO99-0068": ("Does automation mostly excite you — or make you suspicious?", "Excites me | Makes me suspicious"),
    "TO99-0069": ("Do you tend to feel first and understand later — or the other way?", "Feel then understand | Understand then feel"),
    "TO99-0070": ("Should rules be flexible in exceptional situations?", "Yes | No | Depends"),
    "TO99-0071": ("Are you easier to move when there's a deadline?", "Yes | No"),
    "TO99-0072": ("Do you prefer a few close people — or many casual ones?", "A few close | Many casual"),
    "TO99-0073": ("Do you like being hard to label?", "Yes | No"),
    "TO99-0074": ("Do you prefer finishing something good — or perfecting it until it's great?", "Finish the good | Perfect until great"),
    "TO99-0075": ("Do you like surprises?", "Yes | No | Only good ones"),
    "TO99-0076": ("Do you have more ideas than time?", "Yes | No"),
    "TO99-0077": ("Do you like having a backup plan?", "Yes | No"),
    "TO99-0078": ("Does a forest work better on you than a city center?", "Yes | No | Depends on the day"),
    "TO99-0079": ("Do you like testing new apps?", "Yes | No"),
    "TO99-0080": ("Do you prefer starting the day slowly — or jumping straight in?", "Slowly | Jump straight in"),
    "TO99-0081": ("Is 'I miss you' easier to say than 'I'm angry'?", "I miss you | I'm angry"),
    "TO99-0082": ("Do you sometimes avoid things you really want — because you're afraid they might actually matter?", "Yes | No | Sometimes"),
    "TO99-0083": ("Does your sense of humor hide more than it reveals?", "Yes | No | Sometimes"),
    "TO99-0084": ("Can loyalty to one person justify injustice toward another?", "Yes | No | Depends"),
    "TO99-0085": ("What bothers you more — boredom, or losing control?", "Boredom | Losing control"),
    "TO99-0086": ("Have you ever won something that later turned out to be a loss?", "Yes | No | Not sure"),
    "TO99-0087": ("Have you ever been more attached to a memory of someone than to the person themselves?", "Yes | No | Possibly"),
    "TO99-0088": ("Do people see you as stronger than you feel?", "Yes | No | Sometimes"),
    "TO99-0089": ("Do you sometimes avoid responding because the reply would require pretending you're fine?", "Yes | No | Sometimes"),
    "TO99-0090": ("Is there something you'd never tell anyone — even if you knew you'd be understood?", "Yes | No | Not sure"),
    "TO99-0091": ("Do you procrastinate more with hard things — or boring ones?", "Hard things | Boring ones"),
    "TO99-0092": ("Is it easier to ask for practical help — or emotional support?", "Practical help | Emotional support"),
    "TO99-0093": ("Do you like starting from a blank page?", "Yes | No | Depends on the subject"),
    "TO99-0094": ("Do you prefer fixing something by hand — or finding a digital solution?", "By hand | Digital"),
    "TO99-0095": ("Does soil on your hands feel more like dirt — or grounding?", "Dirt | Grounding"),
    "TO99-0096": ("Would you rather be fair — or merciful?", "Fair | Merciful"),
    "TO99-0097": ("Do you more often defend your independence — or your peace?", "My independence | My peace"),
    "TO99-0098": ("Does the future feel more like a calling — or a deadline?", "A calling | A deadline"),
    "TO99-0099": ("What hurts more — the lack of closeness, or closeness without honesty?", "Lack of closeness | Closeness without honesty"),
    "TO99-0100": ("Is there something in your life you keep defending only because you're afraid to admit you don't want it anymore?", "Yes | No | This question stopped me"),
    "TO99-0101": ("I sometimes regret not what I did, but who I had to become to survive it.", "Me too | Sometimes | Not me"),
    "TO99-0102": ("I have a conversation in my head I never had — but I keep returning to it for years.", "Me too | I used to | No"),
    "TO99-0103": ("My biggest fear is that one day I'll realize I've been lying to myself.", "Me too | Sometimes | No"),
    "TO99-0104": ("I sometimes miss who I was before I understood everything.", "Me too | Sometimes | No"),
    "TO99-0105": ("Some of my biggest wins looked better from the outside than they felt inside.", "Me too | Sometimes | No"),
    "TO99-0106": ("I don't reply sometimes not because I don't want to — but because I can't be their version of me right now.", "Me too | Sometimes | No"),
    "TO99-0107": ("I sometimes envy people who simply know what they want.", "Me too | Sometimes | No"),
    "TO99-0108": ("I act casual sometimes when I actually care a lot.", "Me too | Sometimes | No"),
    "TO99-0109": ("Some days I don't want advice. I just want someone to notice it's heavy.", "Me too | Sometimes | No"),
    "TO99-0110": ("I'm sometimes more afraid of rest than work — because that's when I hear my own thoughts.", "Me too | Sometimes | No"),
    "TO99-0111": ("I like helping, but sometimes I resent that nobody notices how much it costs me.", "Me too | Sometimes | No"),
    "TO99-0112": ("I sometimes buy things not because I need them — but to feel something shift.", "Me too | Sometimes | No"),
    "TO99-0113": ("I don't always miss people. Sometimes I miss how I felt around them.", "Me too | Sometimes | No"),
    "TO99-0114": ("I sometimes do everything right and still feel like I'm standing still.", "Me too | Sometimes | No"),
    "TO99-0115": ("I'd rather be needed than ask to be needed.", "Me too | Sometimes | No"),
    "TO99-0116": ("I keep things I don't use because they're proof that a version of me once existed.", "Me too | Sometimes | No"),
    "TO99-0117": ("It's sometimes easier to worry about the future than to trust things will work out.", "Me too | Sometimes | No"),
    "TO99-0118": ("I plan some changes so long they start replacing the actual doing.", "Me too | Sometimes | No"),
    "TO99-0119": ("I sometimes delay messages because I want to answer well — and then it's too late.", "Me too | Sometimes | No"),
    "TO99-0120": ("I like being alone. But I don't like feeling left out.", "Me too | Sometimes | No"),
    "TO99-0121": ("I sometimes make a list just to feel like I'm in control of the chaos.", "Me too | Sometimes | No"),
    "TO99-0122": ("I sometimes double-check things I already know are fine.", "Me too | Sometimes | No"),
    "TO99-0123": ("I sometimes love when it rains — because the world slows down for a while.", "Me too | Sometimes | No"),
    "TO99-0124": ("I sometimes download new apps just because they promise a fresh start.", "Me too | Sometimes | No"),
    "TO99-0125": ("I sometimes tidy up instead of dealing with what actually matters.", "Me too | Sometimes | No"),
    "TO99-0126": ("I like having one small thing that's entirely mine.", "Me too | Sometimes | No"),
    "TO99-0127": ("I sometimes let calls go to voicemail because I don't have space for a conversation.", "Me too | Sometimes | No"),
    "TO99-0128": ("There are places I revisit in my mind more than in real life.", "Me too | Sometimes | No"),
    "TO99-0129": ("I sometimes prefer planning over starting — because planning feels safe.", "Me too | Sometimes | No"),
    "TO99-0130": ("I sometimes want to disappear for one day without explaining why.", "Me too | Sometimes | No"),
    "TO99-0131": ("I'm sometimes more relieved by cancelled plans than I'd ever admit.", "Me too | Sometimes | No"),
    "TO99-0132": ("I like having something to do — even when I complain about having too much.", "Me too | Sometimes | No"),
    "TO99-0133": ("I'm sometimes afraid rest will throw me off rhythm.", "Me too | Sometimes | No"),
    "TO99-0134": ("I'd rather know a sad truth than live in a comfortable assumption.", "Me too | Sometimes | No"),
    "TO99-0135": ("Sometimes I feel more like I'm waiting for my life than living it.", "Me too | Sometimes | No"),
    "TO99-0136": ("The most intimate thing is sometimes not the body — it's someone seeing through the act.", "Me too | Sometimes | No"),
    "TO99-0137": ("There are things I've forgiven out loud but not inside.", "Me too | Sometimes | No"),
    "TO99-0138": ("I sometimes miss someone most when I know I wouldn't want them back.", "Me too | Sometimes | No"),
    "TO99-0139": ("I have songs I don't play because they move me somewhere too fast.", "Me too | Sometimes | No"),
    "TO99-0140": ("Sometimes I can't tell if I'm tired of people — or tired of who I become around them.", "Me too | Sometimes | No"),
    "TO99-0141": ("Write one sentence you never sent to someone who still moves something in you. Don't send it. Just write it.", "Done | Skip | This stopped me"),
    "TO99-0142": ("Write the name of something you keep defending even though you know it no longer serves you.", "Done | Skip | I can't name it"),
    "TO99-0143": ("Do nothing for one minute. Then mark what came first: calm, boredom, anxiety, or the urge to do something.", "Calm | Boredom | Anxiety | The urge"),
    "TO99-0144": ("Write in your notes: 'I don't have to solve my entire life today.' Mark whether you felt resistance.", "No resistance | With resistance | Won't do it"),
    "TO99-0145": ("Pick one thing you're still pretending about. Don't write it here. Just mark whether you know what it is.", "I know | I don't know | I'm afraid to know"),
    "TO99-0146": ("For 30 seconds, think about someone you can't fully forgive. Then choose: anger, sadness, indifference, or chaos.", "Anger | Sadness | Indifference | Chaos"),
    "TO99-0147": ("Write three words that best describe your current state. You don't have to show them to anyone.", "Done | I don't want to | I can't"),
    "TO99-0148": ("Close one tab, app, or thing that has your attention for no good reason.", "Done | Not now | Not sure which"),
    "TO99-0149": ("Write down something you actually want — but talk about like a joke.", "Done | Skip | That was too accurate"),
    "TO99-0150": ("Pick one unfinished thing. Make the smallest possible move on it for 2 minutes.", "Done | Won't do it | I'll pick it later"),
    "TO99-0151": ("Write one sentence that starts with: 'If I weren't afraid of judgment, I would...'", "Done | Skip | I don't know"),
    "TO99-0152": ("For one minute, look at something you've owned for a long time. Mark whether you're keeping it out of need, sentiment, or habit.", "Need | Sentiment | Habit"),
    "TO99-0153": ("Do one thing 10% simpler than usual.", "Done | Not now | That's hard"),
    "TO99-0154": ("Leave one thing unsaid and see if the world falls apart.", "Done | Can't | Skip"),
    "TO99-0155": ("Make one small decision faster than usual today.", "Done | Didn't work | Not trying"),
    "TO99-0156": ("For 5 minutes, don't optimize anything. Do it good enough.", "Done | Hard | Skip"),
    "TO99-0157": ("Write one thing you're grateful to yourself for — that you rarely admit.", "Done | Not sure | Skip"),
    "TO99-0158": ("Walk through a room more slowly than usual. Notice one thing you've never seen before.", "Done | Not now | No point"),
    "TO99-0159": ("Don't check one app you reach for automatically — for 10 minutes.", "Done | Didn't work | Skip"),
    "TO99-0160": ("Write one sentence starting with: 'Today it's enough if...'", "Done | Not sure | Skip"),
    "TO99-0161": ("Choose one thing you'll do today without looking for the perfect method.", "Done | Not sure | Not today"),
    "TO99-0162": ("Write one thought that keeps coming back to you over the past few days.", "Done | Skip | I don't have one"),
    "TO99-0163": ("Ask yourself: 'Is this actually mine — or did I inherit it?' Then mark your reaction.", "Mine | Inherited | Not sure"),
    "TO99-0164": ("Do one thing analog: a note, a list, a sketch — on paper.", "Done | No way to | Skip"),
    "TO99-0165": ("Write one thing you've been saying 'someday' about — even though you know it's fear.", "Done | Not sure | Skip"),
    "TO99-0166": ("Think of your last 'yes' that should have been 'no.' Mark whether it came to you immediately.", "Immediately | After a moment | It didn't come"),
    "TO99-0167": ("Write: 'I don't have to be easy to love to deserve closeness.' Mark what you felt.", "Relief | Resistance | Sadness | Nothing"),
    "TO99-0168": ("Choose one thing you do for your self-image rather than for yourself. Don't write it. Just mark whether you know.", "I know | I don't know | I don't want to know"),
    "TO99-0169": ("Write one sentence you'd say to a younger version of yourself — without lecturing.", "Done | Not sure | Skip"),
    "TO99-0170": ("Pick one thing today that you don't have to prove to anyone.", "Chosen | Not sure | Skip"),
    "TO99-0171": ("Game: choose a door. A: everyone tells you the truth for 24 hours. B: for 24 hours, nobody's opinion affects you. Which do you pick?", "A: others' truth | B: nothing affects me"),
    "TO99-0172": ("Game: you can erase one emotion for a week. You choose: fear, jealousy, regret, or loneliness.", "Fear | Jealousy | Regret | Loneliness"),
    "TO99-0173": ("Game: you get an envelope with one piece of information about your future. Do you open it — or burn it unread?", "Open it | Burn it"),
    "TO99-0174": ("Game: you can see one thing. A: who truly misses you. B: who pretends to like you. What do you choose?", "Who misses me | Who's pretending"),
    "TO99-0175": ("Game: choose a key. One opens the past, one the future, one other people's minds. Which do you take?", "The past | The future | Other minds"),
    "TO99-0176": ("Game: you have one excuse that always works. You use it for: work, relationships, family, or yourself.", "Work | Relationships | Family | Myself"),
    "TO99-0177": ("Game: you can recover one lost thing. Time, a person, courage, or peace. What do you choose?", "Time | A person | Courage | Peace"),
    "TO99-0178": ("Game: choose one social superpower. Read intentions, disappear from memory, speak without fear, or listen without pain.", "Read intentions | Disappear | Speak without fear | Listen without pain"),
    "TO99-0179": ("Game: you can reset one area of your life. Body, work, relationships, or where you live.", "Body | Work | Relationships | Where I live"),
    "TO99-0180": ("Game: choose a map. It leads to safety, freedom, love, or meaning. What do you take?", "Safety | Freedom | Love | Meaning"),
    "TO99-0181": ("Game: choose your day mode. Silence, connection, task, or adventure.", "Silence | Connection | Task | Adventure"),
    "TO99-0182": ("Game: choose an object. A compass, a lock, a mirror, or a tool.", "Compass | Lock | Mirror | Tool"),
    "TO99-0183": ("Game: you have an extra hour. You use it for sleep, order, conversation, or an idea.", "Sleep | Order | Conversation | An idea"),
    "TO99-0184": ("Game: choose a shelter. A home, a forest, a workshop, or a library.", "Home | Forest | Workshop | Library"),
    "TO99-0185": ("Game: choose one thing to protect. Time, energy, reputation, or freedom.", "Time | Energy | Reputation | Freedom"),
    "TO99-0186": ("Game: choose your fuel. Curiosity, calm, pressure, or recognition.", "Curiosity | Calm | Pressure | Recognition"),
    "TO99-0187": ("Game: you can hear one sentence from your future self. Do you want a warning, a confirmation, an instruction, or forgiveness?", "Warning | Confirmation | Instruction | Forgiveness"),
    "TO99-0188": ("Game: for one day, nobody can judge you. What do you do first?", "Rest | Tell the truth | Create something | Change how I look"),
    "TO99-0189": ("Game: you can trade one of your traits for peace. You give up: ambition, sensitivity, control, or pride.", "Ambition | Sensitivity | Control | Pride"),
    "TO99-0190": ("Game: two versions of your life are in front of you. One is peaceful — but you'll never know who you could have been. The other is risky, but real. What do you choose?", "Peaceful | Risky and real"),
    "TO99-0191": ("The more you try to control it, the more it reveals what you're afraid of. What is it?", "The future | Self-image | A relationship | All three"),
    "TO99-0192": ("What can be both a shelter and a prison?", "Home | Routine | A relationship | Identity"),
    "TO99-0193": ("What grows when you share it — but shrinks when you try to prove it?", "Trust | Peace | Value | Closeness"),
    "TO99-0194": ("What is easiest to lose when everyone is watching?", "Calm | Authenticity | Courage | Direction"),
    "TO99-0195": ("What sounds like laziness but is sometimes exhaustion?", "Procrastination | Silence | Avoidance | Rest"),
    "TO99-0196": ("What has the most versions — but none of them is complete?", "A memory | An opinion | A plan | Me"),
    "TO99-0197": ("What often looks like a choice but is really just a habit?", "Work | A relationship | The phone | A reaction"),
    "TO99-0198": ("What makes no sound but can take up the entire day?", "A thought | Fear | A plan | A memory"),
    "TO99-0199": ("What can you have a lot of — and still feel you're running short?", "Time | Attention | Money | Meaning"),
    "TO99-0200": ("What dies when you finally tell the truth — but sometimes that's exactly when you start living?", "An illusion | A role | A relationship | Fear"),
}

# next_hook_en by rarity
NEXT_HOOK = {
    "legendary": "3 more answers before your first hidden profile signal.",
    "epic": "Keep going — the system is building your pattern.",
    "rare": "The more honest you are, the clearer the signal.",
    "standard": "Every answer adds to your profile map.",
}
# override by content_type
NEXT_HOOK_TYPE = {
    "secret": "Your profile just picked up a new emotional signal.",
    "dare": "This choice leaves a trace in your hidden profile.",
    "game": "Your choice reveals a preference pattern.",
    "riddle": "The answer you chose reveals how you frame your world.",
}

# reward_en by rarity
REWARD = {
    "legendary": "A defining answer. This question leaves a strong trace.",
    "epic": "A meaningful signal. The system picked this up.",
    "rare": "An uncommon answer. You're in the minority here.",
    "standard": "A clear signal added to your profile map.",
}

# profile_fragment_en by content_type
PROFILE_FRAGMENT = {
    "question": "A pattern fragment detected.",
    "secret": "An emotional resonance recorded.",
    "dare": "A behavioral trace collected.",
    "game": "A preference signal captured.",
    "riddle": "A cognitive pattern noted.",
}

# archetype_hint_en by rarity
ARCHETYPE_HINT = {
    "legendary": "Shadow archetype fragment",
    "epic": "Core pattern signal",
    "rare": "Secondary pattern signal",
    "standard": "Base layer signal",
}

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, '..', 'public', 'content.csv')

    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        content = f.read()

    reader = csv.DictReader(io.StringIO(content), delimiter=';')
    fieldnames = reader.fieldnames or []
    rows = list(reader)

    # Add new columns after existing ones
    new_cols = ['prompt_en', 'answer_options_en', 'next_hook_en', 'reward_en', 'profile_fragment_en', 'archetype_hint_en']
    # Remove if already exist
    for c in new_cols:
        if c in fieldnames:
            fieldnames = [f for f in fieldnames if f != c]
    fieldnames = list(fieldnames) + new_cols

    # id key (may have BOM)
    id_key = [k for k in rows[0].keys() if 'id' in k.lower()][0]

    for row in rows:
        rid = row[id_key]
        ct = row.get('content_type', '')
        rt = row.get('rarity_tier', '')

        t = TRANSLATIONS.get(rid, ('', ''))
        row['prompt_en'] = t[0]
        row['answer_options_en'] = t[1]
        row['next_hook_en'] = NEXT_HOOK_TYPE.get(ct, NEXT_HOOK.get(rt, ''))
        row['reward_en'] = REWARD.get(rt, '')
        row['profile_fragment_en'] = PROFILE_FRAGMENT.get(ct, '')
        row['archetype_hint_en'] = ARCHETYPE_HINT.get(rt, '')

    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=fieldnames, delimiter=';', lineterminator='\n')
    writer.writeheader()
    writer.writerows(rows)

    with open(csv_path, 'w', encoding='utf-8') as f:
        f.write(out.getvalue())

    print(f"Done. Updated {len(rows)} rows.")

if __name__ == '__main__':
    main()
