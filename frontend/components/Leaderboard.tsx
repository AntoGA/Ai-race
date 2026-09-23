"use client";

import { useEffect, useState } from "react";
import { getLeaderboard } from "@/lib/api";

export default function Leaderboard() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    let stop = false;
    const load = () =>
      getLeaderboard()
        .then((d) => !stop && setRows(d))
        .catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.pilot_id} className="flex items-center justify-between py-2">
          <span className="flex items-center gap-2">
            <span className="w-6 text-center font-bold text-accent">{r.position}</span>
            <span>{r.name}</span>
          </span>
          <span className="text-sm text-slate-400">{r.points} очк.</span>
        </li>
      ))}
    </ul>
  );
}
