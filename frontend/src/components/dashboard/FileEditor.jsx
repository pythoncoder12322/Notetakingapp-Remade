import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { v4 as uuid } from "uuid";
import {
  Type,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Link as LinkIcon,
  Eraser,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Printer,
  Dot,
  Grid as GridIcon,
  PanelTop,
} from "lucide-react";

/**
 * FreeformPaperNote (JSX version) — revised
 */

const PAPER_SIZES = {
  letter: { label: "US Letter", width: 816, height: 1056 },
  a4: { label: "A4", width: 794, height: 1123 },
};

const STORAGE_KEY = "freeform-paper-note.v1";

const ToolbarButton = ({ title, onClick, active, disabled, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-sm transition
      ${active ? "bg-stone-200 border-stone-300" : "bg-white border-stone-200 hover:bg-stone-50"}
      disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

export default function FreeformPaperNote() {
  const [paper, setPaper] = useState("letter");
  const [zoom, setZoom] = useState(1);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(12);

  const paperRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorRefs = useRef({});

  const size = PAPER_SIZES[paper];

  // ---- Load & Save ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.items && Array.isArray(parsed.items)) {
          setItems(parsed.items);
        }
        if (parsed && parsed.paper) setPaper(parsed.paper);
      }
    } catch (e) {
      console.warn("Failed to load saved note", e);
    }
  }, []);

  useEffect(() => {
    const payload = { items, paper };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [items, paper]);

  // ---- Selection helpers ----
  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId]
  );

  const setEditorRef = (id) => (el) => {
    if (el) {
      editorRefs.current[id] = el;
    } else {
      delete editorRefs.current[id];
    }
  };

  const focusSelectedEditor = () => {
    if (!selectedId) return;
    const el = editorRefs.current[selectedId];
    if (el) {
      // move caret to end
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  // ---- Grid snapping ----
  const snap = useCallback(
    (n) => (snapToGrid ? Math.round(n / gridSize) * gridSize : n),
    [snapToGrid, gridSize]
  );

  // ---- Item CRUD ----
  const addText = () => {
    const id = uuid();
    const item = {
      id,
      type: "text",
      x: 48,
      y: 48,
      w: 260,
      h: 140,
      z: nextZ(items),
      // start empty — placeholder handled by data-placeholder on the contentEditable element
      html: "",
    };
    setItems((prev) => [...prev, item]);
    setSelectedId(id);
    // wait a frame then focus the new editor
    setTimeout(focusSelectedEditor, 50);
  };

  const addImageFromFile = (file) => {
    const url = URL.createObjectURL(file);
    const id = uuid();
    const item = {
      id,
      type: "image",
      x: 60,
      y: 60,
      w: 240,
      h: 180,
      z: nextZ(items),
      src: url,
      alt: file.name,
    };
    setItems((prev) => [...prev, item]);
    setSelectedId(id);
  };

  const duplicateSelected = () => {
    if (!selectedItem) return;
    const copy = {
      ...selectedItem,
      id: uuid(),
      x: selectedItem.x + 16,
      y: selectedItem.y + 16,
      z: nextZ(items),
      ...(selectedItem.type === "text"
        ? { html: selectedItem.html }
        : { src: selectedItem.src }),
    };
    setItems((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  };

  const bringForward = () => {
    if (!selectedItem) return;
    const maxZ = Math.max(...items.map((i) => i.z), 0);
    updateItem(selectedItem.id, { z: Math.min(selectedItem.z + 1, maxZ + 1) });
  };
  const sendBackward = () => {
    if (!selectedItem) return;
    const minZ = Math.min(...items.map((i) => i.z), 0);
    updateItem(selectedItem.id, { z: Math.max(selectedItem.z - 1, minZ - 1) });
  };

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const onTextInput = (id, e) => {
    const html = e.target.innerHTML;
    updateItem(id, { html });
  };

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e) => {
      if (!selectedItem) return;
      if ((e.key === "Delete" || e.key === "Backspace") && !isTypingIntoEditor()) {
        e.preventDefault();
        deleteSelected();
      }
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          duplicateSelected();
        }
      }
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        !isTypingIntoEditor()
      ) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowRight" ? delta : e.key === "ArrowLeft" ? -delta : 0;
        const dy = e.key === "ArrowDown" ? delta : e.key === "ArrowUp" ? -delta : 0;
        updateItem(selectedItem.id, {
          x: snap(selectedItem.x + dx),
          y: snap(selectedItem.y + dy),
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedItem, snap]);

  const isTypingIntoEditor = () => {
    const active = document.activeElement;
    return !!active && active.getAttribute("data-editor") === "true";
  };

  // ---- Formatting actions ----
  const applyCmd = (cmd, value) => {
    if (cmd === "highlight") {
      const realCmd = document.queryCommandSupported("hiliteColor")
        ? "hiliteColor"
        : "backColor";
      document.execCommand(realCmd, false, value ?? "#fff59d");
      return;
    }
    document.execCommand(cmd, false, value);
  };

  const addLink = () => {
    const href = prompt("Enter URL:");
    if (!href) return;
    applyCmd("createLink", href);
  };

  // ---- Export / Print ----
  const printPage = () => {
    window.print();
  };

  // ---- Image handling ----
  const onPickImage = () => fileInputRef.current && fileInputRef.current.click();

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) addImageFromFile(f);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- Render helpers ----
  const pageStyle = {
    width: `${size.width}px`,
    height: `${size.height}px`,
  };

  const gridBg = useMemo(
    () =>
      showGrid
        ? {
            backgroundImage:
              `linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),` +
              `linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)`,
            backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`,
          }
        : {},
    [showGrid, gridSize]
  );

  return (
    <div className="w-full h-full flex flex-col bg-stone-100">
      {/* Top bar */}
      <div className="sticky top-0 z-50 flex flex-wrap items-center gap-2 p-2 border-b bg-white">
        <div className="flex items-center gap-2 pr-3 border-r">
          <span className="text-sm text-stone-600">Paper:</span>
          <select
            className="px-2 py-1 text-sm border rounded-md bg-white"
            value={paper}
            onChange={(e) => setPaper(e.target.value)}
          >
            {Object.entries(PAPER_SIZES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 ml-3">
            <span className="text-sm text-stone-600">Zoom</span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
            <span className="w-10 text-sm text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pr-3 border-r">
          <button onClick={addText} className="btn-soft">
            <Type className="w-4 h-4" /> Add text
          </button>
          <button onClick={onPickImage} className="btn-soft">
            <ImageIcon className="w-4 h-4" /> Add image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        <div className="flex items-center gap-1 pr-3 border-r">
          <ToolbarButton title="Bold" onClick={() => applyCmd("bold")}>
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => applyCmd("italic")}>
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Underline" onClick={() => applyCmd("underline")}>
            <Underline className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" onClick={() => applyCmd("strikeThrough")}>
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Highlight" onClick={() => applyCmd("highlight")}>
            <Highlighter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Bulleted list" onClick={() => applyCmd("insertUnorderedList")}>
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Numbered list" onClick={() => applyCmd("insertOrderedList")}>
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Link" onClick={addLink}>
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Clear formatting" onClick={() => applyCmd("removeFormat")}>
            <Eraser className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-2 pr-3 border-r">
          <ToolbarButton
            title="Duplicate (⌘/Ctrl+D)"
            onClick={duplicateSelected}
            disabled={!selectedItem}
          >
            <Copy className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Bring forward"
            onClick={bringForward}
            disabled={!selectedItem}
          >
            <ArrowUp className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Send backward"
            onClick={sendBackward}
            disabled={!selectedItem}
          >
            <ArrowDown className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Delete (Del/Backspace)"
            onClick={deleteSelected}
            disabled={!selectedItem}
          >
            <Trash2 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            <span className="inline-flex items-center gap-1">
              <GridIcon className="w-4 h-4" /> Grid
            </span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
            />
            <span className="inline-flex items-center gap-1">
              <Dot className="w-4 h-4" /> Snap
            </span>
          </label>
          <div className="flex items-center gap-2 text-sm">
            <span>Step</span>
            <input
              type="number"
              min={4}
              max={64}
              step={2}
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value || "12"))}
              className="w-16 px-2 py-1 border rounded-md"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={printPage} className="btn-soft">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="min-h-full w-full flex items-start justify-center">
        <div
            style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            }}
        >
            <div
            className="paper-shadow rounded-[12px] border border-stone-300 bg-[#fbfbf8] relative paper print:shadow-none"
            ref={paperRef}
            style={{
                ...pageStyle,
                ...gridBg,
            }}
            onMouseDown={(e) => {
                if (e.target === paperRef.current) setSelectedId(null);
            }}
            >
            {items
                .slice()
                .sort((a, b) => a.z - b.z)
                .map((item) => (
                <Rnd
                    key={item.id}
                    bounds="parent"
                    size={{ width: item.w, height: item.h }}
                    position={{ x: item.x, y: item.y }}
                    onDragStop={(_, d) =>
                    updateItem(item.id, { x: snap(d.x / zoom), y: snap(d.y / zoom) })
                    }
                    onResizeStop={(_, __, ref, ___, pos) =>
                    updateItem(item.id, {
                        w: snap(ref.offsetWidth / zoom),
                        h: snap(ref.offsetHeight / zoom),
                        x: snap(pos.x / zoom),
                        y: snap(pos.y / zoom),
                    })
                    }
                    style={{ zIndex: item.z }}
                    enableResizing={{
                    top: true,
                    right: true,
                    bottom: true,
                    left: true,
                    topLeft: true,
                    topRight: true,
                    bottomLeft: true,
                    bottomRight: true,
                    }}
                    cancel=".no-drag"
                    className={`absolute group ${selectedId === item.id ? "ring-2 ring-sky-400" : ""}`}
                    onMouseDown={() => setSelectedId(item.id)}
                >
                    {item.type === "text" ? (
                    <div className="w-full h-full flex flex-col relative">
                        <div
                        data-editor="true"
                        data-placeholder="Type here…"
                        ref={setEditorRef(item.id)}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => onTextInput(item.id, e)}
                        className="no-drag flex-1 outline-none p-2 text-[14px] leading-6 selection:bg-yellow-200/60 max-w-none overflow-auto"
                        onFocus={() => setSelectedId(item.id)}
                        style={{ background: "transparent" }}
                        />
                        <div className="absolute inset-0 pointer-events-none rounded-md border border-transparent group-hover:border-sky-300" />
                    </div>
                    ) : (
                    <div className="w-full h-full overflow-hidden rounded-md bg-white shadow-sm relative">
                        <img
                        src={item.src}
                        alt={item.alt || "image"}
                        className="w-full h-[calc(100%-24px)] object-contain bg-white"
                        draggable={false}
                        onMouseDown={() => setSelectedId(item.id)}
                        />
                        <div className="absolute inset-0 pointer-events-none rounded-md border border-transparent group-hover:border-sky-300" />
                    </div>
                    )}
                </Rnd>
                ))}
            </div>
        </div>
        </div>

      <style>{`
        .paper-shadow { box-shadow: 0 10px 30px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.06); }
        .btn-soft { @apply inline-flex items-center gap-1 px-3 py-1.5 rounded-md border bg-white hover:bg-stone-50 active:scale-[0.99] text-sm; }
        .paper { position: relative; }
        [data-placeholder]:empty:before { content: attr(data-placeholder); color: #9ca3af; display: block; pointer-events: none; }
        /* keep placeholder lightly padded */
        [data-placeholder] { min-height: 1.2em; }
        /* Make sure selection still visible */
        .no-drag::selection { background: rgba(255, 235, 59, 0.4); }

        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .paper { zoom: 1 !important; box-shadow: none !important; }
          .paper-shadow { box-shadow: none !important; }
          .drag-handle, .btn-soft, .border-b, .sticky { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function nextZ(items) {
  return (items.length ? Math.max(...items.map((i) => i.z)) : 0) + 1;
}
