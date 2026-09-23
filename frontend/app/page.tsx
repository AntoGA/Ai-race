import Link from "next/link";
import { getRaces, getPilots } from "@/lib/api";
import Leaderboard from "@/components/Leaderboard";

export default async function Home() {
  const [races, pilots] = await Promise.all([getRaces(), getPilots()]);
  const live = races.filter((r) => r.status === "live");
  const upcoming = races.filter((r) => r.status === "scheduled");

  return (
    <main className="max-w-6xl mx-auto p-4">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-black tracking-tight">
          🏁 ВИРТУАЛЬНЫЕ <span className="text-accent">ГОНКИ</span>
        </h1>
      </header>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">Сейчас в эфире</h2>
        {live.length === 0 ? (
          <p className="text-slate-400">Нет активных трансляций</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {live.map((r) => (
              <Link key={r.id} href={`/race/${r.id}`}
                className="block bg-surface rounded-xl overflow-hidden border border-border hover:border-accent transition">
                <div className="aspect-video bg-black relative">
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                    LIVE
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.track}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <h2 className="text-lg font-bold mb-3">Расписание</h2>
          <ul className="space-y-2">
            {upcoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between bg-surface p-3 rounded-lg border border-border">
                <div>
                  <p className="font-semibold text-sm">{r.title}</p>
                  <p className="text-xs text-slate-400">
                    {r.scheduled_at ? new Date(r.scheduled_at).toLocaleString("ru-RU") : "TBD"}
                  </p>
                </div>
                <Link href={`/race/${r.id}`} className="text-accent text-sm">Подробнее</Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">Лидерборд</h2>
          <div className="bg-surface rounded-xl p-3 border border-border">
            <Leaderboard />
          </div>
        </section>
      </div>
    </main>
  );
}
