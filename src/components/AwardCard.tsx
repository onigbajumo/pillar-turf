import type { AwardT, Slot, TeamT } from "@/lib/league";
import { Crest } from "./Crest";
import { Media } from "./Media";

export type AutoWinner = { winner: string; team: string; label: string } | null;

/** Public display of one award. Shows the live leader (auto) when no winner has been announced. */
export function AwardCard({ slot, award, auto, teams, children }: {
  slot: Slot; award?: AwardT; auto?: AutoWinner; teams: Map<string, TeamT>; children?: React.ReactNode;
}) {
  const title = award?.title || slot.title;
  const announced = award ? (slot.teamOnly ? award.team : award.winner) : null;
  const show = announced
    ? { winner: slot.teamOnly ? teams.get(award!.team!)?.name ?? "" : award!.winner, team: award!.team, label: "" }
    : auto ?? null;
  const team = show?.team ? teams.get(show.team) : undefined;

  return (
    <article className={`board award flex flex-col ${show ? "" : "tba"}`}>
      {award?.media && <div className="photo wide"><Media media={award.media} alt={title} /></div>}
      <div className="grid flex-1 content-start gap-1.5 p-3.5">
        <div className="atitle">{title}</div>
        <div className="awinner">{show ? show.winner : "To be announced"}</div>
        {team && (
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Crest team={team} size="sm" />
            {slot.teamOnly ? (show?.label ? "" : "Winners") : team.name}
          </div>
        )}
        {show?.label && <p className="hint">{show.label}</p>}
        {award?.note && <p className="hint">{award.note}</p>}
        {children}
      </div>
    </article>
  );
}
