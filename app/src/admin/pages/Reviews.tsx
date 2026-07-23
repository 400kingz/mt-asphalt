import { useState } from "react";
import { Star, Plus, Eye, EyeOff, Trash2, X, Quote } from "lucide-react";
import { useStore } from "../../lib/store";
import { Stars } from "../../components/ui";
import { uid } from "../../lib/format";
import type { Testimonial } from "../../lib/types";

const PLATFORMS = [
  { name: "Google", rating: 4.9, count: 142, color: "#f2b705" },
  { name: "Yelp", rating: 4.8, count: 73, color: "#f25c05" },
  { name: "Combined", rating: 4.9, count: 215, color: "#4ec27a" },
];

export default function Reviews() {
  const { db, updateTestimonial, addTestimonial, removeTestimonial } = useStore();
  const [adding, setAdding] = useState(false);
  const active = db.testimonials.filter((t) => t.active).length;

  return (
    <div className="space-y-5">
      {/* Aggregate hero */}
      <div className="card asphalt-grain p-4 sm:p-6 relative overflow-hidden">
        <div className="hazard absolute top-0 inset-x-0 h-1.5" />
        <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
          <div className="text-center md:border-r border-hairline md:pr-6">
            <div className="display text-6xl text-highway">{db.settings.ratingAverage}</div>
            <Stars value={db.settings.ratingAverage} size={18} />
            <div className="data text-[11px] text-steel mt-1">{db.settings.reviewCount}+ reviews</div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {PLATFORMS.map((p) => (
              <div key={p.name} className="card bg-surface-2 p-3 text-center">
                <div className="data text-[11px] sm:text-[10px] text-steel uppercase">{p.name}</div>
                <div className="display text-2xl mt-1" style={{ color: p.color }}>{p.rating}</div>
                <div className="data text-[11px] sm:text-[10px] text-steel-dim">{p.count} reviews</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="display text-lg text-cream">Featured testimonials</h3>
          <p className="data text-[11px] text-steel">{active} showing on the public website</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary text-sm"><Plus size={15} /> Add review</button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {db.testimonials.map((t) => (
          <div key={t.id} className={`card p-4 ${t.active ? "" : "opacity-50"}`}>
            <div className="flex items-start justify-between">
              <Stars value={t.rating} size={14} />
              <div className="flex items-center gap-2 md:gap-1">
                <button onClick={() => updateTestimonial(t.id, { active: !t.active })} className="grid h-11 w-11 md:h-7 md:w-7 place-items-center rounded-lg card card-hover" title={t.active ? "Hide from site" : "Show on site"} aria-label={t.active ? "Hide from site" : "Show on site"}>
                  {t.active ? <Eye size={13} className="text-ok" /> : <EyeOff size={13} className="text-steel" />}
                </button>
                <button onClick={() => removeTestimonial(t.id)} className="grid h-11 w-11 md:h-7 md:w-7 place-items-center rounded-lg card card-hover" title="Delete" aria-label="Delete">
                  <Trash2 size={13} className="text-steel hover:text-danger" />
                </button>
              </div>
            </div>
            <Quote size={18} className="text-highway/30 mt-2" />
            <p className="text-sm text-cream mt-1 leading-relaxed">{t.quote}</p>
            <div className="mt-3 pt-3 border-t border-hairline data text-[11px] text-steel">
              <span className="text-cream font-bold">{t.author}</span> · {t.location} · {t.projectType}
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <AddReview
          onClose={() => setAdding(false)}
          onSave={(t) => {
            addTestimonial(t);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function AddReview({ onClose, onSave }: { onClose: () => void; onSave: (t: Testimonial) => void }) {
  const [f, setF] = useState({ quote: "", author: "", location: "", projectType: "", rating: 5 });
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 fadein" />
      <div className="relative card w-full max-w-md p-5 rise max-h-[85dvh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="display text-lg text-cream">Add a review</h3>
          <button onClick={onClose} className="grid h-11 w-11 sm:h-8 sm:w-8 place-items-center rounded-lg card"><X size={15} /></button>
        </div>
        <div className="space-y-3">
          <L label="Quote"><textarea className="input min-h-[80px] resize-y" value={f.quote} onChange={(e) => setF({ ...f, quote: e.target.value })} placeholder="What did the customer say?" /></L>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <L label="Author"><input className="input" value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} placeholder="Robert M." /></L>
            <L label="Location"><input className="input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Anaheim, CA" /></L>
          </div>
          <L label="Project type"><input className="input" value={f.projectType} onChange={(e) => setF({ ...f, projectType: e.target.value })} placeholder="Residential Paving" /></L>
          <L label="Rating">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className="grid h-11 w-11 place-items-center -m-1" onClick={() => setF({ ...f, rating: n })}>
                  <Star size={22} className={n <= f.rating ? "text-highway" : "text-surface-3"} fill={n <= f.rating ? "#f2b705" : "none"} />
                </button>
              ))}
            </div>
          </L>
        </div>
        <button
          onClick={() => onSave({ id: uid("t"), ...f, active: true })}
          className="btn-primary w-full mt-4 text-sm"
          disabled={!f.quote || !f.author}
        >
          Save review
        </button>
      </div>
    </div>
  );
}
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
