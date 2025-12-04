export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4">
      <div>
        <h1 className="mb-1">{title}</h1>
        {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
      </div>
      {actions && <div className="mt-3 mt-md-0 d-flex align-items-center gap-2">{actions}</div>}
    </div>
  );
}
