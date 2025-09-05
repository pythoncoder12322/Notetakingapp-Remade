import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { v4 as uuid } from "uuid";
import {
  Type,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  Highlighter,
  Link as LinkIcon,
  Eraser,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Printer,
  Dot,
  Grid as GridIcon,
  Square,
  PenTool,
  RotateCcw,
  Save,
  Plus,
  FilePlus,
  Layers,
  RotateCw,
} from "lucide-react";

// Copy-ready single-file React component
// Features added/changed from original:
// - Multi-page support (create, duplicate, delete, rename, switch pages)
// - Shapes system supporting: rect, ellipse, line, arrow
//   - Fill, stroke color, stroke width
//   - Stroke dashing (dash length)
//   - Rotation / angling via rotate-handle + numeric input
// - Items (text, image, shape, pen strokes) live per-page
// - Persist pages to localStorage
// - Improved rotation handling that works together with Rnd dragging

const PAPER_SIZES = {
  letter: { label: "US Letter", width: 816, height: 1056 },
  a4: { label: "A4", width: 794, height: 1123 },
};

const STORAGE_KEY = "freeform-notability.pages.v2";

const TOOL = {
  SELECT: "select",
  TEXT: "text",
  IMAGE: "image",
  SHAPE: "shape",
  PEN: "pen",
};

const SHAPE = {
  RECT: "rect",
  ELLIPSE: "ellipse",
  LINE: "line",
  ARROW: "arrow",
};

const ToolbarButton = ({ title, onClick, active, disabled, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1 px-3 py-1 rounded-md border text-sm transition
      ${active ? "bg-stone-200 border-stone-300" : "bg-white border-stone-200 hover:bg-stone-50"}
      disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

export default function FreeformNotabilityLike() {
  // Pages: array of { id, name, items: [ ... ] }
  const [pages, setPages] = useState(() => [createBlankPage("Page 1")]);
  const [selectedPageId, setSelectedPageId] = useState(() => pages[0].id);

  const [paper, setPaper] = useState("letter");
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(12);

  const [tool, setTool] = useState(TOOL.SELECT);
  const [shapeType, setShapeType] = useState(SHAPE.RECT);
  const [strokeColor, setStrokeColor] = useState("#111827");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeDash, setStrokeDash] = useState(0);

  const [selectedId, setSelectedId] = useState(null);

  const paperRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorRefs = useRef({});
  const penCanvasRef = useRef(null);
  const rotatingRef = useRef({ active: false, itemId: null, center: null, startAngle: 0, startRotation: 0 });

  const size = PAPER_SIZES[paper];

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.pages) && parsed.pages.length) {
          setPages(parsed.pages);
          setSelectedPageId(parsed.selectedPageId ?? parsed.pages[0].id);
          if (parsed.paper) setPaper(parsed.paper);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages, selectedPageId, paper }));
    } catch (e) {
      console.warn(e);
    }
  }, [pages, selectedPageId, paper]);

  const selectedPage = useMemo(() => pages.find((p) => p.id === selectedPageId) || pages[0], [pages, selectedPageId]);
  const items = selectedPage?.items ?? [];
  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId]);

  const setEditorRef = (id) => (el) => {
    if (el) editorRefs.current[id] = el;
    else delete editorRefs.current[id];
  };

  const focusSelectedEditor = () => {
    if (!selectedId) return;
    const el = editorRefs.current[selectedId];
    if (el) {
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const snap = useCallback((n) => (snapToGrid ? Math.round(n / gridSize) * gridSize : n), [snapToGrid, gridSize]);

  // Page helpers
  function createBlankPage(name = "Page") {
    return { id: uuid(), name, items: [] };
  }

  const updatePages = (fn) => setPages((prev) => {
    const next = fn(prev.map((p) => ({ ...p, items: (p.items || []).map((it) => ({ ...it })) })));
    return next;
  });

  const addPage = () => {
    const p = createBlankPage(`Page ${pages.length + 1}`);
    updatePages((prev) => [...prev, p]);
    setSelectedPageId(p.id);
  };

  const duplicatePage = (id) => {
    const orig = pages.find((p) => p.id === id);
    if (!orig) return;
    const copy = { ...orig, id: uuid(), name: `${orig.name} copy`, items: orig.items.map((it) => ({ ...it, id: uuid() })) };
    updatePages((prev) => {
      const idx = prev.findIndex((pp) => pp.id === id);
      const arr = [...prev];
      arr.splice(idx + 1, 0, copy);
      return arr;
    });
    setSelectedPageId(copy.id);
  };

  const deletePage = (id) => {
    if (pages.length === 1) return; // keep at least one page
    updatePages((prev) => prev.filter((p) => p.id !== id));
    if (selectedPageId === id) setSelectedPageId(pages[0].id);
  };

  const renamePage = (id, name) => updatePages((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));

  // Item CRUD inside current page
  const updateItem = (id, patch) => {
    updatePages((prev) => prev.map((p) => {
      if (p.id !== selectedPageId) return p;
      return { ...p, items: p.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) };
    }));
  };

  const addItemToPage = (item) => {
    updatePages((prev) => prev.map((p) => (p.id === selectedPageId ? { ...p, items: [...p.items, item] } : p)));
  };

  const addText = (x = 48, y = 48) => {
    const id = uuid();
    const item = { id, type: "text", x, y, w: 300, h: 120, z: nextZ(items), html: "", rotation: 0 };
    addItemToPage(item);
    setSelectedId(id);
    setTimeout(() => focusSelectedEditor(), 60);
  };

  const addImageFromDataURL = (dataUrl, x = 60, y = 60, w = 240, h = 180) => {
    const id = uuid();
    const item = { id, type: "image", x, y, w, h, z: nextZ(items), src: dataUrl, alt: "image", rotation: 0 };
    addItemToPage(item);
    setSelectedId(id);
  };

  const addImageFromFile = (file) => {
    const url = URL.createObjectURL(file);
    addImageFromDataURL(url);
  };

  const addShape = (t = shapeType, x = 80, y = 80, w = 220, h = 120) => {
    const id = uuid();
    const item = {
      id,
      type: "shape",
      shapeType: t,
      x,
      y,
      w,
      h,
      z: nextZ(items),
      stroke: strokeColor,
      strokeWidth,
      fill: fillColor,
      strokeDash,
      rotation: 0,
    };
    addItemToPage(item);
    setSelectedId(id);
  };

  const duplicateSelected = () => {
    if (!selectedItem) return;
    const copy = { ...selectedItem, id: uuid(), x: selectedItem.x + 16, y: selectedItem.y + 16, z: nextZ(items) };
    addItemToPage(copy);
    setSelectedId(copy.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    updatePages((prev) => prev.map((p) => {
      if (p.id !== selectedPageId) return p;
      return { ...p, items: p.items.filter((i) => i.id !== selectedId) };
    }));
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

  // Text editing
  const onTextInput = (id, e) => {
    const html = e.target.innerHTML;
    updateItem(id, { html });
  };

  // Keyboard helpers
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && !isTypingIntoEditor()) {
        if (selectedItem) {
          e.preventDefault();
          deleteSelected();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      }
      if (selectedItem && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && !isTypingIntoEditor()) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowRight" ? delta : e.key === "ArrowLeft" ? -delta : 0;
        const dy = e.key === "ArrowDown" ? delta : e.key === "ArrowUp" ? -delta : 0;
        updateItem(selectedItem.id, { x: snap(selectedItem.x + dx), y: snap(selectedItem.y + dy) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedItem, snap]);

  const isTypingIntoEditor = () => {
    const active = document.activeElement;
    return !!active && active.getAttribute("data-editor") === "true";
  };

  // Formatting actions
  const applyCmd = (cmd, value) => {
    if (cmd === "highlight") {
      const realCmd = document.queryCommandSupported("hiliteColor") ? "hiliteColor" : "backColor";
      document.execCommand(realCmd, false, value ?? "#fff59d");
      return;
    }
    document.execCommand(cmd, false, value);
  };

  const addLink = () => {
    const href = prompt("Enter URL:");
    if (href) applyCmd("createLink", href);
  };

  const printPage = () => window.print();

  // Image input
  const onPickImage = () => fileInputRef.current?.click();
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) addImageFromFile(f);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- Pen (freehand) ----
  const drawing = useRef({ active: false, points: [], minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

  useEffect(() => {
    // Ensure canvas matches page size whenever paper/zoom changes
    const canvas = penCanvasRef.current;
    if (!canvas || !paperRef.current) return;
    canvas.width = size.width; // drawing in page CSS pixels
    canvas.height = size.height;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }, [paper, size.width, size.height, zoom]);

  const pageToLocal = (clientX, clientY) => {
    const rect = paperRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    return { x, y };
  };

  const handlePenPointerDown = (e) => {
    if (tool !== TOOL.PEN) return;
    e.preventDefault();
    const canvas = penCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(e.pointerId);
    const p = pageToLocal(e.clientX, e.clientY);
    drawing.current.active = true;
    drawing.current.points = [p];
    drawing.current.minX = p.x;
    drawing.current.minY = p.y;
    drawing.current.maxX = p.x;
    drawing.current.maxY = p.y;
    drawTempStroke();
  };

  const handlePenPointerMove = (e) => {
    if (tool !== TOOL.PEN || !drawing.current.active) return;
    e.preventDefault();
    const p = pageToLocal(e.clientX, e.clientY);
    drawing.current.points.push(p);
    drawing.current.minX = Math.min(drawing.current.minX, p.x);
    drawing.current.minY = Math.min(drawing.current.minY, p.y);
    drawing.current.maxX = Math.max(drawing.current.maxX, p.x);
    drawing.current.maxY = Math.max(drawing.current.maxY, p.y);
    drawTempStroke();
  };

  const handlePenPointerUp = (e) => {
    if (tool !== TOOL.PEN || !drawing.current.active) return;
    e.preventDefault();
    drawing.current.active = false;
    const pts = drawing.current.points.slice();
    if (pts.length < 2) {
      const p = pts[0];
      pts.push({ x: p.x + 0.1, y: p.y + 0.1 });
    }
    const pad = strokeWidth * 2;
    const minX = Math.max(0, Math.floor(drawing.current.minX - pad));
    const minY = Math.max(0, Math.floor(drawing.current.minY - pad));
    const maxX = Math.min(size.width, Math.ceil(drawing.current.maxX + pad));
    const maxY = Math.min(size.height, Math.ceil(drawing.current.maxY + pad));
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);

    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d");
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const x = pts[i].x - minX;
      const y = pts[i].y - minY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const src = off.toDataURL("image/png");
    addImageFromDataURL(src, minX, minY, w, h);

    const temp = penCanvasRef.current;
    if (temp) temp.getContext("2d").clearRect(0, 0, temp.width, temp.height);

    drawing.current.points = [];
  };

  const drawTempStroke = () => {
    const canvas = penCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pts = drawing.current.points;
    if (!pts || pts.length === 0) return;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  };

  // Rotation helpers
  const startRotate = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const p = pageToLocal(e.clientX, e.clientY);
    const center = { x: item.x + item.w / 2, y: item.y + item.h / 2 };
    const a = Math.atan2(p.y - center.y, p.x - center.x) * (180 / Math.PI);
    rotatingRef.current = { active: true, itemId: item.id, center, startAngle: a, startRotation: item.rotation || 0 };

    const onMove = (ev) => {
      if (!rotatingRef.current.active) return;
      const cur = pageToLocal(ev.clientX, ev.clientY);
      const curA = Math.atan2(cur.y - center.y, cur.x - center.x) * (180 / Math.PI);
      const delta = curA - rotatingRef.current.startAngle;
      const nextRot = rotatingRef.current.startRotation + delta;
      updateItem(item.id, { rotation: Math.round(nextRot) });
    };

    const onUp = () => {
      rotatingRef.current = { active: false, itemId: null, center: null, startAngle: 0, startRotation: 0 };
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Utility: render a shape as SVG (applies rotation via CSS transform)
  const renderShapeSVG = (item) => {
    const sw = item.strokeWidth ?? 2;
    const stroke = item.stroke ?? "#111827";
    const fill = item.fill ?? "transparent";
    const dash = item.strokeDash ? String(item.strokeDash) : "";
    const w = Math.max(1, item.w);
    const h = Math.max(1, item.h);
    const rot = item.rotation || 0;
    const transformOrigin = `${w / 2}px ${h / 2}px`;

    if (item.shapeType === SHAPE.RECT) {
      return (
        <div style={{ width: "100%", height: "100%", transform: `rotate(${rot}deg)`, transformOrigin }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <rect x={sw / 2} y={sw / 2} width={w - sw} height={h - sw} rx={8} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash || undefined} />
          </svg>
        </div>
      );
    }

    if (item.shapeType === SHAPE.ELLIPSE) {
      return (
        <div style={{ width: "100%", height: "100%", transform: `rotate(${rot}deg)`, transformOrigin }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <ellipse cx={w / 2} cy={h / 2} rx={(w - sw) / 2} ry={(h - sw) / 2} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash || undefined} />
          </svg>
        </div>
      );
    }

    if (item.shapeType === SHAPE.LINE || item.shapeType === SHAPE.ARROW) {
      const x1 = sw;
      const y1 = h / 2;
      const x2 = w - sw;
      const y2 = h / 2;
      return (
        <div style={{ width: "100%", height: "100%", transform: `rotate(${rot}deg)`, transformOrigin }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <defs>
              <marker id={`arrow-${item.id}`} markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill={stroke} />
              </marker>
            </defs>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw} markerEnd={item.shapeType === SHAPE.ARROW ? `url(#arrow-${item.id})` : undefined} strokeLinecap="round" strokeDasharray={dash || undefined} />
          </svg>
        </div>
      );
    }

    return null;
  };

  // Helpers to export/import
  const exportPages = () => {
    const data = JSON.stringify({ pages, paper }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notebook.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const importFile = (file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed.pages)) {
          setPages(parsed.pages);
          setSelectedPageId(parsed.pages[0].id);
        }
        if (parsed.paper) setPaper(parsed.paper);
      } catch (e) {
        alert("Failed to import file: invalid JSON");
      }
    };
    reader.readAsText(file);
  };

  // Image input change handler for import
  const onImportChange = (e) => {
    const f = e.target.files?.[0];
    if (f) importFile(f);
    e.target.value = "";
  };

  // Page background / grid
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

  const zoomWrapperStyle = { transform: `scale(${zoom})`, transformOrigin: "top left" };

  return (
    <div className="w-full h-full flex bg-stone-100">
      {/* Left pages rail */}
      <aside className="w-48 border-r bg-white p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Pages</h4>
          <div className="flex gap-1">
            <button title="Add page" onClick={addPage} className="btn-soft"><Plus className="w-4 h-4" /></button>
            <button title="Duplicate page" onClick={() => duplicatePage(selectedPageId)} className="btn-soft"><FilePlus className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <ul className="space-y-2">
            {pages.map((p) => (
              <li key={p.id} className={`p-2 border rounded-md flex items-center justify-between ${p.id === selectedPageId ? 'bg-sky-50 border-sky-200' : 'bg-white'}`}>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedPageId(p.id)} className="text-left">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-stone-500">{p.items.length} objects</div>
                  </button>
                </div>
                <div className="flex gap-1">
                  <button title="Rename" onClick={() => { const name = prompt('Page name', p.name); if (name) renamePage(p.id, name); }} className="btn-soft">...</button>
                  <button title="Delete" onClick={() => deletePage(p.id)} className="btn-soft"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2">
          <button onClick={exportPages} className="btn-soft flex-1"><Save className="w-4 h-4" /> Export</button>
          <label className="btn-soft cursor-pointer">
            <input type="file" accept="application/json" onChange={onImportChange} className="hidden" /> Import
          </label>
        </div>

      </aside>

      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-50 flex flex-wrap items-center gap-2 p-2 border-b bg-white">
          <div className="flex items-center gap-2 pr-3 border-r">
            <span className="text-sm text-stone-600">Paper:</span>
            <select className="px-2 py-1 text-sm border rounded-md bg-white" value={paper} onChange={(e) => setPaper(e.target.value)}>
              {Object.entries(PAPER_SIZES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 ml-3">
              <span className="text-sm text-stone-600">Zoom</span>
              <input type="range" min={0.5} max={2} step={0.1} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
              <span className="w-10 text-sm text-right">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          <div className="flex items-center gap-1 pr-3 border-r">
            <ToolbarButton title="Select" onClick={() => setTool(TOOL.SELECT)} active={tool === TOOL.SELECT}><RotateCw className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton title="Text" onClick={() => { setTool(TOOL.TEXT); addText(); }} active={tool === TOOL.TEXT}><Type className="w-4 h-4" /> Add text</ToolbarButton>
            <ToolbarButton title="Image" onClick={() => { setTool(TOOL.IMAGE); onPickImage(); }} active={tool === TOOL.IMAGE}><ImageIcon className="w-4 h-4" /> Add image</ToolbarButton>

            <div className="flex items-center gap-2">
              <ToolbarButton title="Pen" onClick={() => setTool(TOOL.PEN)} active={tool === TOOL.PEN}><PenTool className="w-4 h-4" /> Pen</ToolbarButton>
              <ToolbarButton title="Shape" onClick={() => setTool(TOOL.SHAPE)} active={tool === TOOL.SHAPE}><Square className="w-4 h-4" /> Shape</ToolbarButton>

              <div className="inline-flex items-center gap-1 px-2 py-1 border rounded-md bg-white">
                <button className={`px-1 py-0.5 text-xs ${shapeType === SHAPE.RECT ? 'font-semibold' : ''}`} onClick={() => setShapeType(SHAPE.RECT)} title="Rect">Rect</button>
                <button className={`px-1 py-0.5 text-xs ${shapeType === SHAPE.ELLIPSE ? 'font-semibold' : ''}`} onClick={() => setShapeType(SHAPE.ELLIPSE)} title="Ellipse">Ellipse</button>
                <button className={`px-1 py-0.5 text-xs ${shapeType === SHAPE.LINE ? 'font-semibold' : ''}`} onClick={() => setShapeType(SHAPE.LINE)} title="Line">Line</button>
                <button className={`px-1 py-0.5 text-xs ${shapeType === SHAPE.ARROW ? 'font-semibold' : ''}`} onClick={() => setShapeType(SHAPE.ARROW)} title="Arrow">Arrow</button>
              </div>

              <div className="inline-flex items-center gap-1 px-2 py-1 border rounded-md bg-white">
                <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} title="Stroke color" />
                <input type="number" min={1} max={40} value={strokeWidth} onChange={(e) => setStrokeWidth(parseInt(e.target.value || '3'))} className="w-16" title="Width" />
                <input type="color" value={fillColor === 'transparent' ? '#ffffff' : fillColor} onChange={(e) => setFillColor(e.target.value)} title="Fill color (set white for none)" />
                <input type="number" min={0} max={100} value={strokeDash} onChange={(e) => setStrokeDash(parseInt(e.target.value || '0'))} className="w-16" title="Dash length (0 = solid)" />
                <button onClick={() => addShape(shapeType)} className="btn-soft">Add</button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-3 border-r">
            <ToolbarButton title="Bold" onClick={() => applyCmd('bold')}><Bold className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton title="Italic" onClick={() => applyCmd('italic')}><Italic className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton title="Underline" onClick={() => applyCmd('underline')}><Underline className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton title="Highlight" onClick={() => applyCmd('highlight')}><Highlighter className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton title="Link" onClick={addLink}><LinkIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton title="Clear formatting" onClick={() => applyCmd('removeFormat')}><Eraser className="w-4 h-4" /></ToolbarButton>
          </div>

          <div className="flex items-center gap-1 pr-3 border-r">
            <ToolbarButton title="Duplicate" onClick={duplicateSelected} disabled={!selectedItem}><Copy className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton title="Bring forward" onClick={bringForward} disabled={!selectedItem}><ArrowUp className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton title="Send backward" onClick={sendBackward} disabled={!selectedItem}><ArrowDown className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton title="Delete" onClick={deleteSelected} disabled={!selectedItem}><Trash2 className="w-4 h-4" /></ToolbarButton>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              <span className="inline-flex items-center gap-1"><GridIcon className="w-4 h-4" />Grid</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
              <span className="inline-flex items-center gap-1"><Dot className="w-4 h-4" />Snap</span>
            </label>
            <div className="flex items-center gap-2 text-sm">
              <span>Step</span>
              <input type="number" min={4} max={64} step={2} value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value || '12'))} className="w-16 px-2 py-1 border rounded-md" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={printPage} className="btn-soft"><Printer className="w-4 h-4" /> Print</button>
            <button onClick={exportPages} className="btn-soft"><Save className="w-4 h-4" /> Save</button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-auto p-6">
          <div className="min-h-full w-full flex items-start justify-center">
            <div style={zoomWrapperStyle}>
              <div
                className="paper-shadow rounded-[12px] border border-stone-300 bg-[#fbfbf8] relative paper print:shadow-none"
                ref={paperRef}
                style={{ width: `${size.width}px`, height: `${size.height}px`, ...gridBg }}
                onMouseDown={(e) => { if (e.target === paperRef.current) setSelectedId(null); }}
              >
                {/* Pen overlay canvas (for live drawing) */}
                <canvas
                  ref={penCanvasRef}
                  className="absolute left-0 top-0 w-full h-full"
                  style={{ touchAction: 'none', pointerEvents: tool === TOOL.PEN ? 'auto' : 'none' }}
                  onPointerDown={handlePenPointerDown}
                  onPointerMove={handlePenPointerMove}
                  onPointerUp={handlePenPointerUp}
                />

                {items
                  .slice()
                  .sort((a, b) => a.z - b.z)
                  .map((item) => (
                    <Rnd
                      key={item.id}
                      bounds="parent"
                      size={{ width: item.w, height: item.h }}
                      position={{ x: item.x, y: item.y }}
                      onDragStop={(_, d) => updateItem(item.id, { x: snap(d.x), y: snap(d.y) })}
                      onResizeStop={(_, __, ref, ___, pos) => updateItem(item.id, { w: snap(ref.offsetWidth), h: snap(ref.offsetHeight), x: snap(pos.x), y: snap(pos.y) })}
                      style={{ zIndex: item.z }}
                      enableResizing
                      cancel={".no-drag, input, textarea, [contenteditable='true'], .rotate-handle"}
                      dragHandleClassName="drag-handle"
                      className={`absolute group ${selectedId === item.id ? 'ring-2 ring-sky-400' : ''}`}
                      onMouseDown={() => setSelectedId(item.id)}
                    >
                      <div className="w-full h-full relative bg-transparent">

                        {/* Top bar: drag handle and rotation/other quick actions */}
                        <div className="absolute top-1 left-1 right-1 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition pointer-events-auto z-10">
                          <div className="drag-handle cursor-grab bg-white/90 px-2 py-0.5 rounded-md text-xs border border-stone-200 flex items-center gap-1">⇅</div>
                          <div className="flex gap-1 items-center">
                            <button className="text-xs px-1 py-0.5 bg-white/90 border rounded-md" onClick={() => updateItem(item.id, { z: nextZ(items) })}>Top</button>
                          </div>
                        </div>

                        {/* Rotation handle */}
                        <div
                          onPointerDown={(e) => startRotate(e, item)}
                          className="rotate-handle absolute left-1/2 -top-4 -translate-x-1/2 w-6 h-6 bg-white border rounded-full flex items-center justify-center text-xs shadow cursor-pointer z-20"
                          title="Rotate"
                        >
                          ⤾
                        </div>

                        {/* Item content */}
                        {item.type === 'text' ? (
                          <div className="w-full h-full flex flex-col relative">
                            <div className="drag-handle absolute -top-2 left-2 w-6 h-6 rounded-md opacity-0 group-hover:opacity-100" />
                            <div
                              data-editor="true"
                              data-placeholder="Type here…"
                              ref={setEditorRef(item.id)}
                              contentEditable
                              suppressContentEditableWarning
                              onInput={(e) => onTextInput(item.id, e)}
                              className="no-drag flex-1 outline-none p-3 text-[15px] leading-6 selection:bg-yellow-200/60 max-w-none overflow-auto"
                              onFocus={() => setSelectedId(item.id)}
                              style={{ background: 'transparent', transform: `rotate(${item.rotation || 0}deg)`, transformOrigin: 'center' }}
                            />
                          </div>
                        ) : item.type === 'image' ? (
                          <div className="w-full h-full overflow-hidden rounded-md bg-white shadow-sm relative" style={{ transform: `rotate(${item.rotation || 0}deg)`, transformOrigin: 'center' }}>
                            <div className="cursor-grab bg-stone-50 border-b border-stone-200 px-2 py-1 text-xs text-stone-500">
                              <span className="opacity-0 group-hover:opacity-80 transition">Image</span>
                            </div>
                            <img src={item.src} alt={item.alt || 'image'} className="w-full h-full object-contain bg-white" draggable={false} />
                          </div>
                        ) : item.type === 'shape' ? (
                          <div className="w-full h-full rounded-md overflow-hidden bg-transparent" style={{ touchAction: 'none' }}>
                            {renderShapeSVG(item)}
                          </div>
                        ) : null}

                        <div className="absolute inset-0 pointer-events-none rounded-md border border-transparent group-hover:border-sky-300" />
                      </div>
                    </Rnd>
                  ))}

              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Right properties rail */}
      <aside className="w-64 border-l bg-white p-3">
        <h4 className="text-sm font-medium mb-2">Properties</h4>
        {selectedItem ? (
          <div className="space-y-2">
            <div className="text-xs text-stone-500">Type</div>
            <div className="font-medium">{selectedItem.type}{selectedItem.shapeType ? ` • ${selectedItem.shapeType}` : ''}</div>

            {selectedItem.type === 'shape' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs">Stroke color</label>
                <input type="color" value={selectedItem.stroke || '#111827'} onChange={(e) => updateItem(selectedItem.id, { stroke: e.target.value })} />
                <label className="block text-xs">Fill color</label>
                <input type="color" value={selectedItem.fill === 'transparent' ? '#ffffff' : selectedItem.fill} onChange={(e) => updateItem(selectedItem.id, { fill: e.target.value })} />
                <label className="block text-xs">Stroke width</label>
                <input type="number" min={1} max={40} value={selectedItem.strokeWidth || 2} onChange={(e) => updateItem(selectedItem.id, { strokeWidth: parseInt(e.target.value || '2') })} className="w-20" />
                <label className="block text-xs">Dash length (0 = solid)</label>
                <input type="number" min={0} max={100} value={selectedItem.strokeDash || 0} onChange={(e) => updateItem(selectedItem.id, { strokeDash: parseInt(e.target.value || '0') })} className="w-20" />
                <label className="block text-xs">Rotation (deg)</label>
                <input type="number" min={-360} max={360} value={selectedItem.rotation || 0} onChange={(e) => updateItem(selectedItem.id, { rotation: parseInt(e.target.value || '0') })} className="w-28" />
                <div className="flex gap-2 pt-2">
                  <button onClick={() => updateItem(selectedItem.id, { rotation: (selectedItem.rotation || 0) - 15 })} className="btn-soft">-15°</button>
                  <button onClick={() => updateItem(selectedItem.id, { rotation: (selectedItem.rotation || 0) + 15 })} className="btn-soft">+15°</button>
                </div>
              </div>
            )}

            {selectedItem.type === 'text' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs">Rotation (deg)</label>
                <input type="number" min={-360} max={360} value={selectedItem.rotation || 0} onChange={(e) => updateItem(selectedItem.id, { rotation: parseInt(e.target.value || '0') })} className="w-28" />
              </div>
            )}

            {selectedItem.type === 'image' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs">Rotation (deg)</label>
                <input type="number" min={-360} max={360} value={selectedItem.rotation || 0} onChange={(e) => updateItem(selectedItem.id, { rotation: parseInt(e.target.value || '0') })} className="w-28" />
              </div>
            )}

            <div className="pt-4 flex gap-2">
              <button onClick={() => duplicateSelected()} className="btn-soft flex-1">Duplicate</button>
              <button onClick={() => deleteSelected()} className="btn-soft flex-1">Delete</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-stone-500">Select an item to edit its properties.</div>
        )}

      </aside>

      <style>{`
        .paper-shadow { box-shadow: 0 10px 30px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.06); }
        .btn-soft { @apply inline-flex items-center gap-1 px-3 py-1.5 rounded-md border bg-white hover:bg-stone-50 active:scale-[0.99] text-sm; }
        .paper { position: relative; }
        [data-placeholder]:empty:before { content: attr(data-placeholder); color: #9ca3af; display: block; pointer-events: none; }
        [data-placeholder] { min-height: 1.2em; }
        .no-drag::selection { background: rgba(255, 235, 59, 0.4); }
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .paper { transform: none !important; }
          body, .paper, .paper * { zoom: 1 !important; }
          .drag-handle, .btn-soft, .border-b, .sticky { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function nextZ(items) {
  return (items && items.length ? Math.max(...items.map((i) => i.z)) : 0) + 1;
}
