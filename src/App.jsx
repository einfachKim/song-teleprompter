import { useState, useEffect, useRef, useCallback } from "react";

// ─── Persistence helpers ───
const STORAGE_KEY = "teleprompter_songs";
const SETLIST_KEY = "teleprompter_setlist";

const loadSongs = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
};
const saveSongs = (songs) => localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
const loadSetlist = () => {
  try { return JSON.parse(localStorage.getItem(SETLIST_KEY)) || []; }
  catch { return []; }
};
const saveSetlist = (ids) => localStorage.setItem(SETLIST_KEY, JSON.stringify(ids));

// ─── Unique ID ───
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ─── Song accent colors ───
const ACCENT_COLORS = ["#f59e0b", "#60a5fa", "#a78bfa", "#34d399", "#f87171", "#fb923c", "#38bdf8", "#e879f9"];
const accentColor = (id) => {
  const n = (id || "").split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return ACCENT_COLORS[n % ACCENT_COLORS.length];
};

// ─── Theme tokens ───
const DARK_THEME = {
  appBg: "linear-gradient(170deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)",
  headerBg: "rgba(15,15,20,0.85)",
  headerBorder: "#2a2a3a",
  surface: "rgba(255,255,255,0.04)",
  border: "#2a2a3a",
  text: "#e5e5e5",
  textStrong: "#f5f5f5",
  textMuted: "#9ca3af",
  textFaint: "#6b7280",
  inputBg: "rgba(255,255,255,0.06)",
  inputBorder: "#2a2a3a",
  btnSecBg: "rgba(255,255,255,0.05)",
  btnSecBorder: "#3a3a4a",
  btnSecText: "#d1d5db",
  btnSmallBg: "rgba(255,255,255,0.06)",
  accent: "#f59e0b",
  accentDim: "#f59e0b22",
  danger: "#fca5a5",
  dangerBg: "rgba(127,29,29,0.2)",
  dangerBorder: "#7f1d1d",
  dropOverlayBg: "rgba(15,15,30,0.92)",
};

const LIGHT_THEME = {
  appBg: "linear-gradient(170deg, #f5f0e8 0%, #ede8dc 50%, #f5f0e8 100%)",
  headerBg: "rgba(245,240,232,0.95)",
  headerBorder: "#d6cfc2",
  surface: "rgba(0,0,0,0.04)",
  border: "#d6cfc2",
  text: "#2d2926",
  textStrong: "#111",
  textMuted: "#6b6560",
  textFaint: "#9a948e",
  inputBg: "rgba(0,0,0,0.04)",
  inputBorder: "#c8c0b4",
  btnSecBg: "rgba(0,0,0,0.04)",
  btnSecBorder: "#c8c0b4",
  btnSecText: "#3d3830",
  btnSmallBg: "rgba(0,0,0,0.06)",
  accent: "#b45309",
  accentDim: "#b4530922",
  danger: "#b91c1c",
  dangerBg: "rgba(185,28,28,0.08)",
  dangerBorder: "#fca5a5",
  dropOverlayBg: "rgba(245,240,232,0.92)",
};

// ─── Icons (inline SVG paths) ───
const Icon = ({ d, size = 20, color = "currentColor", ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d={d} />
  </svg>
);

const icons = {
  play:     "M5 3l14 9-14 9V3z",
  stop:     "M6 6h12v12H6z",
  plus:     "M12 5v14M5 12h14",
  trash:    "M3 6h18M8 6V4h8v2M5 6l1 14h12l1-14",
  edit:     "M11 4H4v16h16v-7M18.5 2.5l3 3L12 15H9v-3l9.5-9.5z",
  list:     "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  up:       "M18 15l-6-6-6 6",
  down:     "M6 9l6 6 6-6",
  skipFwd:  "M5 4l10 8-10 8V4zM19 5v14",
  skipBack: "M19 20L9 12l10-8v16zM5 19V5",
  x:        "M18 6L6 18M6 6l12 12",
  save:     "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  music:    "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  upload:   "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  maximize:    "M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3",
  minimize:    "M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3",
  alignLeft:   "M3 6h18M3 12h12M3 18h15",
  alignCenter: "M3 6h18M6 12h12M4 18h16",
  sun:      "M12 3v1M12 20v1M4.22 4.22l.7.7M18.36 18.36l.7.7M3 12H2M22 12h-1M4.22 19.78l.7-.7M18.36 5.64l.7-.7M12 8a4 4 0 100 8 4 4 0 000-8z",
  moon:     "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  rewind:   "M11 19V5l-7 7 7 7zM21 19V5l-7 7 7 7z",
  fastFwd:  "M13 5v14l7-7-7-7zM3 5v14l7-7-7-7z",
  docx:     "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  help:     "M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01",
};

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function SongTeleprompter() {
  const [songs, setSongs] = useState(loadSongs);
  const [setlist, setSetlist] = useState(loadSetlist);
  const [view, setView] = useState("library"); // library | setlist | perform | edit
  const [activeSongId, setActiveSongId] = useState(null);
  const [editSong, setEditSong] = useState(null);
  const [setlistIndex, setSetlistIndex] = useState(0);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("teleprompter_theme") !== "light");
  const [showHelp, setShowHelp] = useState(false);
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  useEffect(() => { saveSongs(songs); }, [songs]);
  useEffect(() => { saveSetlist(setlist); }, [setlist]);
  useEffect(() => { localStorage.setItem("teleprompter_theme", isDark ? "dark" : "light"); }, [isDark]);

  // ─── Song CRUD ───
  const addSong = (song) => {
    const newSong = { ...song, id: uid() };
    setSongs((prev) => [...prev, newSong]);
    return newSong.id;
  };

  const updateSong = (id, updates) => {
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSong = (id) => {
    setSongs((prev) => prev.filter((s) => s.id !== id));
    setSetlist((prev) => prev.filter((sid) => sid !== id));
  };

  // ─── Setlist ───
  const addToSetlist = (id) => {
    if (!setlist.includes(id)) setSetlist((prev) => [...prev, id]);
  };

  const addAllToSetlist = () => {
    const missing = songs.map((s) => s.id).filter((id) => !setlist.includes(id));
    if (missing.length > 0) setSetlist((prev) => [...prev, ...missing]);
  };

  const removeFromSetlist = (id) => {
    setSetlist((prev) => prev.filter((sid) => sid !== id));
  };

  const moveInSetlist = (index, dir) => {
    const next = index + dir;
    if (next < 0 || next >= setlist.length) return;
    setSetlist((prev) => {
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr;
    });
  };

  const moveSetlistItem = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    setSetlist((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  };

  // ─── Performance ───
  const startPerformance = (songId, fromSetlist = false) => {
    setActiveSongId(songId);
    if (fromSetlist) {
      const idx = setlist.indexOf(songId);
      setSetlistIndex(idx >= 0 ? idx : 0);
    }
    setView("perform");
  };

  const nextSong = () => {
    const nextIdx = setlistIndex + 1;
    if (nextIdx < setlist.length) {
      setSetlistIndex(nextIdx);
      setActiveSongId(setlist[nextIdx]);
    }
  };

  const prevSong = () => {
    const prevIdx = setlistIndex - 1;
    if (prevIdx >= 0) {
      setSetlistIndex(prevIdx);
      setActiveSongId(setlist[prevIdx]);
    }
  };

  const activeSong = songs.find((s) => s.id === activeSongId);

  // ─── Export / Import ───
  const exportSetlistJSON = () => {
    const data = {
      setlist: setlist.map((id) => songs.find((s) => s.id === id)).filter(Boolean),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `setlist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSetlistJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.setlist && Array.isArray(data.setlist)) {
          const newIds = [];
          data.setlist.forEach((song) => {
            const existing = songs.find(
              (s) => s.title === song.title && s.text === song.text
            );
            if (existing) {
              newIds.push(existing.id);
            } else {
              const id = uid();
              setSongs((prev) => [...prev, { ...song, id }]);
              newIds.push(id);
            }
          });
          setSetlist(newIds);
        }
      } catch (err) {
        alert("Fehler beim Import: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const importTxtFile = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length === 1) {
      // Einzelne Datei → EditView zum Überprüfen
      const reader = new FileReader();
      reader.onload = (ev) => {
        const title = files[0].name.replace(/\.(txt|text)$/i, "");
        setEditSong({ title, text: ev.target.result, artist: "" });
        setView("edit");
      };
      reader.readAsText(files[0]);
    } else {
      // Mehrere Dateien → alle direkt in die Bibliothek
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const title = file.name.replace(/\.(txt|text)$/i, "");
          setSongs((prev) => [...prev, { id: uid(), title, text: ev.target.result, artist: "" }]);
        };
        reader.readAsText(file);
      });
    }
    e.target.value = "";
  };

  // DOCX import – mammoth wird dynamisch geladen (npm install mammoth)
  const importDocxFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    import("mammoth")
      .then((mod) => {
        const mammoth = mod.default || mod;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const result = await mammoth.extractRawText({
              arrayBuffer: ev.target.result,
            });
            const title = file.name.replace(/\.docx$/i, "");
            setEditSong({ title, text: result.value.trim(), artist: "" });
            setView("edit");
          } catch (err) {
            alert("Fehler beim DOCX-Import: " + err.message);
          }
        };
        reader.readAsArrayBuffer(file);
      })
      .catch(() => {
        alert('DOCX-Import nicht verfügbar.\nBitte "npm install mammoth" ausführen.');
      });
    e.target.value = "";
  };

  // ─── Render ───
  if (view === "perform" && activeSong) {
    return (
      <PerformView
        song={activeSong}
        onExit={() => setView("library")}
        onNext={setlistIndex < setlist.length - 1 ? nextSong : null}
        onPrev={setlistIndex > 0 ? prevSong : null}
        currentIndex={setlistIndex}
        totalInSetlist={setlist.length}
        isSetlistMode={setlist.includes(activeSongId)}
      />
    );
  }

  if (view === "edit") {
    return (
      <EditView
        song={editSong}
        theme={theme}
        isDark={isDark}
        onSave={(song) => {
          if (song.id) updateSong(song.id, song);
          else addSong(song);
          setEditSong(null);
          setView("library");
        }}
        onCancel={() => {
          setEditSong(null);
          setView("library");
        }}
      />
    );
  }

  return (
    <div style={{ ...styles.app, background: theme.appBg, color: theme.text }} data-theme={isDark ? "dark" : "light"}>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} theme={theme} />}
      <header style={{ ...styles.header, background: theme.headerBg, borderBottom: `1px solid ${theme.headerBorder}` }}>
        <div style={styles.headerLeft}>
          <Icon d={icons.music} size={28} color={theme.accent} />
          <h1 style={{ ...styles.title, color: theme.accent }}>Song Teleprompter</h1>
        </div>
        <div style={styles.tabs}>
          <button
            className="tab-btn"
            style={{ ...styles.tab, color: theme.textMuted, ...(view === "library" ? { background: theme.accentDim, color: theme.accent } : {}) }}
            onClick={() => setView("library")}
          >
            Bibliothek ({songs.length})
          </button>
          <button
            className="tab-btn"
            style={{ ...styles.tab, color: theme.textMuted, ...(view === "setlist" ? { background: theme.accentDim, color: theme.accent } : {}) }}
            onClick={() => setView("setlist")}
          >
            Setlist ({setlist.length})
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className="btn-icon" style={{ ...styles.btnIcon, border: `1px solid ${theme.border}` }} onClick={() => setIsDark((d) => !d)} title="Design wechseln">
            <Icon d={isDark ? icons.sun : icons.moon} size={18} color={theme.textMuted} />
          </button>
          <button className="btn-icon" style={{ ...styles.btnIcon, border: `1px solid ${theme.border}` }} onClick={() => setShowHelp(true)} title="Hilfe">
            <Icon d={icons.help} size={18} color={theme.textMuted} />
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {view === "library" && (
          <LibraryView
            theme={theme}
            songs={songs}
            setlist={setlist}
            onAdd={() => {
              setEditSong({ title: "", text: "", artist: "" });
              setView("edit");
            }}
            onEdit={(song) => {
              setEditSong(song);
              setView("edit");
            }}
            onDelete={deleteSong}
            onAddToSetlist={addToSetlist}
            onPlay={(id) => startPerformance(id, false)}
            onImportTxt={importTxtFile}
            onImportDocx={importDocxFile}
            onAddAllToSetlist={addAllToSetlist}
            onDropFiles={(newSongs) => {
              newSongs.forEach((s) => setSongs((prev) => [...prev, { id: uid(), ...s }]));
            }}
            onClearLibrary={() => { setSongs([]); setSetlist([]); }}
          />
        )}
        {view === "setlist" && (
          <SetlistView
            theme={theme}
            setlist={setlist}
            songs={songs}
            onRemove={removeFromSetlist}
            onMove={moveInSetlist}
            onMoveItem={moveSetlistItem}
            onPlay={(id) => startPerformance(id, true)}
            onPlayAll={() => {
              if (setlist.length > 0) {
                setSetlistIndex(0);
                startPerformance(setlist[0], true);
              }
            }}
            onExport={exportSetlistJSON}
            onImport={importSetlistJSON}
            onClear={() => setSetlist([])}
          />
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════
// LIBRARY VIEW
// ═══════════════════════════════════════════
function LibraryView({
  theme,
  songs,
  setlist,
  onAdd,
  onEdit,
  onDelete,
  onAddToSetlist,
  onAddAllToSetlist,
  onPlay,
  onImportTxt,
  onImportDocx,
  onDropFiles,
  onClearLibrary,
}) {
  const txtRef = useRef(null);
  const docxRef = useRef(null);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmClearLibrary, setConfirmClearLibrary] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragOver(true);
  };
  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const txtFiles = files.filter((f) => /\.(txt|text)$/i.test(f.name));
    const docxFiles = files.filter((f) => /\.docx$/i.test(f.name));
    // TXT — direkt in Bibliothek
    txtFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const title = file.name.replace(/\.(txt|text)$/i, "");
        onDropFiles([{ title, text: ev.target.result, artist: "" }]);
      };
      reader.readAsText(file);
    });
    // DOCX — via mammoth
    if (docxFiles.length > 0) {
      import("mammoth").then((mod) => {
        const mammoth = mod.default || mod;
        docxFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onload = async (ev) => {
            try {
              const result = await mammoth.extractRawText({ arrayBuffer: ev.target.result });
              const title = file.name.replace(/\.docx$/i, "");
              onDropFiles([{ title, text: result.value.trim(), artist: "" }]);
            } catch { /* ignore */ }
          };
          reader.readAsArrayBuffer(file);
        });
      }).catch(() => {});
    }
  };

  const filtered = search.trim()
    ? songs.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.artist || "").toLowerCase().includes(search.toLowerCase())
      )
    : songs;

  return (
    <div
      style={{ ...styles.viewContainer, position: "relative" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {isDragOver && (
        <div style={styles.dropOverlay}>
          <div style={styles.dropOverlayInner}>
            <Icon d={icons.upload} size={48} color="#f59e0b" />
            <p style={{ color: "#f59e0b", fontSize: 20, fontWeight: 700, margin: 0 }}>
              Dateien hier ablegen
            </p>
            <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>TXT und DOCX werden unterstützt</p>
          </div>
        </div>
      )}
      <div style={styles.toolbar}>
        <button className="btn-primary" style={{ ...styles.btnPrimary, background: theme.accent, color: "#111" }} onClick={onAdd}>
          <Icon d={icons.plus} size={16} /> Neuer Song
        </button>
        <button className="btn-secondary" style={{ ...styles.btnSecondary, background: theme.btnSecBg, border: `1px solid ${theme.btnSecBorder}`, color: theme.btnSecText }} onClick={() => txtRef.current?.click()}>
          <Icon d={icons.upload} size={16} /> TXT importieren
        </button>
        <button className="btn-secondary" style={{ ...styles.btnSecondary, background: theme.btnSecBg, border: `1px solid ${theme.btnSecBorder}`, color: theme.btnSecText }} onClick={() => docxRef.current?.click()}>
          <Icon d={icons.docx} size={16} /> DOCX importieren
        </button>
        {songs.length > 0 && (
          <button className="btn-secondary" style={{ ...styles.btnSecondary, background: theme.btnSecBg, border: `1px solid ${theme.btnSecBorder}`, color: theme.btnSecText }} onClick={onAddAllToSetlist}>
            <Icon d={icons.list} size={16} /> Alle zur Setlist
          </button>
        )}
        {songs.length > 0 && (
          confirmClearLibrary ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: theme.danger, fontSize: 13 }}>Alle {songs.length} Songs löschen?</span>
              <button className="btn-danger" style={{ ...styles.btnDanger, background: theme.dangerBg, border: `1px solid ${theme.dangerBorder}`, color: theme.danger }}
                onClick={() => { onClearLibrary(); setConfirmClearLibrary(false); }}>
                Ja, löschen
              </button>
              <button className="btn-secondary" style={{ ...styles.btnSecondary, background: theme.btnSecBg, border: `1px solid ${theme.btnSecBorder}`, color: theme.btnSecText }}
                onClick={() => setConfirmClearLibrary(false)}>
                Abbrechen
              </button>
            </div>
          ) : (
            <button className="btn-danger" style={{ ...styles.btnDanger, background: theme.dangerBg, border: `1px solid ${theme.dangerBorder}`, color: theme.danger }}
              onClick={() => setConfirmClearLibrary(true)}>
              <Icon d={icons.trash} size={16} /> Bibliothek leeren
            </button>
          )
        )}
        <input
          ref={txtRef}
          type="file"
          accept=".txt,.text"
          multiple
          style={{ display: "none" }}
          onChange={onImportTxt}
        />
        <input
          ref={docxRef}
          type="file"
          accept=".docx"
          style={{ display: "none" }}
          onChange={onImportDocx}
        />
      </div>

      {songs.length > 0 && (
        <div style={styles.searchRow}>
          <input
            className="search-input"
            style={{ ...styles.searchInput, background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textStrong }}
            placeholder="Songs durchsuchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="btn-icon" style={{ ...styles.btnIcon, border: `1px solid ${theme.border}`, flexShrink: 0 }} onClick={() => setSearch("")}>
              <Icon d={icons.x} size={16} color={theme.textMuted} />
            </button>
          )}
        </div>
      )}

      {songs.length === 0 ? (
        <div style={styles.empty}>
          <Icon d={icons.music} size={48} color={theme.textFaint} />
          <p style={{ ...styles.emptyText, color: theme.textFaint }}>Noch keine Songs. Füge deinen ersten Song hinzu!</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>
          <Icon d={icons.x} size={36} color={theme.textFaint} />
          <p style={{ ...styles.emptyText, color: theme.textFaint }}>Kein Song gefunden für „{search}"</p>
        </div>
      ) : (
        <div style={styles.songGrid}>
          {filtered.map((song) => (
            <div
              key={song.id}
              className="song-card"
              style={{ ...styles.songCard, background: theme.surface, border: `1px solid ${theme.border}`, borderLeft: `3px solid ${accentColor(song.id)}` }}
            >
              <div style={styles.songCardHeader}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ ...styles.songTitle, color: theme.textStrong }}>{song.title || "Ohne Titel"}</h3>
                  {song.artist && <p style={{ ...styles.songArtist, color: theme.textMuted }}>{song.artist}</p>}
                </div>
                <span style={{ ...styles.songLines, color: theme.textFaint }}>
                  {song.text.split("\n").filter((l) => l.trim()).length} Zeilen
                </span>
              </div>
              <p style={{ ...styles.songPreview, color: theme.textFaint }}>
                {song.text.slice(0, 120)}
                {song.text.length > 120 ? "…" : ""}
              </p>
              <div style={styles.songActions}>
                <button className="btn-icon" style={{ ...styles.btnIcon, border: `1px solid ${theme.border}` }} title="Abspielen" onClick={() => onPlay(song.id)}>
                  <Icon d={icons.play} size={18} color="#22c55e" />
                </button>
                <button className="btn-icon" style={{ ...styles.btnIcon, border: `1px solid ${theme.border}` }} title="Bearbeiten" onClick={() => onEdit(song)}>
                  <Icon d={icons.edit} size={18} color="#60a5fa" />
                </button>
                {setlist.includes(song.id) ? (
                  <span style={{ ...styles.inSetlistBadge, color: theme.accent, background: theme.accentDim }}>✓ Setlist</span>
                ) : (
                  <button className="btn-icon" style={{ ...styles.btnIcon, border: `1px solid ${theme.border}` }} title="Zur Setlist" onClick={() => onAddToSetlist(song.id)}>
                    <Icon d={icons.list} size={18} color={theme.accent} />
                  </button>
                )}
                {confirmDeleteId === song.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      className="btn-danger"
                      style={{ ...styles.btnDanger, background: theme.dangerBg, border: `1px solid ${theme.dangerBorder}`, color: theme.danger, padding: "4px 10px", fontSize: 12 }}
                      onClick={() => { onDelete(song.id); setConfirmDeleteId(null); }}
                    >
                      Löschen
                    </button>
                    <button
                      className="btn-icon"
                      style={{ ...styles.btnIcon, border: `1px solid ${theme.border}` }}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      <Icon d={icons.x} size={15} color={theme.textMuted} />
                    </button>
                  </div>
                ) : (
                  <button className="btn-icon" style={{ ...styles.btnIcon, border: `1px solid ${theme.border}` }} title="Löschen"
                    onClick={() => setConfirmDeleteId(song.id)}>
                    <Icon d={icons.trash} size={18} color="#ef4444" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// SETLIST VIEW
// ═══════════════════════════════════════════
function SetlistView({
  theme,
  setlist,
  songs,
  onRemove,
  onMove,
  onMoveItem,
  onPlay,
  onPlayAll,
  onExport,
  onImport,
  onClear,
}) {
  const fileRef = useRef(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const setlistSongs = setlist.map((id) => songs.find((s) => s.id === id)).filter(Boolean);

  const handleDrop = (toIdx) => {
    if (dragIdx !== null) onMoveItem(dragIdx, toIdx);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div style={styles.viewContainer}>
      <div style={styles.toolbar}>
        {setlist.length > 0 && (
          <>
            <button className="btn-primary" style={{ ...styles.btnPrimary, background: theme.accent, color: "#111" }} onClick={onPlayAll}>
              <Icon d={icons.play} size={16} /> Aufführung starten
            </button>
            <button className="btn-secondary" style={{ ...styles.btnSecondary, background: theme.btnSecBg, border: `1px solid ${theme.btnSecBorder}`, color: theme.btnSecText }} onClick={onExport}>
              <Icon d={icons.download} size={16} /> Exportieren
            </button>
          </>
        )}
        <button className="btn-secondary" style={{ ...styles.btnSecondary, background: theme.btnSecBg, border: `1px solid ${theme.btnSecBorder}`, color: theme.btnSecText }} onClick={() => fileRef.current?.click()}>
          <Icon d={icons.upload} size={16} /> Importieren
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={onImport}
        />
        {setlist.length > 0 && (
          confirmClear ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: theme.danger, fontSize: 13 }}>Wirklich leeren?</span>
              <button className="btn-danger" style={{ ...styles.btnDanger, background: theme.dangerBg, border: `1px solid ${theme.dangerBorder}`, color: theme.danger }}
                onClick={() => { onClear(); setConfirmClear(false); }}>
                Ja, leeren
              </button>
              <button className="btn-secondary" style={{ ...styles.btnSecondary, background: theme.btnSecBg, border: `1px solid ${theme.btnSecBorder}`, color: theme.btnSecText }}
                onClick={() => setConfirmClear(false)}>
                Abbrechen
              </button>
            </div>
          ) : (
            <button className="btn-danger" style={{ ...styles.btnDanger, background: theme.dangerBg, border: `1px solid ${theme.dangerBorder}`, color: theme.danger }}
              onClick={() => setConfirmClear(true)}>
              <Icon d={icons.trash} size={16} /> Leeren
            </button>
          )
        )}
      </div>

      {setlistSongs.length === 0 ? (
        <div style={styles.empty}>
          <Icon d={icons.list} size={48} color={theme.textFaint} />
          <p style={{ ...styles.emptyText, color: theme.textFaint }}>
            Die Setlist ist leer. Füge Songs aus der Bibliothek hinzu.
          </p>
        </div>
      ) : (
        <div style={styles.setlistContainer}>
          {setlistSongs.map((song, idx) => (
            <div
              key={song.id}
              className={[
                "setlist-item",
                dragIdx === idx ? "dragging" : "",
                dragOverIdx === idx && dragIdx !== idx ? "drag-over" : "",
              ].join(" ")}
              style={{ ...styles.setlistItem, background: theme.surface, border: `1px solid ${theme.border}`, borderLeft: `3px solid ${accentColor(song.id)}`, cursor: "grab" }}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
            >
              <span style={{ ...styles.setlistNum, userSelect: "none", color: theme.accent }}>{idx + 1}</span>
              <div style={styles.setlistInfo}>
                <span style={{ ...styles.setlistSongTitle, color: theme.textStrong }}>{song.title}</span>
                {song.artist && <span style={{ ...styles.setlistArtist, color: theme.textMuted }}>{song.artist}</span>}
              </div>
              <div style={styles.setlistActions}>
                <button className="btn-small" style={{ ...styles.btnSmall, background: theme.btnSmallBg, color: theme.textMuted }} onClick={() => onMove(idx, -1)} disabled={idx === 0}>
                  <Icon d={icons.up} size={16} />
                </button>
                <button className="btn-small" style={{ ...styles.btnSmall, background: theme.btnSmallBg, color: theme.textMuted }} onClick={() => onMove(idx, 1)} disabled={idx === setlistSongs.length - 1}>
                  <Icon d={icons.down} size={16} />
                </button>
                <button className="btn-small" style={{ ...styles.btnSmall, background: theme.btnSmallBg }} onClick={() => onPlay(song.id)}>
                  <Icon d={icons.play} size={16} color="#22c55e" />
                </button>
                <button className="btn-small" style={{ ...styles.btnSmall, background: theme.btnSmallBg }} onClick={() => onRemove(song.id)}>
                  <Icon d={icons.x} size={16} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// EDIT VIEW
// ═══════════════════════════════════════════
function EditView({ song, theme, isDark, onSave, onCancel }) {
  const [title, setTitle] = useState(song?.title || "");
  const [artist, setArtist] = useState(song?.artist || "");
  const [text, setText] = useState(song?.text || "");

  return (
    <div style={{ ...styles.app, background: theme.appBg, color: theme.text }} data-theme={isDark ? "dark" : "light"}>
      <header style={{ ...styles.header, background: theme.headerBg, borderBottom: `1px solid ${theme.headerBorder}` }}>
        <h1 style={{ ...styles.title, color: theme.accent }}>{song?.id ? "Song bearbeiten" : "Neuer Song"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" style={{ ...styles.btnSecondary, background: theme.btnSecBg, border: `1px solid ${theme.btnSecBorder}`, color: theme.btnSecText }} onClick={onCancel}>
            Abbrechen
          </button>
          <button
            className="btn-primary"
            style={{ ...styles.btnPrimary, background: theme.accent, color: "#111", opacity: !text.trim() ? 0.5 : 1 }}
            onClick={() => onSave({ ...song, title: title || "Ohne Titel", artist, text })}
            disabled={!text.trim()}
          >
            <Icon d={icons.save} size={16} /> Speichern
          </button>
        </div>
      </header>
      <main style={styles.editMain}>
        <div style={styles.editRow}>
          <div style={styles.editField}>
            <label style={{ ...styles.label, color: theme.textMuted }}>Titel</label>
            <input
              style={{ ...styles.input, background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textStrong }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Songtitel…"
              autoFocus
            />
          </div>
          <div style={styles.editField}>
            <label style={{ ...styles.label, color: theme.textMuted }}>Interpret</label>
            <input
              style={{ ...styles.input, background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textStrong }}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Optional…"
            />
          </div>
        </div>
        <label style={{ ...styles.label, color: theme.textMuted }}>Songtext</label>
        <textarea
          style={{ ...styles.textarea, background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textStrong }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Hier den Songtext eingeben…\n\nTipp: Leerzeilen trennen die Strophen."}
          spellCheck={false}
        />
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════
// HELP MODAL
// ═══════════════════════════════════════════
function HelpModal({ onClose, theme }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: theme.accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</h3>
      {children}
    </div>
  );

  const Feature = ({ icon, label, desc }) => (
    <div style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.accentDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon d={icon} size={16} color={theme.accent} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.textStrong, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );

  const Key = ({ k }) => (
    <kbd style={{ display: "inline-block", padding: "2px 7px", borderRadius: 5, background: theme.surface, border: `1px solid ${theme.border}`, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: theme.textStrong, marginRight: 4 }}>{k}</kbd>
  );

  const Shortcut = ({ keys, desc }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
      <div style={{ minWidth: 140 }}>
        {keys.map((k) => <Key key={k} k={k} />)}
      </div>
      <span style={{ fontSize: 13, color: theme.textMuted }}>{desc}</span>
    </div>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: theme.headerBg, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "28px 32px", maxWidth: 520, width: "90%", maxHeight: "85vh", overflowY: "auto", color: theme.text, position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
        >
          <Icon d={icons.x} size={20} color={theme.textMuted} />
        </button>

        <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: theme.textStrong }}>
          Kurzanleitung
        </h2>

        <Section title="Funktionen">
          <Feature icon={icons.music} label="Bibliothek" desc="Verwalte deine Songs. Importiere TXT- oder DOCX-Dateien per Klick oder ziehe sie direkt ins Fenster." />
          <Feature icon={icons.list} label="Setlist" desc="Stelle die Reihenfolge deiner Songs zusammen. Ziehe Einträge zur Neusortierung. Exportiere & importiere als JSON." />
          <Feature icon={icons.edit} label="Editor" desc="Bearbeite Titel, Interpret und Songtext. Leerzeilen zwischen Strophen verbessern die Lesbarkeit im Teleprompter." />
          <Feature icon={icons.play} label="Teleprompter" desc="Startet den Vollbild-Teleprompter. Mit Countdown (wenn am Anfang) und automatischem Scroll in deinem Tempo." />
        </Section>

        <Section title="Tastenkürzel im Teleprompter">
          <Shortcut keys={["LEERTASTE"]} desc="Play / Pause (Countdown abbrechen)" />
          <Shortcut keys={["←", "→"]} desc="Zurück / Vorwärts springen" />
          <Shortcut keys={["↑", "↓"]} desc="Tempo erhöhen / verringern" />
          <Shortcut keys={["+", "−"]} desc="Schriftgröße ändern" />
          <Shortcut keys={["R"]} desc="Zurücksetzen (zum Anfang)" />
          <Shortcut keys={["F"]} desc="Vollbild ein/aus" />
          <Shortcut keys={["ESC"]} desc="Teleprompter beenden" />
        </Section>

        <Section title="Tipps">
          <p style={{ fontSize: 13, color: theme.textMuted, margin: 0, lineHeight: 1.7 }}>
            • Mehrere TXT-Dateien gleichzeitig importieren: alle direkt in die Bibliothek<br />
            • Songs per Drag & Drop in der Setlist umsortieren<br />
            • Tippe im Teleprompter auf den Bildschirm (Touch): kurzes Tippen = Play/Pause, Wischen = Tempo<br />
            • Deine Bibliothek und Setlist werden automatisch im Browser gespeichert
          </p>
        </Section>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PERFORM VIEW (Teleprompter)
// ═══════════════════════════════════════════
function PerformView({
  song,
  onExit,
  onNext,
  onPrev,
  currentIndex,
  totalInSetlist,
  isSetlistMode,
}) {
  const [scrolling, setScrolling] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [fontSize, setFontSize] = useState(42);
  const [countdown, setCountdown] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [textAlign, setTextAlign] = useState("left");

  const containerRef = useRef(null);
  const outerRef = useRef(null);
  const progressFillRef = useRef(null);
  const controlsTimer = useRef(null);
  const speedRef = useRef(speed);
  const scrollAccum = useRef(0);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Speed 0–20, exponentiell (0 = Stopp, 20 = schnell)
  // px pro Frame als Fließkommazahl — wird im RAF akkumuliert
  const getPixelSpeed = () => {
    const s = speedRef.current;
    if (s === 0) return 0;
    return Math.pow(s / 20, 1.6) * 5;
  };

  // Progress direkt ins DOM schreiben – kein React-State-Lag
  const updateProgress = (el) => {
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0 && progressFillRef.current) {
      const p = Math.min(1, el.scrollTop / maxScroll);
      progressFillRef.current.style.height = `${p * 100}%`;
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (!scrolling || !containerRef.current) return;
    scrollAccum.current = 0;
    let rafId;
    const step = () => {
      const el = containerRef.current;
      if (!el) return;
      scrollAccum.current += getPixelSpeed();
      const px = Math.floor(scrollAccum.current);
      if (px > 0) {
        el.scrollTop += px;
        scrollAccum.current -= px;
      }
      updateProgress(el);
      if (el.scrollTop >= el.scrollHeight - el.clientHeight - 2) {
        setScrolling(false);
        return;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [scrolling]);

  // Manual scroll tracking
  const handleScroll = () => {
    const el = containerRef.current;
    if (el) updateProgress(el);
  };

  // Countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setScrolling(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Fullscreen API
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      outerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Skip forward / backward (~7 seconds at medium speed)
  const skipBackward = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = Math.max(
        0,
        containerRef.current.scrollTop - 400
      );
    }
  }, []);

  const skipForward = useCallback(() => {
    if (containerRef.current) {
      const el = containerRef.current;
      el.scrollTop = Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + 400);
    }
  }, []);

  // Countdown nur wenn ganz oben, sonst direkt starten
  const startPlay = useCallback(() => {
    const atTop = !containerRef.current || containerRef.current.scrollTop < 10;
    if (atTop) setCountdown(3);
    else setScrolling(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        if (countdown !== null) { setCountdown(null); return; }
        if (scrolling) setScrolling(false);
        else startPlay();
      }
      if (e.key === "Escape" && !document.fullscreenElement) onExit();
      if (e.key === "ArrowUp") setSpeed((s) => Math.min(20, s + 1));
      if (e.key === "ArrowDown") setSpeed((s) => Math.max(0, s - 1));
      if (e.key === "ArrowRight") { e.preventDefault(); skipForward(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); skipBackward(); }
      if (e.key === "PageDown") skipForward();
      if (e.key === "PageUp") skipBackward();
      if (e.key === "+" || e.key === "=") setFontSize((s) => Math.min(80, s + 4));
      if (e.key === "-") setFontSize((s) => Math.max(20, s - 4));
      if (e.key === "r" || e.key === "R") {
        setScrolling(false);
        if (containerRef.current) containerRef.current.scrollTop = 0;
        if (progressFillRef.current) progressFillRef.current.style.height = "0%";
      }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scrolling, countdown, onExit, skipForward, skipBackward, toggleFullscreen]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    if (scrolling) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [scrolling]);

  useEffect(() => {
    resetControlsTimer();
  }, [scrolling, resetControlsTimer]);

  // Reset scroll when song changes
  useEffect(() => {
    setScrolling(false);
    if (progressFillRef.current) progressFillRef.current.style.height = "0%";
    setCountdown(null);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [song.id]);

  // Touch gestures
  const touchStartY = useRef(null);
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 60) {
      if (dy > 0) setSpeed((s) => Math.min(20, s + 1));
      else setSpeed((s) => Math.max(0, s - 1));
    } else if (Math.abs(dy) < 10) {
      if (countdown !== null) setCountdown(null);
      else if (scrolling) setScrolling(false);
      else startPlay();
    }
    touchStartY.current = null;
    resetControlsTimer();
  };

  // Dynamic colors
  const bg = isLightMode ? "#f5f5f0" : "#000";
  const textColor = isLightMode ? "#111" : "#f5f5f5";
  const barBg = isLightMode
    ? "linear-gradient(to bottom, rgba(245,245,240,0.97), transparent)"
    : "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)";
  const barBgBottom = isLightMode
    ? "linear-gradient(to top, rgba(245,245,240,0.97), transparent)"
    : "linear-gradient(to top, rgba(0,0,0,0.9), transparent)";

  return (
    <div
      ref={outerRef}
      style={{ ...styles.performContainer, background: bg }}
      onMouseMove={resetControlsTimer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div ref={progressFillRef} style={styles.progressFill} />
      </div>

      {/* Countdown overlay */}
      {countdown !== null && countdown > 0 && (
        <div style={styles.countdownOverlay}>
          <div style={styles.countdownNum}>{countdown}</div>
        </div>
      )}

      {/* Gradient fade — top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 100,
          background: barBg,
          pointerEvents: "none",
          zIndex: 105,
        }}
      />

      {/* Song text */}
      <div
        ref={containerRef}
        style={styles.performScroll}
        onScroll={handleScroll}
      >
        <div style={{ height: "40vh" }} />
        <div
          style={{
            ...styles.performText,
            fontSize,
            lineHeight: `${fontSize * 1.65}px`,
            color: textColor,
            textAlign,
            textShadow: isLightMode ? "none" : "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          {song.text}
        </div>
        <div style={{ height: "60vh" }} />
      </div>

      {/* Gradient fade — bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          background: barBgBottom,
          pointerEvents: "none",
          zIndex: 105,
        }}
      />

      {/* ── Top bar ── */}
      <div
        style={{
          ...styles.performTopBar,
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
          transition: "opacity 0.4s",
          background: barBg,
        }}
      >
        <button className="perform-btn" style={styles.performBtn} onClick={onExit}>
          <Icon d={icons.x} size={20} /> Beenden
        </button>

        <div style={styles.performSongInfo}>
          <span style={{ ...styles.performSongTitle, color: isLightMode ? "#b45309" : "#f59e0b" }}>
            {song.title}
          </span>
          {isSetlistMode && (
            <div style={styles.dotNav}>
              {Array.from({ length: Math.min(totalInSetlist, 20) }).map((_, i) => (
                <div key={i} style={{
                  height: 6,
                  width: i === currentIndex ? 18 : 6,
                  borderRadius: 3,
                  background: i === currentIndex ? "#f59e0b" : "rgba(255,255,255,0.25)",
                  transition: "width 0.3s, background 0.3s",
                  flexShrink: 0,
                }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button className="perform-btn" style={styles.performBtn} onClick={() => setFontSize((s) => Math.max(20, s - 4))}>A−</button>
          <span style={{ color: "#9ca3af", fontSize: 13 }}>{fontSize}px</span>
          <button className="perform-btn" style={styles.performBtn} onClick={() => setFontSize((s) => Math.min(80, s + 4))}>A+</button>
          <button className="perform-btn" style={styles.performBtn}
            onClick={() => setTextAlign((a) => a === "left" ? "center" : "left")}
            title="Ausrichtung">
            <Icon d={textAlign === "left" ? icons.alignCenter : icons.alignLeft} size={18} />
          </button>
          <button className="perform-btn" style={styles.performBtn} onClick={() => setIsLightMode((m) => !m)} title="Dark/Light">
            <Icon d={isLightMode ? icons.moon : icons.sun} size={18} />
          </button>
          <button className="perform-btn" style={styles.performBtn} onClick={toggleFullscreen} title="Vollbild (F)">
            <Icon d={isFullscreen ? icons.minimize : icons.maximize} size={18} />
          </button>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        style={{
          ...styles.performBottomBar,
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
          transition: "opacity 0.4s",
          background: barBgBottom,
        }}
      >
        {onPrev && (
          <button className="perform-btn" style={styles.performBtn} onClick={onPrev} title="Vorheriger Song">
            <Icon d={icons.skipBack} size={22} />
          </button>
        )}
        <button className="perform-btn" style={styles.performBtn} onClick={skipBackward} title="Zurückspringen">
          <Icon d={icons.rewind} size={20} />
        </button>
        <button className="perform-btn" style={styles.performBtn}
          onClick={() => { setScrolling(false); if (containerRef.current) containerRef.current.scrollTop = 0; if (progressFillRef.current) progressFillRef.current.style.height = "0%"; }}
          title="Stop & Reset">
          <Icon d={icons.stop} size={22} />
        </button>
        <button className="perform-play-btn" style={styles.performPlayBtn}
          onClick={() => { if (countdown !== null) setCountdown(null); else if (scrolling) setScrolling(false); else startPlay(); }}
          title="Play / Pause (LEERTASTE)">
          {scrolling ? (
            <svg width={28} height={28} viewBox="0 0 24 24" fill="#111" stroke="none">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width={28} height={28} viewBox="0 0 24 24" fill="#111" stroke="none">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <button className="perform-btn" style={styles.performBtn} onClick={skipForward} title="Vorwärtsspringen">
          <Icon d={icons.fastFwd} size={20} />
        </button>
        <div style={styles.speedControl}>
          <span style={styles.speedLabel}>{speed}</span>
          <input
            className="speed-slider"
            type="range"
            min="0"
            max="20"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </div>
        {onNext && (
          <button className="perform-btn" style={styles.performBtn} onClick={onNext} title="Nächster Song">
            <Icon d={icons.skipFwd} size={22} />
          </button>
        )}
      </div>

      {/* Keyboard hints */}
      <div
        style={{
          ...styles.keyHints,
          opacity: showControls && !scrolling ? 0.55 : 0,
          transition: "opacity 0.4s",
        }}
      >
        LEERTASTE = Start/Pause &nbsp;·&nbsp; ←→ = Skip &nbsp;·&nbsp; ↑↓ = Tempo
        &nbsp;·&nbsp; +/− = Schrift &nbsp;·&nbsp; R = Reset &nbsp;·&nbsp; F = Vollbild
        &nbsp;·&nbsp; ESC = Beenden
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const styles = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(170deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)",
    color: "#e5e5e5",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #2a2a3a",
    background: "rgba(15,15,20,0.85)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
    flexWrap: "wrap",
    gap: 12,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f59e0b",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  tabs: { display: "flex", gap: 4 },
  tab: {
    padding: "8px 20px",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
    fontWeight: 500,
    transition: "all 0.2s",
  },
  tabActive: {
    background: "#f59e0b22",
    color: "#f59e0b",
  },
  main: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "24px 16px",
  },
  viewContainer: {},
  dropOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(15,15,30,0.92)",
    border: "2px dashed #f59e0b",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    backdropFilter: "blur(4px)",
  },
  dropOverlayInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: 40,
  },
  searchRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    padding: "10px 14px",
    border: "1px solid #2a2a3a",
    borderRadius: 8,
    background: "rgba(255,255,255,0.05)",
    color: "#f5f5f5",
    fontSize: 14,
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  toolbar: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  btnPrimary: {
    padding: "10px 18px",
    border: "none",
    borderRadius: 8,
    background: "#f59e0b",
    color: "#111",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "opacity 0.15s",
  },
  btnSecondary: {
    padding: "10px 18px",
    border: "1px solid #3a3a4a",
    borderRadius: 8,
    background: "rgba(255,255,255,0.05)",
    color: "#d1d5db",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  btnDanger: {
    padding: "10px 18px",
    border: "1px solid #7f1d1d",
    borderRadius: 8,
    background: "rgba(127,29,29,0.2)",
    color: "#fca5a5",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  btnIcon: {
    width: 36,
    height: 36,
    border: "1px solid #2a2a3a",
    borderRadius: 8,
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  btnSmall: {
    width: 32,
    height: 32,
    border: "none",
    borderRadius: 6,
    background: "rgba(255,255,255,0.06)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  emptyText: { color: "#6b7280", fontSize: 16, margin: 0 },
  songGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 12,
  },
  songCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid #2a2a3a",
    borderRadius: 12,
    padding: 16,
    transition: "border-color 0.2s",
  },
  songCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  songTitle: { fontSize: 16, fontWeight: 600, color: "#f5f5f5", margin: 0 },
  songArtist: { fontSize: 13, color: "#9ca3af", margin: "2px 0 0" },
  songLines: { fontSize: 12, color: "#6b7280", whiteSpace: "nowrap", flexShrink: 0 },
  songPreview: {
    fontSize: 13,
    color: "#6b7280",
    margin: "0 0 12px",
    lineHeight: 1.5,
    whiteSpace: "pre-line",
    overflow: "hidden",
    maxHeight: 60,
  },
  songActions: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    flexWrap: "wrap",
  },
  inSetlistBadge: {
    fontSize: 11,
    color: "#f59e0b",
    background: "#f59e0b22",
    borderRadius: 4,
    padding: "2px 8px",
    whiteSpace: "nowrap",
  },
  setlistContainer: { display: "flex", flexDirection: "column", gap: 4 },
  setlistItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid #2a2a3a",
    borderRadius: 10,
  },
  setlistNum: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f59e0b",
    minWidth: 32,
    textAlign: "center",
    fontFamily: "'JetBrains Mono', monospace",
  },
  setlistInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  setlistSongTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#f5f5f5",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  setlistArtist: { fontSize: 13, color: "#9ca3af" },
  setlistActions: { display: "flex", gap: 4, flexShrink: 0 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#9ca3af",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #2a2a3a",
    borderRadius: 8,
    background: "rgba(255,255,255,0.06)",
    color: "#f5f5f5",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    flex: 1,
    minHeight: 320,
    padding: "14px 16px",
    border: "1px solid #2a2a3a",
    borderRadius: 8,
    background: "rgba(255,255,255,0.06)",
    color: "#f5f5f5",
    fontSize: 15,
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.7,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
  editMain: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  editRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  editField: {},

  // ─── PERFORM ───
  performContainer: {
    position: "fixed",
    inset: 0,
    background: "#000",
    zIndex: 100,
    overflow: "hidden",
  },
  progressTrack: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    background: "#1a1a2e",
    zIndex: 110,
  },
  progressFill: {
    width: "100%",
    height: "0%",
    background: "linear-gradient(to bottom, #f59e0b, #ef4444)",
    borderRadius: "0 0 2px 2px",
  },
  performScroll: {
    height: "100vh",
    overflowY: "auto",
    scrollbarWidth: "none",
  },
  performText: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 40px",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  performTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 120,
    gap: 12,
    flexWrap: "wrap",
  },
  performSongInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  performSongTitle: {
    fontSize: 15,
    fontWeight: 600,
  },
  performSetlistPos: { fontSize: 12, color: "#6b7280" },
  dotNav: {
    display: "flex",
    gap: 4,
    alignItems: "center",
    marginTop: 4,
  },
  performBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    zIndex: 120,
    flexWrap: "wrap",
  },
  performBtn: {
    padding: "8px 12px",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8,
    background: "rgba(0,0,0,0.5)",
    color: "#d1d5db",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 6,
    backdropFilter: "blur(4px)",
  },
  performPlayBtn: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    border: "none",
    background: "#f59e0b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 28px rgba(245,158,11,0.45)",
    flexShrink: 0,
  },
  speedControl: { display: "flex", alignItems: "center", gap: 6 },
  speedLabel: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f59e0b",
    minWidth: 24,
    textAlign: "center",
    fontFamily: "'JetBrains Mono', monospace",
  },
  countdownOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 130,
  },
  countdownNum: {
    fontSize: 160,
    fontWeight: 800,
    color: "#f59e0b",
    fontFamily: "'JetBrains Mono', monospace",
    textShadow: "0 0 60px rgba(245,158,11,0.5)",
  },
  keyHints: {
    position: "absolute",
    bottom: 86,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 11,
    color: "#6b7280",
    fontFamily: "'JetBrains Mono', monospace",
    zIndex: 115,
    pointerEvents: "none",
    padding: "0 20px",
  },
};
