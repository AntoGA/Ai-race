import { getPilot, getPilotRaces } from "@/lib/api";
import { notFound } from "next/navigation";

export default async function PilotPage({ params }: { params: { id: string } }) {
  let pilot, races;
  try {
    pilot = await getPilot(params.id);
    races = await getPilotRaces(params.id);
  } catch {
    notFound();
  }

  const fmtLap = (ms?: number | null) =>
    ms ? `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(3)}` : "—";

  return (
    <main className="max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface rounded-xl p-6 border border-border">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-3xl mb-4">
            {pilot.name[0]?.toUpperCase()}
          </div>
          <h1 className="text-2xl font-black">{pilot.name}</h1>
          <p className="text-accent">{pilot.version}</p>
          <div className="mt-3 text-sm text-slate-400">
            <p>Команда: {pilot.team || "—"}</p>
            <p>Модель: {pilot.model_type || "—"}</p>
          </div>
          <p className="mt-3 text-sm">{pilot.description}</p>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              ["Победы", pilot.wins ?? 0],
              ["Подиумы", pilot.podiums ?? 0],
              ["Лучший круг", fmtLap(pilot.best_lap_ms)],
              ["Очки", pilot.points ?? 0],
            ].map(([label, val]) => (
              <div key={label} className="bg-surface rounded-xl p-4 border border-border">
                <p className="text-xs text-slate-400 uppercase">{label}</p>
                <p className="text-2xl font-bold text-accent">{val}</p>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-bold mb-3">История заездов</h2>
          <ul className="space-y-2">
            {races.map((r) => (
              <li key={r.id} className="flex items-center justify-between bg-surface p-3 rounded-lg border border-border text-sm">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.track}</p>
                </div>
                <span className="text-slate-400">
                  {r.finish_position ? `Поз. ${r.finish_position}` : r.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
