export default function CommitmentItem({ group, onDelete, getDayColor, getDayAbbr }) {
  return (
    <div
      className="p-3 border rounded mt-2 shadow-sm bg-white"
      style={{ borderLeft: `4px solid ${getDayColor(group.days[0])}` }}
    >
      <div className="d-flex justify-content-between">
        <div>
          <strong>
            {group.startTime} - {group.endTime}
          </strong>
          <div className="text-muted small">{group.description}</div>

          <div className="mt-1">
            {group.days.map((day, i) => (
              <span key={i} className="badge me-1" style={{ backgroundColor: getDayColor(day) }}>
                {getDayAbbr(day)}
              </span>
            ))}
          </div>
        </div>

        <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
          🗑️
        </button>
      </div>
    </div>
  );
}
