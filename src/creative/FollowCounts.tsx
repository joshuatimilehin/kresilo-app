import { useEffect, useState } from "react";
import { UserCheck, UsersThree } from "@phosphor-icons/react";
import { useFollowing } from "./useFollows";
import "./follows.css";

export type Counts = { followers: number; following: number };

/** How many follow a person or roster maker, and how many that person follows. Read again whenever the viewer follows or unfollows them. */
export function useFollowCounts(target: string): Counts | null {
  const on = useFollowing().has(target);
  const [counts, setCounts] = useState<Counts | null>(null);
  useEffect(() => {
    let live = true;
    void fetch(`/api/follows/${target.toLowerCase()}`)
      .then((r) => r.json())
      .then((r) => live && r.ok && setCounts({ followers: r.followers, following: r.following }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [target, on]);
  return counts;
}

/** Two icons with numbers. A roster maker has no account, so only a person shows who they follow. */
export function FollowCounts({ counts, showFollowing }: { counts: Counts | null; showFollowing: boolean }) {
  if (!counts) return null;
  return (
    <ul className="follow-counts">
      <li title={`${counts.followers} followers`} aria-label={`${counts.followers} followers`}>
        <UsersThree size={18} aria-hidden="true" />
        <b>{counts.followers}</b>
      </li>
      {showFollowing && (
        <li title={`${counts.following} following`} aria-label={`${counts.following} following`}>
          <UserCheck size={18} aria-hidden="true" />
          <b>{counts.following}</b>
        </li>
      )}
    </ul>
  );
}
