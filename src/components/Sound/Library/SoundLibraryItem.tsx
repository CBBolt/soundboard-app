import Marquee from "../../Marquee/Marquee";
import HotkeyComponent from "../../Hotkey/HotkeyComponent";
import TagComponent from "../../Tag/TagComponent";

import { Icon } from "@iconify/react";
import MusicNoteIcon from "../../../icons/MusicNoteIcon";
import PencilIcon from "../../../icons/PencilIcon";
import TrashIcon from "../../../icons/TrashIcon";
import TriangeIcon from "../../../icons/TriangleIcon";

type ItemProps = {
  sound: Sound;
  full?: boolean;
  playSound?: (sound: Sound) => void;
  onEdit?: (sound: Sound) => void;
  onDelete?: (id: number) => void;
  onClick?: (sound: Sound) => void;
};

const MAX_TAGS = 3;

export default function SoundLibraryItem({
  sound,
  full = true,
  playSound,
  onEdit,
  onDelete,
  onClick,
}: ItemProps) {
  return (
    <div
      className="grid-gap grey"
      style={{
        width: "calc(100% - 10px)",
        textAlign: "center",
        gridTemplateColumns: "0.1fr 1fr 1fr 1fr 0.5fr",
        borderRadius: 5,
        padding: 5,
        cursor: !full ? "pointer" : "",
      }}
      onClick={() => onClick?.(sound)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.2)",
          borderRadius: "100%",
          aspectRatio: 1,
          padding: 2,
        }}
      >
        {sound.icon ? (
          <Icon
            icon={sound.icon}
            className="icon"
            style={{ color: sound.color }}
          />
        ) : (
          <MusicNoteIcon className="icon fill" style={{ fill: sound.color }} />
        )}
      </div>
      <Marquee text={sound.name} />
      {sound.hotkey ? (
        <HotkeyComponent hotkey={sound.hotkey} />
      ) : (
        <span>No Hotkey</span>
      )}
      {sound.tags ? (
        <div
          className="grid-gap grey"
          style={{
            gap: 2,
            gridTemplateColumns: "repeat(auto-fit, minmax(40px, 1fr))",
            padding: "0 10px",
            borderRadius: 5,
          }}
        >
          {sound.tags.slice(0, MAX_TAGS).map((t) => (
            <TagComponent key={t.id} tag={t} mini={true} editable={false} />
          ))}
          {sound.tags.length > MAX_TAGS && (
            <span>{`+${sound.tags.length - MAX_TAGS}..`}</span>
          )}
        </div>
      ) : (
        <div />
      )}
      {full && (
        <div className="flex-gap">
          <button onClick={() => playSound?.(sound)}>
            <TriangeIcon className="icon fill sml" />
          </button>
          <button onClick={() => onEdit?.(sound)}>
            <PencilIcon className="icon fill sml" />
          </button>
          <button onClick={() => onDelete?.(sound.id)}>
            <TrashIcon className="icon stroke sml" />
          </button>
        </div>
      )}
    </div>
  );
}
