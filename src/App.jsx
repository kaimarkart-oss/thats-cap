import { useState, useEffect, useRef } from "react";
import { db } from './firebase';
import { doc, setDoc, updateDoc, onSnapshot, getDoc, arrayUnion } from 'firebase/firestore';

const ROUND_DURATION = 180;
const QUESTION_LIMIT = 5;

const STORY_BANK = [
  "I got a DUI while on a scooter in Miami.",
  "I know the birthplace of every president.",
  "I accidentally swallowed a metal ball from a mouse trap when i was 8 and have no idea what happened to it.",
  "I used to drink 6 cups of coffee a day before i knew what caffeine was.",
  "I've traveled to every state in the united states except florida.",
  "I tried to start a club for basket weaving in college because i thought it would get me laid.",
  "I started a cult in an online video game when i was 13.",
  "My childhood cat was named after my uncle who died in desert storm.",
  "I failed my drivers test multiple times because I couldn't remember where the turn signal was.",
  "My first concert was kid rock.",
  "I accidentally went on a date with my high school teacher.",
  "I can instantly smell if there is a mosquito in a room.",
  "I fell off a mountain bike into a patch of poison ivy.",
  "My highschools mascot was a Construction worker.",
  "I went to a one direction concert when i was a kid and decided mid concert that i wasnt a fan anymore.",
  "The first time i went on a vacation that i paid for, the resort flooded and i had to spend 6 days at Motel 5.",
  "I didn't get a smart phone until I won Battle of the Books.",
  "My childhood best friend is now in prison.",
  "My elementary school principle was the lead singer for \"Cold War Kids\".",
  "The first time i tried a carolina reaper i thought it was a fruit.",
  "I got stung by a jellyfish and a stranger peed on me without asking.",
  "I have a pellet from a BB gun lodged in my thigh from when i was 6.",
  "I sat next to an internet celebrity on a flight to LA who ignored me the entire flight.",
  "I won \"most likely to die in a tragic accident\" as a superlative in high school.",
  "I have a secret middle name that I never tell anyone because it's so embarrassing.",
  "My grandpa started a taxidermy business that got shut down after rumors that he worked on humans.",
  "I found a puppy when i was 12 that turned out to be a coyote.",
  "My great grandpa was the first openly gay man in the military.",
  "I have an aunt who claims she's hooked up with Bill Clinton.",
  "Up until i was 15 i couldn't pronounce Rs correctly.",
  "I know how to say \"i love you\" in mandarin and cantonese.",
  "I was recruited to play basketball by a private catholic school when i was in 6th grade because of my height.",
  "I got to meet my celebrity crush because i snuck backstage at their concert.",
  "I had a head injury when i was in junior high and could sing with perfect pitch for a month.",
  "I still watch Dora the Explorer reruns to help me go to sleep.",
  "Once a month i have a full conversation with a childhood friend in a language we invented.",
  "My 5th grade teacher got fired while we were on a field trip.",
  "I got fired from my first job for forgetting that i got hired.",
  "I wanted to study sociology in college but my therapist told me it was a bad idea.",
  "I can recite the alphabet with a single sound.",
  "The first thing i ever bought on ebay was (what i thought was) a lightsaber replica from star wars.",
  "I went to the midnight premiere for guardians of the galaxy and immediately fell asleep when i sat down in my chair.",
  "My first apartment I had as an adult was at 123 forty-fifth street.",
  "My grandma was the first woman to run an 11 second 100 yard dash.",
  "I've accidentally pooped at the top of 3 mountains, not planned.",
  "I made a comic about a lonely girl who was sad that she never sold any comics, but I never sold any.",
  "I graduated top of my class in 8th grade.",
  "My swim coach in high school was arrested in the middle of a swim meet.",
  "I was in a ship wreck and had to get air lifted.",
  "I crashed a moped into a fruit stand in vietnam.",
  "I got assaulted by an old woman on a trip to Japan.",
  "My school went to washington DC in 8th grade and we all found out that our teacher aid was a raging lunatic.",
  "My uncle trains his dogs to paint fine art.",
  "My first relationship was ended via locker note.",
  "I was once in a relationship for less than 3 hours.",
  "My first kiss was with a person who is now in prison.",
  "I got banned from playing any sports for a whole year in high school.",
  "My college mascot had to be changed while i was in school because it was so offensive.",
  "I have 12 moles on my back that spell out the word back.",
  "I was gifted a rare collection of quarters that i ended up spending on a beefy 5 layer burrito at Taco Bell.",
  "I did a famous person report and reenactment of Malcom X in 5th grade.",
  "I joined a co-ed basketball league my first year after college and met a guy who tried to sell me a synthetic drug that he invented.",
  "I once was so constipated that i ended up in the ER on valentines day.",
  "I got a speeding ticket the same day that i got my license.",
  "I went to prom with my doppelganger from school.",
  "I had a speech impediment when i was a kid and convinced my entire class that it was actually just a british accent.",
  "I lost my keys on a waterslide and had to take the greyhound home in just my swim suit.",
  "They made a movie about my hometown that is currently the worst rated movie on IMDB of 2008.",
  "I know the name of every prime minister in NATO.",
  "I went to high school with the guy who free soloed El Capitan in Yosemite.",
  "I have the school record for high jump at my high school.",
  "I have a secret recipe for chicken noodle soup that someone tried to buy off of me for $500 dollars.",
  "I had a dentist that tried to convince me that brushing my teeth was actually making my teeth worse and that i should just swish bleach around in my mouth once a week.",
  "During covid i got food poisoning so bad that i had to throw away my mattress.",
  "I got kicked out of a pottery class for accidentally making a vase that looked too much like a certain private part.",
  "I have a small line on my leg from when i bought a tattoo gun but gave it up after it hurt too bad.",
  "Some people think cilantro tastes like soap but it tastes like an eraser to me.",
  "I missed my flight when I was supposed to go study abroad but ended up just not going.",
  "Me and three friends are in a famous music video that you probably have seen.",
  "I'm currently playing a game of chess through a postcard with a penpal I met when I was 10.",
  "I sold an antique chair, that my grandma gave to me, to a thrift shop only to find out that it was worth over $5000 dollars years later.",
  "I got broken up with while i was at work as a cashier, they even waited in line to tell me.",
  "I know how to say hello in six different languages.",
  "I have a special technique for peeling oranges that works every time.",
  "I can do 10 pull-ups with my special technique.",
  "I won a talent show my junior year of high school by freestyle rapping.",
];

async function callClaude(messages, system) {
  const res = await fetch("/api/generate-stories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system }),
  });
  const data = await res.json();
  return data.content?.find(b => b.type === "text")?.text || "";
}

async function generateFakeStories(realStories) {
  const storiesText = realStories.map((s, i) => (i + 1) + '. "' + s + '"').join("\n");
  const shuffled = [...STORY_BANK].sort(() => Math.random() - 0.5);
  const examples = shuffled.slice(0, 6).map((s, i) => (i + 1) + '. "' + s + '"').join("\n");
  const prompt = 'You write fake personal stories for a party game called Thats Cap. They must sound like something a real person typed quickly on their phone - not polished, not clever, not trying to be funny.\n\nHere are examples of the tone, style, and energy level you should match. These are the gold standard:\n' + examples + '\n\nNow study the specific player\'s real stories below and mirror their exact vibe:\n' + storiesText + '\n\nWrite exactly 2 fake stories. Rules:\n- Match the style of the examples above: casual, specific, mildly weird, no punchlines\n- Use specific but mundane details: a real-sounding place, a specific number, a brand, a name - something that makes it feel lived-in\n- Avoid "once", "somehow", "surprisingly", or any narrative flourish\n- No punchlines. No tidy endings. Just a thing that happened.\n- Imperfect grammar is fine\n- Do NOT overlap with the real stories or the examples\n- Length: 1-2 sentences max\n\nBad: "I once found myself in an unexpectedly awkward situation when I accidentally walked into the wrong wedding."\nGood: "Went to the wrong wedding reception for like 20 minutes before anyone said anything."\n\nRespond ONLY with a JSON array of 2 strings. No explanation, no markdown, no backticks.';

  const text = await callClaude([{ role: "user", content: prompt }]);
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    return ["Ate gas station sushi in Ohio on a dare and was fine. My friend was not fine.", "Shared a hostel room with a guy who turned out to be on a dating show. Never saw the episode."];
  }
}

async function getAnswerHint(story, question, isTrue) {
  const prompt = 'You are helping a player in a party game.\nThe story: "' + story + '"\nThis story is ' + (isTrue ? "TRUE (real)" : "FALSE (made up)") + '.\nSomeone asked: "' + question + '"\n\nGive a SHORT, natural answer (1-2 sentences) the storyteller should say.\n' + (isTrue ? "Be truthful but add relatable detail." : "Craft a convincing lie with specific-sounding but vague details.") + '\nDo NOT mention whether it is true or false. Just give the answer text.';
  return callClaude([{ role: "user", content: prompt }]);
}

function buildRounds(players) {
  const rounds = [];
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  for (let pass = 0; pass < 2; pass++) {
    for (const player of shuffled) {
      const pool = [
        { text: player.stories[0], isTrue: true },
        { text: player.stories[1], isTrue: true },
        { text: player.fakeStories[0], isTrue: false },
        { text: player.fakeStories[1], isTrue: false },
      ];
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      rounds.push({ playerId: player.id, story: chosen });
    }
  }
  return rounds;
}

function Logo() {
  return (
    <div style={{ textAlign: "center", marginBottom: 8 }}>
      <img src="/thats_cap_LOGO_main.png" alt="That's Cap" style={{ width: 260, maxWidth: "100%" }} />
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: "#1a1a1a",
      border: "2px solid #333",
      borderRadius: 4,
      padding: "24px 28px",
      ...style,
    }}>{children}</div>
  );
}

function Btn({ children, onClick, color, disabled, small, style }) {
  const bg = color || "#f5c842";
  const textColor = color === "#e8573a" ? "#f5c842" : color === "#f5c842" ? "#e8573a" : "#e8573a";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#333" : bg,
        color: disabled ? "#666" : textColor,
        border: "none",
        borderRadius: small ? 20 : 28,
        padding: small ? "8px 20px" : "14px 32px",
        fontFamily: "'Lilita One', 'Fredoka One', Impact, sans-serif",
        fontSize: small ? 14 : 20,
        fontStyle: "italic",
        letterSpacing: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 4px 0 #00000066",
        transform: disabled ? "none" : "none",
        transition: "transform 0.1s, box-shadow 0.1s",
        // Wavy effect via border-radius
        borderTopLeftRadius: small ? 20 : 30,
        borderTopRightRadius: small ? 16 : 22,
        borderBottomRightRadius: small ? 20 : 30,
        borderBottomLeftRadius: small ? 16 : 22,
        ...style,
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "translateY(2px)"; e.currentTarget.style.boxShadow = "0 2px 0 #00000066"; }}
      onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = disabled ? "none" : "0 4px 0 #00000066"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = disabled ? "none" : "0 4px 0 #00000066"; }}
    >{children}</button>
  );
}

function TextInput({ value, onChange, placeholder, multiline, style }) {
  const shared = {
    background: "#111",
    border: "2px solid #444",
    borderRadius: 2,
    color: "#eee",
    fontFamily: "Courier New, monospace",
    fontSize: 14,
    padding: "10px 14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    ...style,
  };
  if (multiline) {
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...shared, resize: "vertical" }} />;
  }
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={shared} />;
}

function Timer({ seconds, total }) {
  const pct = seconds / total;
  const color = pct > 0.5 ? "#f5e642" : pct > 0.25 ? "#f5a623" : "#c4232a";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "Courier New", fontSize: 12, color: "#888" }}>TIME</span>
        <span style={{ fontFamily: "Bebas Neue, Impact", fontSize: 22, color }}>{seconds}s</span>
      </div>
      <div style={{ height: 6, background: "#333", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: (pct * 100) + "%", background: color, transition: "width 1s linear" }} />
      </div>
    </div>
  );
}

function HomeScreen({ onCreateLobby, onJoinLobby, joinError }) {
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [mode, setMode] = useState(null);

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "40px 20px" }}>
      <Logo />
      <div style={{ height: 32 }} />
      {!mode && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Btn onClick={() => setMode("create")} color="#e8573a">HOST A GAME</Btn>
          <Btn onClick={() => setMode("join")} color="#f5c842">JOIN A GAME</Btn>
        </div>
      )}
      {mode === "create" && (
        <Card>
          <p style={{ color: "#aaa", fontFamily: "Courier New", fontSize: 13, marginTop: 0 }}>Your name:</p>
          <TextInput value={playerName} onChange={setPlayerName} placeholder="Enter your name..." />
          <div style={{ height: 16 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => playerName.trim() && onCreateLobby(playerName.trim())} disabled={!playerName.trim()}>CREATE LOBBY</Btn>
            <Btn onClick={() => setMode(null)} color="#555" small>BACK</Btn>
          </div>
        </Card>
      )}
      {mode === "join" && (
        <Card>
          <p style={{ color: "#aaa", fontFamily: "Courier New", fontSize: 13, marginTop: 0 }}>Your name:</p>
          <TextInput value={playerName} onChange={setPlayerName} placeholder="Enter your name..." style={{ marginBottom: 12 }} />
          <p style={{ color: "#aaa", fontFamily: "Courier New", fontSize: 13 }}>Lobby code:</p>
          <TextInput value={joinCode} onChange={v => setJoinCode(v.toUpperCase())} placeholder="e.g. XKCD" />
          {joinError && <p style={{ fontFamily: "Courier New", fontSize: 12, color: "#e8573a", marginTop: 8, marginBottom: 0 }}>{joinError}</p>}
          <div style={{ height: 16 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => playerName.trim() && joinCode.trim() && onJoinLobby(joinCode.trim(), playerName.trim())} disabled={!playerName.trim() || !joinCode.trim()} color="#4ecdc4">JOIN</Btn>
            <Btn onClick={() => setMode(null)} color="#555" small>BACK</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

function LobbyScreen({ lobby, currentPlayerId, onSubmitStories, onStartGame }) {
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const isHost = lobby.hostId === currentPlayerId;
  const allSubmitted = lobby.players.length >= 2 && lobby.players.every(p => p.ready);

  const handleSubmit = () => {
    if (s1.trim() && s2.trim()) {
      onSubmitStories(s1.trim(), s2.trim());
      setSubmitted(true);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px" }}>
      <Logo />
      <div style={{ height: 24 }} />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "Courier New", color: "#aaa", fontSize: 12 }}>LOBBY CODE</span>
          <span style={{ fontFamily: "Bebas Neue, Impact", fontSize: 36, color: "#f5e642", letterSpacing: 6 }}>{lobby.code}</span>
        </div>
        <div style={{ height: 12 }} />
        <p style={{ fontFamily: "Courier New", fontSize: 12, color: "#666", margin: 0 }}>Players ({lobby.players.length}):</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {lobby.players.map(p => (
            <span key={p.id} style={{
              background: p.ready ? "#1a3a1a" : "#1a1a1a",
              border: "1px solid " + (p.ready ? "#2d7a2d" : "#444"),
              borderRadius: 2, padding: "4px 10px",
              fontFamily: "Courier New", fontSize: 12,
              color: p.ready ? "#5dbb5d" : "#aaa",
            }}>
              {p.ready ? "v " : "o "}{p.name}{p.id === lobby.hostId ? " (host)" : ""}
            </span>
          ))}
        </div>
      </Card>
      {!submitted ? (
        <Card>
          <p style={{ fontFamily: "Bebas Neue, Impact", fontSize: 18, letterSpacing: 2, color: "#f5e642", marginTop: 0 }}>YOUR TWO TRUE STORIES</p>
          <p style={{ fontFamily: "Courier New", fontSize: 11, color: "#666", marginBottom: 16, marginTop: 0 }}>
            Short, first-person. Real things that happened to you.
          </p>
          <TextInput value={s1} onChange={setS1} placeholder="Story #1..." multiline style={{ marginBottom: 10 }} />
          <TextInput value={s2} onChange={setS2} placeholder="Story #2..." multiline />
          <div style={{ height: 16 }} />
          <Btn onClick={handleSubmit} disabled={!s1.trim() || !s2.trim()}>LOCK IN STORIES</Btn>
        </Card>
      ) : (
        <Card>
          <p style={{ fontFamily: "Courier New", fontSize: 13, color: "#5dbb5d" }}>Stories locked. Waiting for others...</p>
          {isHost && allSubmitted && (
            <Btn onClick={onStartGame} color="#c4232a">START GAME</Btn>
          )}
          {isHost && !allSubmitted && (
            <p style={{ fontFamily: "Courier New", fontSize: 11, color: "#555" }}>Waiting for all players to submit before you can start.</p>
          )}
        </Card>
      )}
    </div>
  );
}

function LoadingScreen({ message }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <Logo />
      <div style={{ height: 40 }} />
      <div style={{ width: 48, height: 48, border: "3px solid #333", borderTop: "3px solid #f5e642", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 24 }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontFamily: "Courier New", color: "#888", fontSize: 13 }}>{message}{dots}</p>
    </div>
  );
}

function StorytellerView({ round, players, timeLeft, displayedTimeLeft, timerAccelerated, totalTime, questionAsked, hintLoading, hint, onSkip, skipLoading, heat, onRevealedChange }) {
  const { story } = round;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) {
      onRevealedChange?.(true);
      return () => onRevealedChange?.(false);
    }
  }, [revealed]);
  const canvasRef = useRef(null);
  const animHeatRef = useRef(heat);
  const animFrameRef = useRef(null);

  // Animate gauge
  useEffect(() => {
    const animate = () => {
      const diff = heat - animHeatRef.current;
      if (Math.abs(diff) > 0.3) {
        animHeatRef.current += diff * 0.1;
        drawGauge(canvasRef.current, animHeatRef.current);
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animHeatRef.current = heat;
        drawGauge(canvasRef.current, heat);
      }
    };
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [heat]);

  useEffect(() => { drawGauge(canvasRef.current, heat); }, []);

  const pct = Math.min(100, Math.max(0, heat));
  const meterColor = pct < 30 ? "#4ecdc4" : pct < 55 ? "#f5a623" : pct < 80 ? "#e05a00" : "#e8573a";
  const meterLabel = pct < 30 ? "sounds about right" : pct < 55 ? "you sure about that?" : pct < 80 ? "smells like cap" : "PANTS ON FIRE";
  const meterEmoji = pct < 30 ? "🧊" : pct < 55 ? "🌡️" : pct < 80 ? "🔥" : "🔥🔥";

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Lilita+One&display=swap');
        @keyframes timerFlash { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: "'Lilita One', Impact", fontSize: 13, letterSpacing: 2, color: "#555" }}>YOUR TURN</span>
        <span style={{
          fontFamily: "'Lilita One', Impact", fontSize: 13,
          color: story.isTrue ? "#5dbb5d" : "#e8573a",
          background: story.isTrue ? "#0d2a0d" : "#2a0d0d",
          padding: "4px 12px", borderRadius: 20,
        }}>
          {story.isTrue ? "TRUE STORY" : "IT'S A LIE"}
        </span>
      </div>

      {/* Timer */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontFamily: "Courier New", fontSize: 10, color: "#444", letterSpacing: 2 }}>TIME</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {timerAccelerated && <span style={{ fontFamily: "Courier New", fontSize: 9, color: "#ff3333", letterSpacing: 1, border: "1px solid #ff3333", borderRadius: 4, padding: "1px 5px", animation: "timerFlash 0.5s ease-in-out infinite" }}>2x</span>}
            <span style={{ fontFamily: "'Lilita One', Impact", fontSize: 20, color: timerAccelerated ? "#ff3333" : (timeLeft <= 10 ? "#e8573a" : "#f5c842"), animation: timerAccelerated ? "timerFlash 0.5s ease-in-out infinite" : "none" }}>{displayedTimeLeft}s</span>
          </div>
        </div>
        <div style={{ height: 8, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: (displayedTimeLeft / totalTime * 100) + "%", background: timerAccelerated ? "#ff3333" : (timeLeft <= 10 ? "#e8573a" : "#f5c842"), borderRadius: 4, transition: "width 0.5s linear" }} />
        </div>
      </div>

      {/* Pressure Gauge */}
      <div style={{ background: "#111", border: "2px solid #1e1e1e", borderRadius: 12, padding: "16px", marginBottom: 14, textAlign: "center" }}>
        <canvas ref={canvasRef} width={200} height={120} style={{ display: "block", margin: "0 auto" }} />
        <div style={{ fontFamily: "'Lilita One', Impact", fontSize: 14, color: meterColor, marginTop: 2 }}>
          {meterEmoji} {meterLabel}
        </div>
        <div style={{ fontFamily: "Courier New", fontSize: 9, color: "#333", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>pants on fire meter</div>
      </div>

      {/* Story card */}
      <div style={{
        background: story.isTrue ? "#0d1a0d" : "#1a0d0d",
        border: "2px solid " + (story.isTrue ? "#2d5a2d" : "#5a1a1a"),
        borderRadius: 12, padding: "18px 20px", marginBottom: 14,
      }}>
        <p style={{ fontFamily: "Courier New", fontSize: 10, color: "#555", marginTop: 0, letterSpacing: 2, textTransform: "uppercase" }}>your story this round</p>
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            style={{
              width: "100%", background: story.isTrue ? "#0d2a0d" : "#2a0d0d",
              border: "2px dashed " + (story.isTrue ? "#2d5a2d" : "#5a1a1a"),
              borderRadius: 8, padding: "20px 14px", cursor: "pointer",
              fontFamily: "'Lilita One', Impact", fontSize: 15,
              color: story.isTrue ? "#2d5a2d" : "#5a1a1a", letterSpacing: 1,
            }}
          >tap to read privately 👀</button>
        ) : (
          <div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 19, color: "#fff", lineHeight: 1.5, fontStyle: "italic", margin: 0 }}>"{story.text}"</p>
            <p style={{ fontFamily: "Courier New", fontSize: 10, color: "#444", marginBottom: 0, marginTop: 10 }}>memorize it, then put your phone face down</p>
          </div>
        )}
        {revealed && !story.isTrue && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #2a2a2a" }}>
            <button onClick={() => { setRevealed(false); onSkip(); }} disabled={skipLoading}
              style={{ background: "none", border: "1px solid #555", borderRadius: 20, color: skipLoading ? "#555" : "#aaa", fontFamily: "Courier New", fontSize: 11, padding: "6px 14px", cursor: skipLoading ? "not-allowed" : "pointer" }}>
              {skipLoading ? "generating..." : "generate alternate"}
            </button>
          </div>
        )}
      </div>

      {/* Tip / Q&A */}
      <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "14px 18px" }}>
        <p style={{ fontFamily: "Courier New", fontSize: 11, color: "#444", marginTop: 0 }}>
          {story.isTrue ? "Tell it like it is. Answer naturally." : "Sell it. Be specific but vague. Don't over-explain."}
        </p>
        {questionAsked && (
          <p style={{ fontFamily: "Courier New", fontSize: 12, color: "#f5a623", marginBottom: 0 }}>
            Question: <span style={{ color: "#fff" }}>{questionAsked}</span>
          </p>
        )}
        {hintLoading && <p style={{ fontFamily: "Courier New", fontSize: 12, color: "#555", margin: 0 }}>getting hint...</p>}
        {hint && !hintLoading && (
          <div style={{ background: "#1a1500", border: "1px solid #f5c84233", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
            <p style={{ fontFamily: "Courier New", fontSize: 10, color: "#f5c842", marginTop: 0, letterSpacing: 2 }}>SUGGESTED ANSWER</p>
            <p style={{ fontFamily: "Courier New", fontSize: 13, color: "#ddd", margin: 0 }}>{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function drawGauge(canvas, heat) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H * 0.75, r = W * 0.38;
  const startAngle = (210 * Math.PI) / 180;
  const sweepAngle = (240 * Math.PI) / 180;
  const endAngle = startAngle + sweepAngle;
  const pct = Math.min(100, Math.max(0, heat)) / 100;
  const color = heat < 30 ? "#4ecdc4" : heat < 55 ? "#f5a623" : heat < 80 ? "#e05a00" : "#e8573a";

  ctx.clearRect(0, 0, W, H);

  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = "#1e1e1e";
  ctx.lineWidth = 16; ctx.lineCap = "round";
  ctx.stroke();

  if (pct > 0) {
    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    grad.addColorStop(0, "#4ecdc4");
    grad.addColorStop(0.4, "#f5a623");
    grad.addColorStop(0.7, "#e05a00");
    grad.addColorStop(1, "#e8573a");
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + sweepAngle * pct);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 16; ctx.lineCap = "round";
    ctx.stroke();
    if (pct > 0.7) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + sweepAngle * pct);
      ctx.strokeStyle = color + "33"; ctx.lineWidth = 26; ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  for (let i = 0; i <= 10; i++) {
    const a = startAngle + (sweepAngle * i) / 10;
    const maj = i % 5 === 0;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - (maj ? 22 : 12)), cy + Math.sin(a) * (r - (maj ? 22 : 12)));
    ctx.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3));
    ctx.strokeStyle = maj ? "#555" : "#2a2a2a"; ctx.lineWidth = maj ? 2 : 1;
    ctx.stroke();
  }

  const na = startAngle + sweepAngle * pct;
  const nl = r - 24;
  ctx.beginPath(); ctx.moveTo(cx + 2, cy + 2); ctx.lineTo(cx + Math.cos(na) * nl + 2, cy + Math.sin(na) * nl + 2);
  ctx.strokeStyle = "#00000077"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(na) * nl, cy + Math.sin(na) * nl);
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fillStyle = "#2a2a2a"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
}

const REACTIONS = [
  { label: "you sure about that?", sound: "doubt", heat: 15 },
  { label: "that sounds like you", sound: "ding", heat: -10 },
  { label: "quit cappin'", sound: "buzzer", heat: 25 },
];

function PantsOnFireMeter({ heat }) {
  const pct = Math.min(100, Math.max(0, heat));
  const color = pct < 30 ? "#4ecdc4" : pct < 55 ? "#f5a623" : pct < 80 ? "#e05a00" : "#c4232a";
  const emoji = pct < 30 ? "🧊" : pct < 55 ? "🌡️" : pct < 80 ? "🔥" : "🔥🔥";
  const label = pct < 30 ? "sounds about right" : pct < 55 ? "you sure about that?" : pct < 80 ? "smells like cap" : "PANTS ON FIRE";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontFamily: "Courier New", fontSize: 10, letterSpacing: 2, color: "#555", textTransform: "uppercase" }}>pants on fire meter</span>
        <span style={{ fontFamily: "Courier New", fontSize: 11, color, fontWeight: "bold" }}>{emoji} {label}</span>
      </div>
      <div style={{ height: 10, background: "#1a1a1a", borderRadius: 5, overflow: "hidden", border: "1px solid #2a2a2a" }}>
        <div style={{
          height: "100%",
          width: pct + "%",
          background: "linear-gradient(90deg, #4ecdc4, " + color + ")",
          borderRadius: 5,
          transition: "width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s",
          boxShadow: pct > 70 ? "0 0 8px " + color : "none",
        }} />
      </div>
    </div>
  );
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "buzzer") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.45);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 180]);
    } else if (type === "doubt") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.15);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
      if (navigator.vibrate) navigator.vibrate([60, 30, 120]);
    } else if (type === "ding") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
      if (navigator.vibrate) navigator.vibrate([40]);
    }
  } catch (e) {}
}

function VoterView({ round, players, timeLeft, displayedTimeLeft, timerAccelerated, totalTime, questionsLeft, onAskQuestion, onVote, myVote, roundEnding, onReaction, heat }) {
  const [question, setQuestion] = useState("");
  const [lastReaction, setLastReaction] = useState(null);
  const [flashKey, setFlashKey] = useState(0);
  const canvasRef = useRef(null);
  const animHeatRef = useRef(heat);
  const animFrameRef = useRef(null);
  const teller = players.find(p => p.id === round.playerId);

  useEffect(() => {
    const animate = () => {
      const diff = heat - animHeatRef.current;
      if (Math.abs(diff) > 0.3) {
        animHeatRef.current += diff * 0.1;
        drawGauge(canvasRef.current, animHeatRef.current);
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animHeatRef.current = heat;
        drawGauge(canvasRef.current, heat);
      }
    };
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [heat]);

  useEffect(() => { drawGauge(canvasRef.current, heat); }, []);

  const handleAsk = () => {
    if (question.trim() && questionsLeft > 0) { onAskQuestion(question.trim()); setQuestion(""); }
  };

  const handleReaction = (r) => {
    playSound(r.sound);
    setLastReaction(r.label);
    setFlashKey(k => k + 1);
    onReaction(r.heat);
  };

  const meterPct = Math.min(100, Math.max(0, heat));
  const meterColor = meterPct < 30 ? "#4ecdc4" : meterPct < 55 ? "#f5a623" : meterPct < 80 ? "#e05a00" : "#e8573a";
  const meterLabel = meterPct < 30 ? "sounds about right" : meterPct < 55 ? "you sure about that?" : meterPct < 80 ? "smells like cap" : "PANTS ON FIRE";
  const meterEmoji = meterPct < 30 ? "🧊" : meterPct < 55 ? "🌡️" : meterPct < 80 ? "🔥" : "🔥🔥";

  // Vote screen (last 10s)
  if (roundEnding) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 20px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lilita+One&display=swap');
          @keyframes timerFlash { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        `}</style>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontFamily: "Courier New", fontSize: 10, color: "#444", letterSpacing: 2 }}>TIME</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {timerAccelerated && <span style={{ fontFamily: "Courier New", fontSize: 9, color: "#ff3333", letterSpacing: 1, border: "1px solid #ff3333", borderRadius: 4, padding: "1px 5px", animation: "timerFlash 0.5s ease-in-out infinite" }}>2x</span>}
              <span style={{ fontFamily: "'Lilita One', Impact", fontSize: 20, color: timerAccelerated ? "#ff3333" : "#e8573a", animation: timerAccelerated ? "timerFlash 0.5s ease-in-out infinite" : "none" }}>{displayedTimeLeft}s</span>
            </div>
          </div>
          <div style={{ height: 8, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: (displayedTimeLeft / totalTime * 100) + "%", background: timerAccelerated ? "#ff3333" : "#e8573a", borderRadius: 4, transition: "width 0.5s linear" }} />
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontFamily: "'Lilita One', Impact", fontSize: 13, letterSpacing: 2, color: "#f5c842", margin: 0 }}>FINAL ANSWER</p>
          <p style={{ fontFamily: "'Lilita One', Impact", fontSize: 28, color: "#fff", marginTop: 6, marginBottom: 0 }}>
            what is your verdict?
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <button onClick={() => onVote(true)} style={{
            flex: 1, padding: "22px 10px",
            background: myVote === true ? "#5dbb5d" : "#111",
            border: "2px solid " + (myVote === true ? "#5dbb5d" : "#2a2a2a"),
            borderTopLeftRadius: 26, borderTopRightRadius: 20, borderBottomRightRadius: 26, borderBottomLeftRadius: 20,
            color: myVote === true ? "#000" : "#5dbb5d",
            fontFamily: "'Lilita One', Impact, sans-serif", fontSize: 20, fontStyle: "italic",
            cursor: "pointer", transition: "all 0.15s",
            boxShadow: myVote === true ? "0 0 20px #5dbb5d44" : "0 4px 0 #00000066",
          }}>TRUE STORY</button>
          <button onClick={() => onVote(false)} style={{
            flex: 1, padding: "22px 10px",
            background: myVote === false ? "#e8573a" : "#111",
            border: "2px solid " + (myVote === false ? "#e8573a" : "#2a2a2a"),
            borderTopLeftRadius: 20, borderTopRightRadius: 26, borderBottomRightRadius: 20, borderBottomLeftRadius: 26,
            color: myVote === false ? "#fff" : "#e8573a",
            fontFamily: "'Lilita One', Impact, sans-serif", fontSize: 20, fontStyle: "italic",
            cursor: "pointer", transition: "all 0.15s",
            boxShadow: myVote === false ? "0 0 20px #e8573a66" : "0 4px 0 #00000066",
          }}>{"THAT'S CAP"}</button>
        </div>
        {myVote !== undefined && (
          <p style={{ fontFamily: "Courier New", fontSize: 11, color: "#555", textAlign: "center" }}>
            locked in: <span style={{ color: myVote ? "#5dbb5d" : "#e8573a" }}>{myVote ? "true story" : "that's cap"}</span> — tap to change
          </p>
        )}
      </div>
    );
  }

  // During story — reaction buttons + gauge
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&display=swap');
        @keyframes reactionPop { 0% { transform:scale(0.92); opacity:0; } 60% { transform:scale(1.06); } 100% { transform:scale(1); opacity:1; } }
        @keyframes timerFlash { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: "'Lilita One', Impact", fontSize: 13, color: "#555", letterSpacing: 1 }}>
          {teller ? teller.name.toUpperCase() + " IS PERFORMING" : "LISTEN UP"}
        </span>
        <span style={{ fontFamily: "Courier New", fontSize: 11, color: "#444" }}>{questionsLeft} q left</span>
      </div>

      {/* Timer */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontFamily: "Courier New", fontSize: 10, color: "#444", letterSpacing: 2 }}>TIME</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {timerAccelerated && <span style={{ fontFamily: "Courier New", fontSize: 9, color: "#ff3333", letterSpacing: 1, border: "1px solid #ff3333", borderRadius: 4, padding: "1px 5px", animation: "timerFlash 0.5s ease-in-out infinite" }}>2x</span>}
            <span style={{ fontFamily: "'Lilita One', Impact", fontSize: 20, color: timerAccelerated ? "#ff3333" : "#f5c842", animation: timerAccelerated ? "timerFlash 0.5s ease-in-out infinite" : "none" }}>{displayedTimeLeft}s</span>
          </div>
        </div>
        <div style={{ height: 8, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: (displayedTimeLeft / totalTime * 100) + "%", background: timerAccelerated ? "#ff3333" : "#f5c842", borderRadius: 4, transition: "width 0.5s linear" }} />
        </div>
      </div>

      {/* Gauge */}
      <div style={{ background: "#111", border: "2px solid #1e1e1e", borderRadius: 12, padding: "14px", marginBottom: 14, textAlign: "center" }}>
        <canvas ref={canvasRef} width={200} height={120} style={{ display: "block", margin: "0 auto" }} />
        <div style={{ fontFamily: "'Lilita One', Impact", fontSize: 14, color: meterColor, marginTop: 2 }}>{meterEmoji} {meterLabel}</div>
        <div style={{ fontFamily: "Courier New", fontSize: 9, color: "#333", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>pants on fire meter</div>
      </div>

      {/* Who's talking */}
      <div style={{ background: "#111", border: "2px solid #1e1e1e", borderRadius: 12, padding: "16px 20px", marginBottom: 14, textAlign: "center" }}>
        <p style={{ fontFamily: "'Lilita One', Impact", fontSize: 24, color: "#f5c842", margin: 0, fontStyle: "italic" }}>
          {teller ? teller.name : "?"} is talking
        </p>
        {lastReaction ? (
          <p key={flashKey} style={{ fontFamily: "Courier New", fontSize: 12, color: "#f5a623", margin: "8px 0 0", animation: "reactionPop 0.3s ease-out" }}>
            you said: "{lastReaction}"
          </p>
        ) : (
          <p style={{ fontFamily: "Courier New", fontSize: 11, color: "#333", margin: "8px 0 0" }}>heckle the storyteller</p>
        )}
      </div>

      {/* Reaction buttons — chunky and fun */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {REACTIONS.map((r, i) => {
          const isActive = lastReaction === r.label;
          const finalColor = r.sound === "doubt" ? "#f5c842" : r.heat < 0 ? "#5dbb5d" : "#e8573a";
          return (
            <button
              key={r.label}
              onClick={() => handleReaction(r)}
              style={{
                width: "100%", padding: "16px 20px",
                background: isActive ? finalColor : "#111",
                border: "2px solid " + (isActive ? finalColor : "#222"),
                borderTopLeftRadius: i % 2 === 0 ? 28 : 20,
                borderTopRightRadius: i % 2 === 0 ? 20 : 28,
                borderBottomRightRadius: i % 2 === 0 ? 28 : 20,
                borderBottomLeftRadius: i % 2 === 0 ? 20 : 28,
                color: isActive ? (finalColor === "#f5c842" ? "#111" : "#fff") : "#666",
                fontFamily: "'Lilita One', Impact, sans-serif",
                fontSize: 18, fontStyle: "italic",
                cursor: "pointer", transition: "all 0.15s",
                boxShadow: isActive ? "0 0 16px " + finalColor + "55" : "0 3px 0 #00000055",
                textAlign: "center",
              }}
            >{r.label}</button>
          );
        })}
      </div>

      {/* Ask a question */}
      {questionsLeft > 0 && (
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontFamily: "Courier New", fontSize: 10, color: "#444", marginTop: 0, letterSpacing: 2 }}>ASK A QUESTION</p>
          <div style={{ display: "flex", gap: 8 }}>
            <TextInput value={question} onChange={setQuestion} placeholder="What did it smell like?" style={{ flex: 1 }} />
            <Btn onClick={handleAsk} disabled={!question.trim()} small color="#f5c842">ASK</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function RevealScreen({ round, players, votes, onNext, isHost, storyLikes, storyFlags, currentPlayerId, onLike, onFlag }) {
  const teller = players.find(p => p.id === round.playerId);
  const { story } = round;
  const votersList = players.filter(p => p.id !== round.playerId);
  const fooled = votersList.filter(p => votes[p.id] !== undefined && votes[p.id] !== story.isTrue).length;
  const tellerPoints = fooled * 150;
  const hasLiked = storyLikes.includes(currentPlayerId);
  const hasFlagged = storyFlags.includes(currentPlayerId);
  const hasReacted = hasLiked || hasFlagged;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: "Bebas Neue, Impact", fontSize: 64, color: story.isTrue ? "#5dbb5d" : "#c4232a", lineHeight: 1 }}>
          {story.isTrue ? "TRUE STORY!" : "THAT'S CAP!"}
        </div>
        <p style={{ fontFamily: "Courier New", fontSize: 13, color: "#888" }}>
          {teller ? teller.name + "'s" : "This"} story was {story.isTrue ? "completely real" : "totally made up"}
        </p>
      </div>
      <Card style={{ marginBottom: 16, borderColor: story.isTrue ? "#2d5a2d" : "#5a1a1a" }}>
        <p style={{ fontFamily: "Courier New", fontSize: 11, color: "#555", marginTop: 0 }}>THE STORY WAS:</p>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#fff", fontStyle: "italic", margin: 0 }}>"{story.text}"</p>
      </Card>

      {/* Like / Flag reaction */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: "Courier New", fontSize: 11, color: "#555", marginTop: 0, marginBottom: 12 }}>RATE THIS STORY:</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => !hasReacted && onLike()}
            disabled={hasReacted}
            style={{
              flex: 1, padding: "12px 0", border: "2px solid " + (hasLiked ? "#5dbb5d" : "#2a2a2a"),
              borderRadius: 10, background: hasLiked ? "#0d2a0d" : "#111",
              cursor: hasReacted ? "default" : "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4,
            }}
          >
            <span style={{ fontSize: 24 }}>👍</span>
            <span style={{ fontFamily: "Courier New", fontSize: 11, color: hasLiked ? "#5dbb5d" : "#555" }}>
              good story ({storyLikes.length})
            </span>
          </button>
          <button
            onClick={() => !hasReacted && onFlag()}
            disabled={hasReacted}
            style={{
              flex: 1, padding: "12px 0", border: "2px solid " + (hasFlagged ? "#e8573a" : "#2a2a2a"),
              borderRadius: 10, background: hasFlagged ? "#1a0800" : "#111",
              cursor: hasReacted ? "default" : "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4,
            }}
          >
            <span style={{ fontSize: 24 }}>🚩</span>
            <span style={{ fontFamily: "Courier New", fontSize: 11, color: hasFlagged ? "#e8573a" : "#555" }}>
              bad story ({storyFlags.length})
            </span>
          </button>
        </div>
        {hasReacted && (
          <p style={{ fontFamily: "Courier New", fontSize: 10, color: "#444", textAlign: "center", marginBottom: 0, marginTop: 10 }}>
            reaction locked in
          </p>
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: "Courier New", fontSize: 11, color: "#555", marginTop: 0 }}>VOTES:</p>
        {votersList.map(p => {
          const v = votes[p.id];
          const correct = v === story.isTrue;
          return (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #222" }}>
              <span style={{ fontFamily: "Courier New", fontSize: 13, color: "#ddd" }}>{p.name}</span>
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontFamily: "Courier New", fontSize: 12, color: v === undefined ? "#555" : v ? "#5dbb5d" : "#c4232a" }}>
                  {v === undefined ? "no vote" : v ? "true story" : "that's cap"}
                </span>
                <span style={{ fontFamily: "Bebas Neue, Impact", fontSize: 16, color: correct ? "#f5e642" : "#444" }}>
                  {correct ? "+100" : "+0"}
                </span>
              </span>
            </div>
          );
        })}
        <div style={{ paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "Courier New", fontSize: 12, color: "#888" }}>{teller ? teller.name : "Storyteller"} (storyteller)</span>
          <span style={{ fontFamily: "Bebas Neue, Impact", fontSize: 16, color: "#f5a623" }}>+{tellerPoints}</span>
        </div>
      </Card>
      {isHost
        ? <Btn onClick={onNext} color="#f5e642" style={{ width: "100%" }}>NEXT ROUND</Btn>
        : <p style={{ fontFamily: "Courier New", fontSize: 12, color: "#555", textAlign: "center" }}>waiting for host to continue...</p>
      }
    </div>
  );
}

function ScoreboardScreen({ players, scores, roundIndex, totalRounds, onNext, isFinal, isHost }) {
  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const medals = ["1st", "2nd", "3rd"];
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px" }}>
      <Logo />
      <div style={{ height: 20 }} />
      <p style={{ fontFamily: "Bebas Neue, Impact", fontSize: 16, letterSpacing: 4, color: "#555", textAlign: "center" }}>
        {isFinal ? "FINAL RESULTS" : "ROUND " + roundIndex + " / " + totalRounds}
      </p>
      <div style={{ height: 16 }} />
      {sorted.map((p, i) => (
        <div key={p.id} style={{
          display: "flex", alignItems: "center", gap: 16,
          background: i === 0 && isFinal ? "#1a1800" : "#111",
          border: "1px solid " + (i === 0 && isFinal ? "#555" : "#222"),
          borderRadius: 2, padding: "14px 20px", marginBottom: 8,
        }}>
          <span style={{ fontFamily: "Courier New", fontSize: 12, color: "#666", width: 28 }}>{medals[i] || (i + 1) + "th"}</span>
          <span style={{ fontFamily: "Courier New", fontSize: 15, color: "#ddd", flex: 1 }}>{p.name}</span>
          <span style={{ fontFamily: "Bebas Neue, Impact", fontSize: 28, color: "#f5e642" }}>{scores[p.id] || 0}</span>
        </div>
      ))}
      <div style={{ height: 20 }} />
      {!isFinal && (isHost
        ? <Btn onClick={onNext} color="#f5e642" style={{ width: "100%" }}>CONTINUE</Btn>
        : <p style={{ fontFamily: "Courier New", fontSize: 12, color: "#555", textAlign: "center" }}>waiting for host to continue...</p>
      )}
      {isFinal && <Btn onClick={() => window.location.reload()} color="#4ecdc4" style={{ width: "100%" }}>PLAY AGAIN</Btn>}
    </div>
  );
}

export default function App() {
  const [currentPlayerId] = useState(() => {
    const saved = localStorage.getItem('thats-cap-pid');
    if (saved) return saved;
    const id = "p_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    localStorage.setItem('thats-cap-pid', id);
    return id;
  });
  const [lobbyCode, setLobbyCodeRaw] = useState(() => localStorage.getItem('thats-cap-lobby') || null);
  const [gameState, setGameState] = useState(null);

  const setLobbyCode = (code) => {
    if (code) localStorage.setItem('thats-cap-lobby', code);
    else localStorage.removeItem('thats-cap-lobby');
    setLobbyCodeRaw(code);
  };
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [hintLoading, setHintLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const timerRef = useRef(null);
  const tickIntervalRef = useRef(null);
  const displayTickRef = useRef(null);
  const prevQuestionRef = useRef(null);
  const [timerAccelerated, setTimerAccelerated] = useState(false);
  const [displayedTimeLeft, setDisplayedTimeLeft] = useState(ROUND_DURATION);
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const audioStartedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio('/vittemacop-funny-tv-theme-hip-hop-447506.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    const startAudio = () => {
      if (!audioStartedRef.current) {
        audioStartedRef.current = true;
        audio.play().catch(() => {});
        window.removeEventListener('click', startAudio);
        window.removeEventListener('keydown', startAudio);
      }
    };

    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);

    return () => {
      audio.pause();
      audio.src = '';
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const musicBtn = (
    <button
      onClick={() => setMuted(m => !m)}
      style={{
        position: "fixed", bottom: 16, right: 16, zIndex: 1000,
        background: "#111", border: "1px solid #333", color: "#888",
        fontFamily: "Courier New", fontSize: 18, cursor: "pointer",
        borderRadius: "50%", width: 38, height: 38,
        display: "flex", alignItems: "center", justifyContent: "center",
        lineHeight: 1,
      }}
      title={muted ? "Unmute music" : "Mute music"}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );

  // Subscribe to Firestore lobby document
  useEffect(() => {
    if (!lobbyCode) return;
    const ref = doc(db, 'lobbies', lobbyCode);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setGameState(snap.data());
      } else {
        // Lobby was deleted or expired
        setGameState(null);
        setLobbyCode(null);
      }
    });
    return () => unsub();
  }, [lobbyCode]);

  // Local countdown timer driven by roundEndTime stored in Firestore
  useEffect(() => {
    const endTime = gameState?.roundEndTime;
    const status = gameState?.status;
    const isHost = gameState?.hostId === currentPlayerId;
    const code = lobbyCode;

    if (status !== 'round' || !endTime) {
      clearInterval(timerRef.current);
      return;
    }

    clearInterval(timerRef.current);
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        if (isHost && code) {
          updateDoc(doc(db, 'lobbies', code), { status: 'reveal' });
        }
      }
    };
    tick();
    timerRef.current = setInterval(tick, 500);
    return () => clearInterval(timerRef.current);
  }, [gameState?.roundEndTime, gameState?.roundIndex, gameState?.status]);

  // Storyteller detects new question from Firestore and generates hint
  useEffect(() => {
    if (!gameState || !lobbyCode) return;
    const round = gameState.rounds?.[gameState.roundIndex];
    if (!round || round.playerId !== currentPlayerId) return;
    if (!gameState.questionAsked) return;
    if (gameState.questionAsked === prevQuestionRef.current) return;

    prevQuestionRef.current = gameState.questionAsked;
    const ref = doc(db, 'lobbies', lobbyCode);
    updateDoc(ref, { hintLoading: true, hint: null });
    getAnswerHint(round.story.text, gameState.questionAsked, round.story.isTrue).then(h => {
      updateDoc(ref, { hint: h, hintLoading: false });
    });
  }, [gameState?.questionAsked, gameState?.roundIndex]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // Heat-based timer acceleration with hysteresis (on at 100%, off below 80%)
  useEffect(() => {
    const h = gameState?.heat || 0;
    if (h >= 100) setTimerAccelerated(true);
    else if (h < 80) setTimerAccelerated(false);
  }, [gameState?.heat]);

  // Displayed timer: 2x speed when accelerated, snaps back to real time when not
  useEffect(() => {
    clearInterval(displayTickRef.current);
    const status = gameState?.status;
    if (status !== 'round' || timeLeft <= 0) {
      setDisplayedTimeLeft(timeLeft);
      return;
    }
    if (!timerAccelerated) {
      setDisplayedTimeLeft(timeLeft);
      return;
    }
    // Accelerated: cap at real timeLeft, then count down at 2x (1 per 500ms)
    setDisplayedTimeLeft(prev => Math.min(prev, timeLeft));
    displayTickRef.current = setInterval(() => {
      setDisplayedTimeLeft(prev => Math.max(0, prev - 1));
    }, 500);
    return () => clearInterval(displayTickRef.current);
  }, [timerAccelerated, gameState?.status, timeLeft]);

  // Ticking sound during last 30 seconds (or always when accelerated) — stops when round ends
  useEffect(() => {
    const status = gameState?.status;
    if (status !== 'round' || (timeLeft > 30 && !timerAccelerated) || timeLeft <= 0) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
      return;
    }
    const basePeriod = Math.max(150, timeLeft * 33);
    const period = timerAccelerated ? Math.max(80, Math.floor(basePeriod / 2)) : basePeriod;
    clearInterval(tickIntervalRef.current);
    tickIntervalRef.current = setInterval(() => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(timeLeft <= 10 ? 1400 : 1000, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } catch (e) {}
    }, period);
    return () => clearInterval(tickIntervalRef.current);
  }, [timeLeft, timerAccelerated, gameState?.status]);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const onCreateLobby = async (name) => {
    const code = generateCode();
    const player = { id: currentPlayerId, name, stories: [], fakeStories: [], ready: false };
    await setDoc(doc(db, 'lobbies', code), {
      code,
      hostId: currentPlayerId,
      status: 'lobby',
      players: [player],
      rounds: null,
      roundIndex: 0,
      scores: {},
      votes: {},
      heat: 0,
      questionsLeft: QUESTION_LIMIT,
      questionAsked: null,
      hint: null,
      hintLoading: false,
      roundEndTime: null,
      storyLikes: [],
      storyFlags: [],
    });
    setLobbyCode(code);
  };

  const onJoinLobby = async (code, name) => {
    setJoinError(null);
    try {
      const ref = doc(db, 'lobbies', code);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setJoinError("Lobby not found. Check the code and try again.");
        return;
      }
      const data = snap.data();
      if (!data.players.some(p => p.id === currentPlayerId)) {
        const player = { id: currentPlayerId, name, stories: [], fakeStories: [], ready: false };
        await updateDoc(ref, { players: arrayUnion(player) });
      }
      setLobbyCode(code);
    } catch (e) {
      setJoinError("Error joining lobby. Please try again.");
    }
  };

  const onSubmitStories = async (s1, s2) => {
    const updatedPlayers = gameState.players.map(p =>
      p.id === currentPlayerId ? { ...p, stories: [s1, s2], ready: true } : p
    );
    await updateDoc(doc(db, 'lobbies', lobbyCode), { players: updatedPlayers });
  };

  const onStartGame = async () => {
    const ref = doc(db, 'lobbies', lobbyCode);
    const updatedPlayers = gameState.players.map((p) => {
      const stories = p.stories.length ? p.stories : ["I ate cereal with orange juice.", "I got lost in a corn maze for two hours."];
      const shuffled = [...STORY_BANK].sort(() => Math.random() - 0.5);
      const fakes = shuffled.slice(0, 2);
      return { ...p, stories, fakeStories: fakes };
    });
    const builtRounds = buildRounds(updatedPlayers);
    const initScores = {};
    updatedPlayers.forEach(p => { initScores[p.id] = 0; });
    await updateDoc(ref, {
      status: 'round',
      players: updatedPlayers,
      rounds: builtRounds,
      scores: initScores,
      roundIndex: 0,
      roundEndTime: Date.now() + ROUND_DURATION * 1000,
      questionsLeft: QUESTION_LIMIT,
      questionAsked: null,
      hint: null,
      hintLoading: false,
      votes: {},
      heat: 0,
      storyLikes: [],
      storyFlags: [],
    });
  };

  const handleSkipStory = async () => {
    const round = gameState.rounds[gameState.roundIndex];
    const player = gameState.players.find(p => p.id === round.playerId);
    if (!player) return;
    setSkipLoading(true);
    const [newFake] = await generateFakeStories(player.stories);
    const newRounds = gameState.rounds.map((r, i) =>
      i !== gameState.roundIndex ? r : { ...r, story: { text: newFake, isTrue: false } }
    );
    await updateDoc(doc(db, 'lobbies', lobbyCode), { rounds: newRounds, questionAsked: null, hint: null });
    setSkipLoading(false);
  };

  const handleAskQuestion = async (q) => {
    if ((gameState?.questionsLeft ?? 0) <= 0) return;
    await updateDoc(doc(db, 'lobbies', lobbyCode), {
      questionAsked: q,
      questionsLeft: gameState.questionsLeft - 1,
      hint: null,
      hintLoading: false,
    });
  };

  const handleVote = async (vote) => {
    await updateDoc(doc(db, 'lobbies', lobbyCode), {
      [`votes.${currentPlayerId}`]: vote,
    });
  };

  const handleReaction = async (delta) => {
    const newHeat = Math.min(100, Math.max(0, (gameState?.heat ?? 0) + delta));
    await updateDoc(doc(db, 'lobbies', lobbyCode), { heat: newHeat });
  };

  const handleLikeStory = async () => {
    const likes = gameState?.storyLikes || [];
    const flags = gameState?.storyFlags || [];
    if (likes.includes(currentPlayerId) || flags.includes(currentPlayerId)) return;
    await updateDoc(doc(db, 'lobbies', lobbyCode), { storyLikes: [...likes, currentPlayerId] });
  };

  const handleFlagStory = async () => {
    const likes = gameState?.storyLikes || [];
    const flags = gameState?.storyFlags || [];
    if (likes.includes(currentPlayerId) || flags.includes(currentPlayerId)) return;
    await updateDoc(doc(db, 'lobbies', lobbyCode), { storyFlags: [...flags, currentPlayerId] });
  };

  const applyRoundScores = () => {
    const round = gameState.rounds[gameState.roundIndex];
    if (!round) return gameState.scores;
    const voters = gameState.players.filter(p => p.id !== round.playerId);
    let tellerBonus = 0;
    const updated = { ...gameState.scores };
    voters.forEach(p => {
      const v = (gameState.votes || {})[p.id];
      if (v === round.story.isTrue) {
        updated[p.id] = (updated[p.id] || 0) + 100;
      } else {
        tellerBonus += 150;
      }
    });
    updated[round.playerId] = (updated[round.playerId] || 0) + tellerBonus;
    return updated;
  };

  const handleNextRound = async () => {
    if (gameState.hostId !== currentPlayerId) return;
    const newScores = applyRoundScores();
    const nextIndex = gameState.roundIndex + 1;
    const ref = doc(db, 'lobbies', lobbyCode);

    if (nextIndex >= gameState.rounds.length || nextIndex % 4 === 0) {
      await updateDoc(ref, { scores: newScores, status: 'scores', storyLikes: [], storyFlags: [] });
    } else {
      await updateDoc(ref, {
        scores: newScores,
        roundIndex: nextIndex,
        status: 'round',
        roundEndTime: Date.now() + ROUND_DURATION * 1000,
        questionsLeft: QUESTION_LIMIT,
        questionAsked: null,
        hint: null,
        hintLoading: false,
        votes: {},
        heat: 0,
        storyLikes: [],
        storyFlags: [],
      });
    }
  };

  const handleContinueFromScores = async () => {
    if (gameState.hostId !== currentPlayerId) return;
    const nextIndex = gameState.roundIndex + 1;
    const ref = doc(db, 'lobbies', lobbyCode);

    if (nextIndex >= gameState.rounds.length) {
      await updateDoc(ref, { status: 'final' });
    } else {
      await updateDoc(ref, {
        roundIndex: nextIndex,
        status: 'round',
        roundEndTime: Date.now() + ROUND_DURATION * 1000,
        questionsLeft: QUESTION_LIMIT,
        questionAsked: null,
        hint: null,
        hintLoading: false,
        votes: {},
        heat: 0,
        storyLikes: [],
        storyFlags: [],
      });
    }
  };

  const bg = { minHeight: "100vh", background: "#0d0d0d", color: "#eee" };

  // Home screen: no lobby yet
  if (!lobbyCode) {
    return <div style={bg}><HomeScreen onCreateLobby={onCreateLobby} onJoinLobby={onJoinLobby} joinError={joinError} />{musicBtn}</div>;
  }

  // Waiting for Firestore to deliver first snapshot
  if (!gameState) {
    return (
      <div style={bg}>
        <LoadingScreen message="Reconnecting" />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={() => setLobbyCode(null)} style={{ background: "none", border: "none", color: "#555", fontFamily: "Courier New", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
            leave game
          </button>
        </div>
        {musicBtn}
      </div>
    );
  }

  const screen = gameState.status;
  const rounds = gameState.rounds || [];
  const roundIndex = gameState.roundIndex || 0;
  const scores = gameState.scores || {};
  const votes = gameState.votes || {};
  const questionsLeft = gameState.questionsLeft ?? QUESTION_LIMIT;
  const questionAsked = gameState.questionAsked || null;
  const hint = gameState.hint || null;
  const heat = gameState.heat || 0;
  const storyLikes = gameState.storyLikes || [];
  const storyFlags = gameState.storyFlags || [];
  const roundEnding = timeLeft <= 10 && screen === 'round';
  const isHost = gameState.hostId === currentPlayerId;
  const currentRound = rounds[roundIndex];
  const isStoryteller = currentRound?.playerId === currentPlayerId;

  const leaveBtn = (
    <div style={{ position: "fixed", top: 12, right: 16, zIndex: 999 }}>
      <button onClick={() => setLobbyCode(null)} style={{ background: "#111", border: "1px solid #333", color: "#555", fontFamily: "Courier New", fontSize: 11, cursor: "pointer", borderRadius: 20, padding: "5px 12px", letterSpacing: 1 }}>
        ✕ leave
      </button>
    </div>
  );

  if (screen === "lobby") return <div style={bg}>{leaveBtn}<LobbyScreen lobby={gameState} currentPlayerId={currentPlayerId} onSubmitStories={onSubmitStories} onStartGame={onStartGame} />{musicBtn}</div>;
  if (screen === "loading") return <div style={bg}><LoadingScreen message="Starting game" />{musicBtn}</div>;

  if (screen === "round" && currentRound) {
    return (
      <div style={bg}>
        {leaveBtn}
        {isStoryteller
          ? <StorytellerView round={currentRound} players={gameState.players} timeLeft={timeLeft} displayedTimeLeft={displayedTimeLeft} timerAccelerated={timerAccelerated} totalTime={ROUND_DURATION} questionAsked={questionAsked} hintLoading={gameState.hintLoading || hintLoading} hint={hint} onSkip={handleSkipStory} skipLoading={skipLoading} heat={heat} onRevealedChange={(isRevealed) => { if (audioRef.current) audioRef.current.volume = isRevealed ? 0.1 : 0.4; }} />
          : <VoterView round={currentRound} players={gameState.players} timeLeft={timeLeft} displayedTimeLeft={displayedTimeLeft} timerAccelerated={timerAccelerated} totalTime={ROUND_DURATION} questionsLeft={questionsLeft} onAskQuestion={handleAskQuestion} onVote={handleVote} myVote={votes[currentPlayerId]} roundEnding={roundEnding} onReaction={handleReaction} heat={heat} />
        }
        {musicBtn}
      </div>
    );
  }

  if (screen === "reveal" && currentRound) {
    return <div style={bg}>{leaveBtn}<RevealScreen round={currentRound} players={gameState.players} votes={votes} onNext={handleNextRound} isHost={isHost} storyLikes={storyLikes} storyFlags={storyFlags} currentPlayerId={currentPlayerId} onLike={handleLikeStory} onFlag={handleFlagStory} />{musicBtn}</div>;
  }

  if (screen === "scores") {
    return <div style={bg}>{leaveBtn}<ScoreboardScreen players={gameState.players} scores={scores} roundIndex={roundIndex + 1} totalRounds={rounds.length} onNext={handleContinueFromScores} isFinal={false} isHost={isHost} />{musicBtn}</div>;
  }

  if (screen === "final") {
    return <div style={bg}><ScoreboardScreen players={gameState.players} scores={scores} roundIndex={rounds.length} totalRounds={rounds.length} onNext={() => {}} isFinal={true} isHost={isHost} />{musicBtn}</div>;
  }

  return <div style={bg}><LoadingScreen message="Loading" />{musicBtn}</div>;
}
