import { getRace, getRaceParticipants, hlsUrl } from "@/lib/api";
import VideoPlayer from "@/components/VideoPlayer";
import Chat from "@/components/Chat";
import { notFound } from "next/navigation";

export default async function RacePage({ params }: { params: { id: string } }) {
  let race, participants;
  try {
    race = await getRace(params.id);
    participants = await getRaceParticipants(params.id);
  } catch {
    notFound();
  }

  return (
    <main className="max-w-6xl mx-auto p-4">
      <h1 className="text-xl font-black mb-4">{race.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {race.status === "live" ? (
            <VideoPlayer src={hlsUrl(race.stream_key)} />
          ) : (
            <div className="aspect-video bg-surface rounded-xl flex items-center justify-center text-slate-400">
              {race.status === "scheduled" ? "Гонка ещё не началась" : "Трансляция завершена"}
            </div>
          )}

          <div className="mt-4 bg-surface rounded-xl p-4 border border-border">
            <h2 className="font-bold mb-2">Лидерборд гонки</h2>
            <ul className="divide-y divide-border">
              {participants.map((p) => (
                <li key={p.id} className="flex justify-between py-2 text-sm">
                  <span>{p.name}</span>
                  <span className="text-slate-400">
                    {p.finish_position ? `Поз. ${p.finish_position}` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h2 className="font-bold mb-2">Чат</h2>
          <Chat raceId={race.id} />
          <div className="mt-4 text-xs text-slate-400">
            <p>Трасса: {race.track || "—"}</p>
            <p>Условия: {race.conditions || "—"}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
