export default function ColorSwatch({ color }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "18px",
        height: "18px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        backgroundColor: color || "#0d6efd"
      }}
      aria-label="Color swatch"
    />
  );
}
