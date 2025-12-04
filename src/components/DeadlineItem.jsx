export default function DeadlineItem({ name, hours, deadlineText, daysLeft }) {
  return (
    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-2">
      <div>
        <p className="fw-bold mb-1">{name}</p>
        <p className="text-muted mb-0 small">
          {hours} hours • Due: {deadlineText}
        </p>
      </div>
      <span className="badge bg-primary">{daysLeft} days left</span>
    </div>
  );
}
