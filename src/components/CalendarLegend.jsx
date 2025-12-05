import ColorSwatch from "./ColorSwatch";

export default function CalendarLegend({
  direction = "column",
  className = "",
  hideLabel = false
}) {
  const isRow = direction === "row";
  return (
    <div className={className}>
      <div
        className={`d-flex small align-items-center ${
          isRow ? "flex-row flex-wrap gap-3" : "flex-column gap-2"
        }`}
      >
        {!hideLabel && <h6 className="text-muted mb-0 me-3">Legend</h6>}
        <div className="d-flex align-items-center gap-2">
          <ColorSwatch color="#0d6efd" />
          <span>Study blocks</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ColorSwatch color="#6c757d" />
          <span>Commitments</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ColorSwatch color="rgba(220, 53, 69, 0.5)" />
          <span>After deadline (shaded)</span>
        </div>
      </div>
    </div>
  );
}
