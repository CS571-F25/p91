import ColorSwatch from "./ColorSwatch";

export default function HomeworkItem({ homework, onDelete, onEdit, onColorChange, dueText }) {
  return (
    <div className="p-3 border rounded d-flex justify-content-between align-items-center mt-2 shadow-sm bg-white">
      <div style={{ flex: 1 }}>
        <div className="d-flex align-items-center gap-2">
          <ColorSwatch color={homework.color} />
          <strong>{homework.name}</strong>
        </div>
        <div className="text-muted">
          {homework.hours}h total — {homework.blockSize}h blocks
        </div>
        <div className="text-muted small">Due {dueText}</div>
        <div className="d-flex align-items-center gap-2 mt-2">
          <ColorSwatch color={homework.color} />
          <div style={{ position: "relative", width: "34px", height: "26px" }}>
            <button
              type="button"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "6px",
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer",
                padding: 0
              }}
              aria-label={`Change color for ${homework.name}`}
            >
              🎨
            </button>
            <input
              type="color"
              value={homework.color || "#0d6efd"}
              onChange={(e) => onColorChange?.(e.target.value)}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: "pointer"
              }}
              aria-label={`Custom color for ${homework.name}`}
            />
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-sm btn-outline-secondary" onClick={onEdit}>
          ✏️ Edit
        </button>
        <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
          🗑️
        </button>
      </div>
    </div>
  );
}
