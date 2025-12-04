import ColorSwatch from "./ColorSwatch";

export default function CalendarLegend() {
  return (
    <div className="mt-4">
      <h6 className="text-muted">Legend</h6>
      <div className="d-flex flex-column gap-2 small">
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
