export default function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 opacity-40 mix-blend-screen scanlines" />
      <div className="absolute inset-0 neural-particles" />
    </div>
  );
}
