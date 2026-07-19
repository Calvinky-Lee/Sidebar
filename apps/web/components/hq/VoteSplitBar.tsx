import type { VoteSplit } from "@council/contract";
import { HUES } from "@/lib/blobs";
import type { MemberView } from "@/lib/session-store";

interface VoteSplitBarProps {
  voteSplit: VoteSplit;
  members: Record<string, MemberView>;
}

/** Plain-SVG-free segmented bar (a styled div works fine here) in member hues. */
export function VoteSplitBar({ voteSplit, members }: VoteSplitBarProps) {
  const groups: { label: string; ids: string[] }[] = [
    { label: "for", ids: voteSplit.for },
    { label: "against", ids: voteSplit.against },
    { label: "abstain", ids: voteSplit.abstain },
  ];
  const total = voteSplit.for.length + voteSplit.against.length + voteSplit.abstain.length || 1;

  return (
    <div className="w-full max-w-md">
      <div className="flex h-6 w-full overflow-hidden rounded-full border-2 border-ink">
        {groups.flatMap((g) =>
          g.ids.map((id) => (
            <div
              key={id}
              className="h-full"
              style={{ width: `${100 / total}%`, background: HUES[members[id]?.hue ?? "slate"] }}
              title={`${members[id]?.member.name ?? id} — ${g.label}`}
            />
          )),
        )}
      </div>
      <div className="mt-1 flex justify-between font-sans text-[10px] text-ink-soft">
        <span>{voteSplit.for.length} for</span>
        <span>{voteSplit.against.length} against</span>
        <span>{voteSplit.abstain.length} abstain</span>
      </div>
    </div>
  );
}
