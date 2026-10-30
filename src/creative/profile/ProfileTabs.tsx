import { useRef, type ReactNode } from "react";
import {
  PROFILE_TABS,
  TAB_LABELS,
  nextTab,
  panelId,
  tabId,
  type ProfileTab,
  type TabCounts,
} from "../profile";

/**
 * The Posts | Stories | Shorts switch. A real tablist: only the selected tab is
 * in the tab order, arrow keys / Home / End move between tabs (automatic
 * activation), and each tab controls its own tabpanel.
 */
export function ProfileTabs({
  active,
  counts,
  onChange,
}: {
  active: ProfileTab;
  counts: TabCounts;
  onChange: (tab: ProfileTab) => void;
}) {
  const refs = useRef<Partial<Record<ProfileTab, HTMLButtonElement | null>>>({});
  // Empty tabs are left out, except the one that is open.
  const shown = PROFILE_TABS.filter((tab) => counts[tab] > 0 || tab === active);
  return (
    <div className="maker-tablist" role="tablist" aria-label="Maker content">
      {shown.map((tab) => (
        <button
          key={tab}
          ref={(el) => {
            refs.current[tab] = el;
          }}
          id={tabId(tab)}
          type="button"
          role="tab"
          aria-selected={active === tab}
          aria-controls={panelId(tab)}
          tabIndex={active === tab ? 0 : -1}
          className="maker-tab"
          onClick={() => onChange(tab)}
          onKeyDown={(event) => {
            const next = nextTab(tab, event.key, shown);
            if (!next) return;
            event.preventDefault();
            onChange(next);
            refs.current[next]?.focus();
          }}
        >
          {TAB_LABELS[tab]}
          <span className="maker-tab-count">{counts[tab]}</span>
        </button>
      ))}
    </div>
  );
}

/** One tabpanel per tab. Inactive panels stay in the DOM, hidden and empty. */
export function ProfilePanel({
  tab,
  active,
  children,
}: {
  tab: ProfileTab;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={panelId(tab)}
      role="tabpanel"
      aria-labelledby={tabId(tab)}
      hidden={!active}
      tabIndex={0}
      className="maker-panel"
    >
      {active ? children : null}
    </div>
  );
}
