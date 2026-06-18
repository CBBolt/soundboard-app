import { useState } from "react";
import SoundLibraryItem from "./SoundLibraryItem";
import HoverDropdown from "../HoverDropdown";
import TriangeIcon from "../../icons/TriangleIcon";
import PlusIcon from "../../icons/PlusIcon";
import FolderIcon from "../../icons/FolderIcon";
import CircleIcon from "../../icons/CircleIcon";

type LibraryProps = {
  sounds: Sound[];
  onEdit: (sound: Sound) => void;
  onDelete: (id: number) => void;
  addSound: () => void;
  addYoutube: () => void;
  startRecord: () => void;
};

export default function SoundLibrary({
  sounds,
  onEdit,
  onDelete,
  addSound,
  addYoutube,
  startRecord,
}: LibraryProps) {
  const [filter, setFilter] = useState("");

  return (
    <>
      <div className="flex-gap">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "50%" }}
        />
        <HoverDropdown
          label={<PlusIcon className="icon fill" />}
          items={[
            {
              label: (
                <div className="flex-gap">
                  <FolderIcon className="icon sml stroke" />
                  <span>From File</span>
                </div>
              ),
              button: true,
              onClick: addSound,
            },
            {
              label: (
                <div className="flex-gap">
                  <CircleIcon className="icon sml fill" />
                  <span>Record New</span>
                </div>
              ),
              button: true,
              onClick: startRecord,
            },
            {
              label: (
                <div className="flex-gap">
                  <TriangeIcon className="icon sml fill" />
                  <span>From YouTube</span>
                </div>
              ),
              button: true,
              onClick: addYoutube,
            },
          ]}
        />
      </div>
      <div
        className="grid-gap"
        style={{
          textAlign: "start",
          gridTemplateColumns: "1fr 1fr 1fr",
          height: "200px",
          overflowY: "auto",
        }}
      >
        {sounds
          .filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))
          .map((s) => (
            <SoundLibraryItem
              key={s.id}
              sound={s}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
      </div>
    </>
  );
}
