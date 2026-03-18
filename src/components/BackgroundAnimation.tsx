import "./BackgroundAnimation.css";

export function BackgroundAnimation() {
  return (
    <div className="bg-root" aria-hidden="true">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      <div className="bg-blob bg-blob-4" />
    </div>
  );
}
