import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminUsers.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function SectionHeader({ title, count, action }) {
    return (
        <div className="au-section-header">
            <h2>{title} <span>({count})</span></h2>
            {action}
        </div>
    );
}

function InviteTrainerBar({ onInvited }) {
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (!email) return;
        setMsg("Sending…");
        try {
            const res = await fetch(`${API_BASE}/invite-trainer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || "Invite failed");
            setMsg("Invitation sent");
            setEmail("");
            onInvited?.(); // reload lists
        } catch (err) {
            setMsg(err.message || "Network error");
        }
    };

    return (
        <form className="invite-bar" onSubmit={submit}>
            <input
                className="invite-input"
                type="email"
                placeholder="Type trainer email to invite"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <button className="invite-btn" type="submit">
                <span>＋</span> Invite
            </button>
            {msg && <span className="invite-msg">{msg}</span>}
        </form>
    );
}

function UserCard({ user, role, onOpenMenu, onOpen }) {
    const avatarSrc = `${API_BASE}/profile-image/${user.id}`; // proxy รูป
    return (
        <div className="au-card"  onClick={() => onOpen?.(user, role)} style={{cursor:'pointer'}}>
            <img className="au-card__avatar" src={avatarSrc} alt={user.name || user.email} />
            <div className="au-card__body">
                <div className="au-card__name">{user.name || "—"}</div>
                <div className="au-card__meta">
                    <span className="au-card__role">{role}</span>
                    <span className="au-card__email">{user.email}</span>
                </div>
            </div>
            <button className="au-card__menu" title="Actions"
                onClick={(e) => onOpenMenu?.(e, user, role)}
            >⋮</button>
        </div>
    );
}

export default function AdminUsers() {
    const [trainers, setTrainers] = useState([]);
    const [trainees, setTrainees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);
    const [menuAt, setMenuAt] = useState({ top: 0, left: 0 });
    const [selected, setSelected] = useState(null); // { user, role }


    const openUser = (user, role) => {
        if (role === "trainer") {
            navigate(`/admin/trainers/${user.id}`, { state: { trainer: user } });
        }else navigate(`/admin/trainees/${user.id}`, { state: { trainee: user }});
    };
    const openMenu = (e, user, role) => {
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        const W = 180;
        setMenuAt({
            top: r.bottom + 8 + window.scrollY,
            left: Math.min(window.innerWidth - W - 12, r.right - W + window.scrollX),
        });
        setSelected({ user, role });
        setMenuOpen(true);
    };

    useEffect(() => {
        const close = () => setMenuOpen(false);
        window.addEventListener("click", close);
        window.addEventListener("keydown", (ev) => ev.key === "Escape" && setMenuOpen(false));
        return () => {
            window.removeEventListener("click", close);
        };
    }, []);

    



    // ----- fetch list -----
    const load = async () => {
        setLoading(true); setErr("");
        try {
            const [r1, r2] = await Promise.all([
                fetch(`${API_BASE}/trainers`),
                fetch(`${API_BASE}/trainees`),
            ]);
            if (!r1.ok || !r2.ok) throw new Error("Load failed");
            const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
            setTrainers(Array.isArray(j1) ? j1 : []);
            setTrainees(Array.isArray(j2) ? j2 : []);
        } catch (e) { setErr(e.message || "Network error"); }
        setLoading(false);
    };


    // ----- delete user -----
    const deleteUser = async () => {
        if (!selected) return;
        const { user, role } = selected;
        if (!window.confirm(`ลบผู้ใช้ ${user.name || user.email}?`)) return;

        try {
            // เสนอ endpoint สำหรับแอดมินลบผู้ใช้ (ปรับให้ตรงกับ BE ถ้ามี path อื่น)
            const res = await fetch(`${API_BASE}/admin/users/${user.id}`, { method: "DELETE" });
            if (!res.ok && res.status !== 204) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.detail || "Delete failed");
            }
            // อัปเดต state ทันที
            if (role === "trainer") setTrainers((arr) => arr.filter((x) => x.id !== user.id));
            if (role === "trainee") setTrainees((arr) => arr.filter((x) => x.id !== user.id));
        } catch (e) {
            alert(e.message);
        } finally {
            setMenuOpen(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            await load();
        })();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="au-wrap">
            {/* ===== Navbar ของคุณ (อย่าแตะ) ===== */}
            <nav className="fitaddict-navbar">
                <div className="fitaddict-logo">FitAddict</div>
                <ul className="fitaddict-navlinks">
                    <li><a href="/admin">Dashboard</a></li>
                    <li><a className="active" href="/admin/users">Users</a></li>
                    <li><a href="/admin/settings">Settings</a></li>
                    <li>
                        <button onClick={() => (window.location.href = '/')} className="nav-auth-btn">
                            Home
                        </button>
                    </li>
                </ul>
            </nav>

            <main className="au-main">
                <h1 className="au-title">Manage Users</h1>
                {err && <div className="au-alert">{err}</div>}

                {loading ? (
                    <div className="au-loading">Loading…</div>
                ) : (
                    <>
                        {/* ====== PANEL: TRAINERS (มี invite) ====== */}
                        <div className="au-panel">
                            <SectionHeader
                                title="Trainers"
                                count={trainers.length}
                                action={<InviteTrainerBar onInvited={load} />}
                            />
                            <div className="au-grid">
                                {trainers.map((u) => (
                                    <UserCard
                                        key={`t-${u.id}`}
                                        user={u}
                                        role="trainer"
                                        onOpenMenu={openMenu}
                                        onOpen={openUser}
                                    />
                                ))}
                                {trainers.length === 0 && <div className="au-empty">No trainers</div>}
                            </div>
                        </div>

                        {/* ====== PANEL: TRAINEES (แสดงอย่างเดียว — ไม่มี invite) ====== */}
                        <div className="au-panel">
                            <SectionHeader title="Trainees" count={trainees.length} action={null} />
                            <div className="au-grid">
                                {trainees.map((u) => (
                                    <UserCard
                                        key={`e-${u.id}`}
                                        user={u}
                                        role="trainee"
                                        onOpenMenu={openMenu}
                                        onOpen={openUser}
                                    />
                                ))}
                                {trainees.length === 0 && <div className="au-empty">No trainees</div>}
                            </div>
                        </div>
                    </>
                )}

                {/* dropdown menu (ลอย) */}
                {menuOpen && selected && (
                    <>
                        <div className="au-menu" style={{ top: menuAt.top, left: menuAt.left }}>
                            <button className="au-menu__item au-menu__item--danger" onClick={deleteUser}>
                                ลบผู้ใช้
                            </button>
                        </div>
                        <div className="au-menu__backdrop" />
                    </>
                )}


            </main>

            <footer className="au-footer">© {new Date().getFullYear()} FitAddict</footer>
        </div>
    );
}
