import { Layers2 } from 'lucide-react';
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <Layers2 size={22} strokeWidth={2} />
      </span>
      <span>
        folio<span className="brand-dot">.</span>
      </span>
    </div>
  );
}
