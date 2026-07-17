import { Package, AlertTriangle, Plus, Truck as TruckIcon } from "lucide-react";
import { useStore } from "../../lib/store";
import { money, num } from "../../lib/format";

export default function Materials() {
  const { db, updateMaterial } = useStore();
  const { materials } = db;

  const low = materials.filter((m) => m.onHand <= m.reorderAt);
  const inventoryValue = materials.reduce((s, m) => s + m.onHand * m.unitCost, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="SKUs" value={materials.length} />
        <MiniStat label="Inventory value" value={money(inventoryValue)} small />
        <MiniStat label="Reorder now" value={low.length} accent={low.length ? "#ef4d4d" : "#4ec27a"} />
      </div>

      {low.length > 0 && (
        <div className="card p-3 border-safety/40 bg-safety/5 flex items-center gap-2">
          <AlertTriangle size={16} className="text-safety shrink-0" />
          <span className="text-sm text-cream">
            {low.length} material{low.length > 1 ? "s" : ""} at or below reorder point — {low.map((m) => m.name).join(", ")}.
          </span>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2.5 border-b border-hairline data text-[10px] uppercase tracking-wider text-steel">
          <span>Material</span><span>On hand</span><span>Reorder at</span><span>Value</span><span></span>
        </div>
        <div className="divide-y divide-[#242428]">
          {materials.map((m) => {
            const low = m.onHand <= m.reorderAt;
            const pct = Math.min(100, (m.onHand / (m.reorderAt * 2)) * 100);
            return (
              <div key={m.id} className="grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 md:gap-3 px-4 py-3 items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Package size={15} className={low ? "text-safety" : "text-steel"} />
                    <span className="text-sm text-cream font-medium">{m.name}</span>
                  </div>
                  <div className="data text-[10px] text-steel mt-0.5 ml-6">{m.supplier} · {money(m.unitCost, true)}/{m.unit}</div>
                </div>
                <div>
                  <div className="data text-sm" style={{ color: low ? "#f25c05" : "#f6f4ef" }}>{num(m.onHand)} <span className="text-steel text-[11px]">{m.unit}</span></div>
                  <div className="h-1 w-20 rounded-full bg-asphalt overflow-hidden border border-hairline mt-1">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: low ? "#f25c05" : "#4ec27a" }} />
                  </div>
                </div>
                <div className="data text-sm text-steel">{num(m.reorderAt)} {m.unit}</div>
                <div className="data text-sm text-cream">{money(m.onHand * m.unitCost)}</div>
                <div className="md:text-right">
                  {low ? (
                    <button
                      onClick={() => updateMaterial(m.id, { onHand: m.reorderAt * 2 })}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      <TruckIcon size={12} /> Reorder
                    </button>
                  ) : (
                    <span className="chip" style={{ color: "#4ec27a", background: "rgba(78,194,122,0.14)", borderColor: "#4ec27a55" }}>Stocked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent = "#f2b705", small }: { label: string; value: React.ReactNode; accent?: string; small?: boolean }) {
  return (
    <div className="card p-3.5 relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} />
      <div className="data text-[10px] uppercase tracking-wider text-steel">{label}</div>
      <div className={`display text-cream mt-1 ${small ? "text-lg" : "text-2xl"}`}>{value}</div>
    </div>
  );
}
