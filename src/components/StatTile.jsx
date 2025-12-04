import Card from "./Card";

export default function StatTile({ label, value, icon, variant = "primary" }) {
  return (
    <Card>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <p className="text-muted mb-1">{label}</p>
          <h2 className={`text-${variant} mb-0`}>{value}</h2>
        </div>
        <span style={{ fontSize: "3rem", opacity: 0.2 }}>{icon}</span>
      </div>
    </Card>
  );
}
