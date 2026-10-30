import { DeviceMobile, FilmStrip, PenNib, Stamp } from "@phosphor-icons/react";
import { specialists, type SpecialistId } from "./specialists";
import { useT } from "./locale";

const icons = { DeviceMobile, Stamp, PenNib, FilmStrip };

/**
 * The assistant's designers, as four icons and the working designer's name:
 * the one fixed place the choice is shown. The filled icon is the designer who
 * will answer; a ring marks a pick made by hand, and tapping the picked one
 * again hands the choice back to Auto (the brief and the request decide).
 */
export function DesignerRow({
  chosen,
  picked,
  disabled,
  onPick,
}: {
  chosen: SpecialistId;
  picked: SpecialistId | null;
  disabled?: boolean;
  onPick: (id: SpecialistId | null) => void;
}) {
  const { t } = useT();
  return (
    <div className="sx-designers" role="group" aria-label={t("designer.group")}>
      {specialists.map((s) => {
        const Icon = icons[s.icon];
        const on = s.id === chosen;
        return (
          <button
            key={s.id}
            type="button"
            title={t(`designer.${s.id}` as const)}
            aria-label={t(`designer.${s.id}` as const)}
            aria-pressed={on}
            data-picked={s.id === picked}
            disabled={disabled}
            onClick={() => onPick(s.id === picked ? null : s.id)}
          >
            <Icon size={22} weight={on ? "fill" : "regular"} />
          </button>
        );
      })}
      <b className="sx-designer-name" data-designer={chosen}>
        {t(`designer.${chosen}` as const)}
      </b>
    </div>
  );
}
