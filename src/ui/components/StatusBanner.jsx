export default function StatusBanner({ status, message }) {
  if (!status && !message) return null;
  return (
    <div className="mx-4 mt-2 text-sm border rounded-lg px-3 py-2 bg-[rgba(0,240,255,0.05)] border-cyber-blue/50 text-cyber-blue">
      {message || status}
    </div>
  );
}
