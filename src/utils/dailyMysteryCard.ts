export interface DailyMysteryCard {
  title: string;
  body: string;
}

const CARDS: DailyMysteryCard[] = [
  { title: "Today's signal",       body: "One hidden axis may shift with today's answers." },
  { title: "Today's curiosity",    body: "Your next answers may begin to resolve a pattern." },
  { title: "Beneath the surface",  body: "Something you haven't named yet may be emerging." },
  { title: "A quiet shift",        body: "Some signals move in unexpected directions. Stay curious." },
  { title: "The unseen layer",     body: "Today's answers might clarify something the pattern has been circling." },
  { title: "Signal in motion",     body: "One dimension is currently in flux. More answers will settle it." },
  { title: "An open question",     body: "Not everything is resolved yet — that's where the interesting parts are." },
  { title: "Pattern forming",      body: "Today's responses may add weight to an axis that's been quiet." },
  { title: "Internal complexity",  body: "Tensions in your pattern are a feature, not a flaw." },
  { title: "Toward clarity",       body: "One more layer may become visible with a few honest answers." },
  { title: "Hidden in plain sight", body: "Your strongest signal might not be where you expect it." },
  { title: "The pattern knows",    body: "Some answers have already pointed in a direction you may not have noticed." },
  { title: "What you reveal",      body: "The questions you answer quickly say something the slow ones can't." },
  { title: "Edge of the map",      body: "There's still territory your profile hasn't fully charted." },
  { title: "Convergence",          body: "Multiple dimensions may be pointing in the same direction today." },
];

export function getDailyMysteryCard(): DailyMysteryCard {
  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash * 31) + dateStr.charCodeAt(i)) >>> 0;
  }
  return CARDS[hash % CARDS.length];
}
