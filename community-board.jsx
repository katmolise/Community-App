import React, { useState, useEffect, useCallback } from "react";
import { Users, MapPin, Plus, X, Dumbbell, Gamepad2, BookOpen, Music, Palette, Utensils, Sparkles, Calendar, LogOut } from "lucide-react";

const CATEGORIES = [
  { id: "running", label: "Running", icon: Dumbbell, color: "#F5B700" },
  { id: "gaming", label: "Gaming", icon: Gamepad2, color: "#8B5FBF" },
  { id: "reading", label: "Reading", icon: BookOpen, color: "#D65A31" },
  { id: "music", label: "Music", icon: Music, color: "#4FA88C" },
  { id: "art", label: "Art & Craft", icon: Palette, color: "#E85D9C" },
  { id: "food", label: "Food & Cooking", icon: Utensils, color: "#5A8FD6" },
  { id: "other", label: "Something else", icon: Sparkles, color: "#C9A84C" },
];

const AREAS = ["Waldrift", "Arcon Park", "Vereeniging CBD", "Surrounding area"];

const catInfo = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

function timeUntil(iso) {
  const diff = new Date(iso) - new Date();
  if (diff < 0) return "Happening now";
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `In ${days} day${days > 1 ? "s" : ""}`;
  if (hrs > 0) return `In ${hrs} hour${hrs > 1 ? "s" : ""}`;
  return "Starting soon";
}

const seedCircles = () => [
  {
    id: "seed-1",
    title: "Sunrise 5K along Arcon Dam",
    category: "running",
    area: "Arcon Park",
    description: "Easy pace, all levels welcome. We meet at the boat club gate and loop the dam twice.",
    location: "Arcon Park boat club gate",
    when: new Date(Date.now() + 2 * 86400000).toISOString(),
    host: "Lindiwe M.",
    joined: ["Lindiwe M.", "Sipho K.", "Naledi P."],
    recurring: "Every Tuesday & Saturday, 5:30 AM",
  },
  {
    id: "seed-2",
    title: "FIFA & Fortnite squad night",
    category: "gaming",
    area: "Waldrift",
    description: "Bring your own controller if you've got one. TV and two consoles set up at the centre.",
    location: "Waldrift Community Centre, hall 2",
    when: new Date(Date.now() + 4 * 86400000).toISOString(),
    host: "Bongani T.",
    joined: ["Bongani T.", "Thato M."],
    recurring: "Every Friday, 6 PM",
  },
  {
    id: "seed-3",
    title: "Township Book Circle — this month: fiction by SA authors",
    category: "reading",
    area: "Waldrift",
    description: "Casual chat over tea. New members always welcome, you don't need to have finished the book.",
    location: "Waldrift Library corner",
    when: new Date(Date.now() + 6 * 86400000).toISOString(),
    host: "Nomsa D.",
    joined: ["Nomsa D."],
    recurring: "Last Thursday of the month",
  },
];

export default function CommunityBoard() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [circles, setCircles] = useState([]);
  const [filter, setFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState(null);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    (async () => {
      try {
        const stored = await window.storage.get("session-user", false);
        if (stored?.value) setUser(JSON.parse(stored.value));
      } catch (e) {}
      setLoadingUser(false);

      try {
        const result = await window.storage.get("circles-board", true);
        if (result?.value) {
          setCircles(JSON.parse(result.value));
        } else {
          const seeded = seedCircles();
          setCircles(seeded);
          await window.storage.set("circles-board", JSON.stringify(seeded), true);
        }
      } catch (e) {
        setCircles(seedCircles());
      }
    })();
  }, []);

  const persistCircles = useCallback(async (next) => {
    setCircles(next);
    try {
      await window.storage.set("circles-board", JSON.stringify(next), true);
    } catch (e) {}
  }, []);

  const signIn = async () => {
    const names = ["Refilwe S.", "Katlego M.", "Zanele N.", "Mpho R.", "Andile V."];
    const picked = names[Math.floor(Math.random() * names.length)];
    const profile = { name: picked, area: "Waldrift", id: "u-" + Date.now() };
    setUser(profile);
    try {
      await window.storage.set("session-user", JSON.stringify(profile), false);
    } catch (e) {}
    flash(`Welcome, ${picked.split(" ")[0]}`);
  };

  const signOut = async () => {
    setUser(null);
    try {
      await window.storage.delete("session-user", false);
    } catch (e) {}
  };

  const toggleJoin = (id) => {
    if (!user) return signIn();
    const next = circles.map((c) => {
      if (c.id !== id) return c;
      const already = c.joined.includes(user.name);
      return {
        ...c,
        joined: already ? c.joined.filter((n) => n !== user.name) : [...c.joined, user.name],
      };
    });
    persistCircles(next);
  };

  const createCircle = (data) => {
    const next = [{ ...data, id: "c-" + Date.now(), host: user.name, joined: [user.name] }, ...circles];
    persistCircles(next);
    setShowCreate(false);
    flash("Your circle is live on the board");
  };

  const visible = circles.filter(
    (c) => (filter === "all" || c.category === filter) && (areaFilter === "all" || c.area === areaFilter)
  );

  return (
    <div className="wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Inter:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }
        .wrap {
          min-height: 100vh;
          background: #1B1533;
          background-image:
            radial-gradient(circle at 15% 0%, rgba(245,183,0,0.10), transparent 40%),
            radial-gradient(circle at 90% 20%, rgba(139,95,191,0.16), transparent 45%);
          font-family: 'Inter', sans-serif;
          color: #F2EFE9;
          padding-bottom: 60px;
        }
        h1, h2, h3, .display { font-family: 'Bricolage Grotesque', sans-serif; }

        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px; border-bottom: 1px solid rgba(242,239,233,0.09);
          position: sticky; top: 0; z-index: 20;
          background: rgba(27,21,51,0.88); backdrop-filter: blur(10px);
        }
        .brand { display: flex; align-items: center; gap: 9px; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 18px; letter-spacing: -0.02em; }
        .brand-mark { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, #F5B700, #D65A31); display:flex; align-items:center; justify-content:center; font-weight: 800; color: #1B1533; font-size: 15px; flex-shrink:0; }

        .btn { border: none; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; border-radius: 10px; transition: transform .12s ease, opacity .12s ease; }
        .btn:active { transform: scale(0.97); }
        .btn-google {
          display: flex; align-items: center; gap: 8px; background: #F2EFE9; color: #1B1533;
          padding: 10px 16px; font-size: 14px;
        }
        .btn-google:hover { opacity: 0.92; }
        .btn-primary { background: #F5B700; color: #1B1533; padding: 10px 16px; font-size: 14px; }
        .btn-ghost { background: transparent; color: #F2EFE9; border: 1px solid rgba(242,239,233,0.25); padding: 9px 14px; font-size: 13px; }
        .user-chip { display:flex; align-items:center; gap:10px; }
        .avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#8B5FBF,#5A8FD6); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; }

        .hero { padding: 46px 20px 30px; max-width: 720px; }
        .hero .kicker { color: #F5B700; font-size: 13px; font-weight: 600; margin-bottom: 10px; }
        .hero h1 { font-size: 34px; line-height: 1.08; font-weight: 700; letter-spacing: -0.015em; margin: 0 0 14px; }
        .hero p { font-size: 15.5px; color: rgba(242,239,233,0.72); line-height: 1.55; max-width: 46ch; margin: 0 0 22px; }

        .filters { display: flex; gap: 8px; overflow-x: auto; padding: 0 20px 18px; scrollbar-width: none; }
        .filters::-webkit-scrollbar { display: none; }
        .chip {
          flex-shrink: 0; padding: 8px 14px; border-radius: 20px; font-size: 13.5px; font-weight: 600;
          border: 1px solid rgba(242,239,233,0.16); background: rgba(242,239,233,0.04); color: #F2EFE9;
          cursor: pointer; display:flex; align-items:center; gap:6px; transition: background .15s ease, border-color .15s ease;
        }
        .chip.active { background: #F2EFE9; color: #1B1533; border-color: #F2EFE9; }

        .area-row { display:flex; gap:8px; padding: 0 20px 26px; flex-wrap:wrap; }
        .area-pill { font-size: 12.5px; padding: 5px 11px; border-radius: 7px; background: rgba(242,239,233,0.06); border:1px solid rgba(242,239,233,0.1); cursor:pointer; }
        .area-pill.active { background: rgba(139,95,191,0.35); border-color:#8B5FBF; }

        .board { columns: 1; column-gap: 16px; padding: 0 20px; }
        @media (min-width: 640px) { .board { columns: 2; } }
        @media (min-width: 980px) { .board { columns: 3; } }

        .card {
          break-inside: avoid; margin-bottom: 16px; border-radius: 16px; padding: 20px;
          background: #241C3D; border: 1px solid rgba(242,239,233,0.08);
          position: relative; overflow: hidden;
        }
        .card::before {
          content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
          background: var(--accent);
        }
        .card-cat { display:flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; color: var(--accent); margin-bottom: 12px; }
        .card h3 { font-size: 17px; font-weight: 700; margin: 0 0 8px; line-height: 1.3; }
        .card p.desc { font-size: 13.5px; color: rgba(242,239,233,0.68); line-height: 1.5; margin: 0 0 14px; }
        .meta-row { display:flex; align-items:center; gap: 6px; font-size: 12.5px; color: rgba(242,239,233,0.6); margin-bottom: 6px; }
        .card-footer { display:flex; align-items:center; justify-content:space-between; margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(242,239,233,0.08); }
        .when-badge { font-size: 12px; font-weight: 700; color: #F5B700; }
        .join-count { font-size: 12px; color: rgba(242,239,233,0.55); }
        .btn-join { padding: 7px 14px; font-size: 12.5px; border-radius: 8px; }
        .btn-join.joined { background: rgba(79,168,140,0.2); color: #7FD9BC; border: 1px solid rgba(79,168,140,0.4); }
        .btn-join.not-joined { background: var(--accent); color: #1B1533; }

        .fab {
          position: fixed; bottom: 24px; right: 20px; z-index: 30;
          display:flex; align-items:center; gap: 8px; padding: 14px 20px;
          background: #F5B700; color: #1B1533; border-radius: 999px; font-weight: 700; font-size: 14px;
          box-shadow: 0 8px 24px rgba(245,183,0,0.35); border: none; cursor: pointer;
        }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15,11,28,0.75); backdrop-filter: blur(4px); z-index: 50; display:flex; align-items:flex-end; justify-content:center; }
        @media (min-width: 640px) { .modal-overlay { align-items: center; } }
        .modal { background: #241C3D; width: 100%; max-width: 480px; border-radius: 20px 20px 0 0; padding: 24px 20px 28px; max-height: 88vh; overflow-y: auto; border: 1px solid rgba(242,239,233,0.1); }
        @media (min-width: 640px) { .modal { border-radius: 20px; } }
        .modal h2 { font-size: 20px; margin: 0 0 4px; }
        .modal .sub { font-size: 13px; color: rgba(242,239,233,0.55); margin-bottom: 20px; }
        .field { margin-bottom: 16px; }
        .field label { display:block; font-size: 12.5px; font-weight: 600; margin-bottom: 7px; color: rgba(242,239,233,0.8); }
        .field input, .field textarea, .field select {
          width: 100%; background: rgba(242,239,233,0.05); border: 1px solid rgba(242,239,233,0.16);
          border-radius: 10px; padding: 11px 12px; color: #F2EFE9; font-family: 'Inter'; font-size: 14px;
        }
        .field textarea { resize: vertical; min-height: 70px; }
        .cat-grid { display:grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
        .cat-pick { display:flex; flex-direction:column; align-items:center; gap:6px; padding: 10px 6px; border-radius: 10px; border: 1px solid rgba(242,239,233,0.14); cursor:pointer; font-size: 11.5px; text-align:center; }
        .cat-pick.active { border-color: var(--pc); background: rgba(255,255,255,0.06); }
        .modal-close { position: absolute; top: 18px; right: 18px; background: rgba(242,239,233,0.08); border:none; width:32px; height:32px; border-radius: 8px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#F2EFE9; }
        .modal-actions { display:flex; gap: 10px; margin-top: 6px; }
        .modal-actions .btn { flex: 1; padding: 12px; }

        .toast {
          position: fixed; top: 76px; left: 50%; transform: translateX(-50%); z-index: 60;
          background: #F2EFE9; color: #1B1533; padding: 10px 18px; border-radius: 10px; font-size: 13.5px; font-weight: 600;
          box-shadow: 0 6px 18px rgba(0,0,0,0.3);
        }
        .empty { padding: 60px 20px; text-align:center; color: rgba(242,239,233,0.5); }
      `}</style>

      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">H</div>
          The Hub Social
        </div>
        {loadingUser ? null : user ? (
          <div className="user-chip">
            <div className="avatar">{user.name.split(" ").map((n) => n[0]).join("")}</div>
            <button className="btn btn-ghost" onClick={signOut}>
              <LogOut size={13} style={{ marginRight: 5, verticalAlign: "-2px" }} />
              Sign out
            </button>
          </div>
        ) : (
          <button className="btn btn-google" onClick={signIn}>
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.4 35.5 26.8 36.5 24 36.5c-5.3 0-9.8-3.4-11.4-8.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3-3.1 5.4-5.9 6.9l6.2 5.2C39.2 37.4 44 31.4 44 24c0-1.3-.1-2.7-.4-3.5z"/>
            </svg>
            Sign in with Google
          </button>
        )}
      </div>

      <div className="hero">
        <div className="kicker">Waldrift · Arcon Park · Vereeniging</div>
        <h1>Find your people, five minutes from home.</h1>
        <p>
          Running crews, gaming nights, book circles, whatever you're into — started by neighbours,
          not an app store. See what's on, or start your own.
        </p>
        {!user && (
          <button className="btn btn-primary" onClick={signIn} style={{ padding: "12px 20px", fontSize: 14.5 }}>
            Sign in to join a circle
          </button>
        )}
      </div>

      <div className="filters">
        <div className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          All circles
        </div>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.id} className={`chip ${filter === c.id ? "active" : ""}`} onClick={() => setFilter(c.id)}>
              <Icon size={14} />
              {c.label}
            </div>
          );
        })}
      </div>

      <div className="area-row">
        <div className={`area-pill ${areaFilter === "all" ? "active" : ""}`} onClick={() => setAreaFilter("all")}>
          All areas
        </div>
        {AREAS.map((a) => (
          <div key={a} className={`area-pill ${areaFilter === a ? "active" : ""}`} onClick={() => setAreaFilter(a)}>
            <MapPin size={11} style={{ verticalAlign: "-1px", marginRight: 3 }} />
            {a}
          </div>
        ))}
      </div>

      <div className="board">
        {visible.length === 0 && (
          <div className="empty">Nothing here yet — be the first to start a circle in this category.</div>
        )}
        {visible.map((c) => {
          const info = catInfo(c.category);
          const Icon = info.icon;
          const joined = user && c.joined.includes(user.name);
          return (
            <div className="card" key={c.id} style={{ "--accent": info.color }}>
              <div className="card-cat">
                <Icon size={15} />
                {info.label} · {c.area}
              </div>
              <h3>{c.title}</h3>
              <p className="desc">{c.description}</p>
              <div className="meta-row">
                <MapPin size={12} /> {c.location}
              </div>
              <div className="meta-row">
                <Calendar size={12} /> {c.recurring}
              </div>
              <div className="card-footer">
                <div>
                  <div className="when-badge">{timeUntil(c.when)}</div>
                  <div className="join-count">
                    <Users size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />
                    {c.joined.length} going · hosted by {c.host}
                  </div>
                </div>
                <button
                  className={`btn btn-join ${joined ? "joined" : "not-joined"}`}
                  style={{ "--accent": info.color }}
                  onClick={() => toggleJoin(c.id)}
                >
                  {joined ? "Going ✓" : "Join"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button className="fab" onClick={() => (user ? setShowCreate(true) : signIn())}>
        <Plus size={17} />
        Start a circle
      </button>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={createCircle} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function CreateModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("running");
  const [area, setArea] = useState(AREAS[0]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [recurring, setRecurring] = useState("");
  const [when, setWhen] = useState("");

  const canSubmit = title.trim() && description.trim() && location.trim() && when;

  const submit = () => {
    if (!canSubmit) return;
    onCreate({
      title: title.trim(),
      category,
      area,
      description: description.trim(),
      location: location.trim(),
      recurring: recurring.trim() || "One-off event",
      when: new Date(when).toISOString(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={16} />
        </button>
        <h2>Start a circle</h2>
        <div className="sub">Anyone can organise a group around something. This one's yours.</div>

        <div className="field">
          <label>What's it called?</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sunday morning 5-a-side" />
        </div>

        <div className="field">
          <label>Category</label>
          <div className="cat-grid">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.id}
                  className={`cat-pick ${category === c.id ? "active" : ""}`}
                  style={{ "--pc": c.color }}
                  onClick={() => setCategory(c.id)}
                >
                  <Icon size={17} color={category === c.id ? c.color : "#F2EFE9"} />
                  {c.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label>Area</label>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            {AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Tell people what to expect</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pace, skill level, what to bring, anything a first-timer should know." />
        </div>

        <div className="field">
          <label>Meeting point</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Waldrift Community Centre, hall 2" />
        </div>

        <div className="field">
          <label>First / next date & time</label>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </div>

        <div className="field">
          <label>How often does it happen? (optional)</label>
          <input value={recurring} onChange={(e) => setRecurring(e.target.value)} placeholder="e.g. Every Tuesday, 6 PM" />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!canSubmit} style={{ opacity: canSubmit ? 1 : 0.5 }}>
            Post to the board
          </button>
        </div>
      </div>
    </div>
  );
}
