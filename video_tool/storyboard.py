"""Generate visual metadata for each scene."""
import re

# Keyword → (primary_query, fallback_query, emotion)
KEYWORD_RULES: list[tuple[list[str], str, str, str]] = [
    # Healthcare system / waiting
    (["kolejk", "czekaj", "termin", "miesią"], "hospital waiting room empty chairs", "empty waiting room hallway", "frustration"),
    (["SOR", "pogotow", "ratunk"], "emergency room hospital entrance", "hospital emergency corridor", "urgency"),
    (["szpital", "oddział", "hospitali"], "hospital corridor empty", "clinic hallway lights", "cold"),
    # Doctors / medical staff
    (["lekarz", "doktor", "specjalista"], "tired doctor at desk paperwork", "doctor writing documents office", "exhaustion"),
    (["pielęgniark", "personel medycz"], "nurse walking hospital corridor", "medical staff hallway", "routine"),
    (["młody lekarz", "specjalizacj"], "young doctor hospital hallway serious", "medical intern paperwork", "anxiety"),
    (["ordynator", "hierarchi", "przełożon"], "doctor office desk authority", "hospital senior doctor desk", "power"),
    # Rehabilitation
    (["rehabilitacj", "kinezyterapia", "fizjoterapia", "ćwiczen"], "physiotherapy rehabilitation exercise", "patient physical therapy", "effort"),
    (["laser", "prąd", "ultradźwięk", "aparat", "zabieg"], "physiotherapy machine treatment", "medical device therapy", "clinical"),
    # Paperwork / bureaucracy
    (["dokument", "papier", "formularz", "druk"], "medical documents paperwork desk", "bureaucracy papers office", "bureaucracy"),
    (["NFZ", "kontrakt", "rozliczen", "procedur"], "government office paperwork bureaucracy", "administrative documents desk", "systemic"),
    (["skierowanie", "recepta", "wynik"], "medical prescription documents desk", "doctor writing prescription", "routine"),
    (["historia choroby", "dokumentacj"], "medical records files stack", "patient file documents", "cold"),
    # Money / system
    (["pieniądz", "miliard", "budżet", "nakład", "koszt", "finans"], "government budget documents money", "office financial papers", "systemic"),
    (["prywatnie", "prywatny"], "private clinic entrance door", "medical office door sign", "class"),
    # Pain / suffering
    (["ból", "boli", "bólowy", "cierpien"], "person holding back pain", "patient pain expression", "pain"),
    (["kręgosłup", "noga", "promieniuje"], "back pain spine anatomy", "person back pain seated", "pain"),
    (["spać", "sen", "bezsenno"], "person sleepless night dark", "man awake at night", "exhaustion"),
    # Psychological
    (["strach", "lęk", "boi się", "bać się"], "person anxious worried waiting", "man waiting nervous", "anxiety"),
    (["depresj", "przewlekł", "chronicz"], "person alone sitting window sad", "lonely person indoors dark", "despair"),
    # City / night / atmosphere
    (["miasto", "noc", "nocturn", "ulica"], "city night rain street dark", "urban night empty street", "cold"),
    (["zamknięte drzwi", "zamknięt", "drzwi"], "closed door hospital corridor", "shut door hallway", "rejection"),
    # Computer / typing
    (["komputer", "typ", "wpisuj", "system informatycz"], "person typing computer office", "computer screen typing night", "bureaucracy"),
    # Patient as coordinator
    (["koordynator", "zbiera", "nosi", "pilnuje"], "person organizing medical documents", "patient paperwork home", "overwhelm"),
    # Error / failure
    (["błąd medycz", "zaniedbanie", "powikłan"], "empty hospital corridor shadow", "closed hospital door dark", "dread"),
    # Default fallback categories
    (["Marek"], "man waiting hospital chair", "person alone waiting room", "isolation"),
    (["system", "mechani", "struktur"], "bureaucracy documents office overhead", "government building corridor", "systemic"),
    (["polityk", "rząd", "wybor"], "government building facade", "empty parliament hall", "cynicism"),
    (["media", "konflikt"], "empty television studio dark", "news desk empty", "detachment"),
]

FALLBACK_QUERIES = [
    ("hospital waiting room empty chairs", "clinic hallway fluorescent lights"),
    ("empty hospital corridor night", "medical building entrance dark"),
    ("doctor tired desk paperwork", "physician writing documents"),
    ("bureaucracy papers office desk", "government documents stack"),
    ("patient sitting alone waiting", "person waiting room isolated"),
    ("physiotherapy exercise rehabilitation", "medical equipment room"),
    ("city night rain window", "urban street night empty"),
    ("closed door hallway shadow", "corridor empty door shut"),
]


def _match_keywords(text: str) -> tuple[str, str, str]:
    text_lower = text.lower()
    for keywords, query, fallback, emotion in KEYWORD_RULES:
        for kw in keywords:
            if kw.lower() in text_lower:
                return query, fallback, emotion
    # Default
    return "empty hospital corridor", "waiting room chairs", "cold"


def _is_strong_line(text: str) -> bool:
    """Detect rhetorically powerful short fragments for lower-thirds."""
    stripped = text.strip()
    if len(stripped) > 120:
        return False
    strong_patterns = [
        r"^Czekanie może być",
        r"^Bo w Polsce",
        r"^System .{0,30} nie jest",
        r"^A choroba",
        r"^Nie chorować\.",
        r"^I to jest moment",
        r"^Ochrona zdrowia nie powinna być",
        r"^Dla systemu sukces",
        r"^Dla pacjenta sukces",
        r".*labiryntem.*",
        r".*produkt końcowy.*",
        r".*prawa do czasu.*",
    ]
    for pat in strong_patterns:
        if re.search(pat, stripped):
            return True
    return False


def enrich_scene(scene: dict, scene_index: int) -> dict:
    """Add visual metadata to a scene dict."""
    if scene.get("is_title_card"):
        scene["stock_query"] = "empty hospital corridor dark"
        scene["fallback_query"] = "clinic hallway night"
        scene["emotion"] = "ominous"
        scene["visual_meaning"] = "Section title card"
        scene["lower_third"] = False
        scene["fallback_index"] = scene_index % len(FALLBACK_QUERIES)
        return scene

    text = scene["text"]
    query, fallback, emotion = _match_keywords(text)

    # Use shorter preview for storyboard display
    preview = text[:80] + "…" if len(text) > 80 else text

    scene["stock_query"] = query
    scene["fallback_query"] = fallback
    scene["emotion"] = emotion
    scene["visual_meaning"] = f"{emotion.title()} – {query}"
    scene["lower_third"] = _is_strong_line(text)
    scene["lower_third_text"] = text[:100] if scene["lower_third"] else ""
    scene["text_preview"] = preview
    scene["fallback_index"] = scene_index % len(FALLBACK_QUERIES)
    return scene


def build_storyboard(scenes: list[dict]) -> list[dict]:
    return [enrich_scene(s, i) for i, s in enumerate(scenes)]
