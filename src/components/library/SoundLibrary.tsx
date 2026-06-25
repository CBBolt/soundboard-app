import { useState } from "react";
import SoundLibraryItem from "./SoundLibraryItem";
import HoverDropdown from "../HoverDropdown";
import TriangeIcon from "../../icons/TriangleIcon";
import PlusIcon from "../../icons/PlusIcon";
import FolderIcon from "../../icons/FolderIcon";
import CircleIcon from "../../icons/CircleIcon";
import Carousel from "../Carousel/Carousel";
import MagnifyGlassIcon from "../../icons/MagnifyGlassIcon";
import TagIcon from "../../icons/TagIcon";

type LibraryProps = {
  sounds: Sound[];
  allTags: Tag[];
  full?: boolean;
  playSound?: (sound: Sound) => void;
  onEdit?: (sound: Sound) => void;
  onDelete?: (id: number) => void;
  onClick?: (sound: Sound) => void;
  addSound?: () => void;
  addYoutube?: () => void;
  startRecord?: () => void;
};

export default function SoundLibrary({
  sounds,
  allTags,
  full = true,
  playSound,
  onEdit,
  onDelete,
  onClick,
  addSound,
  addYoutube,
  startRecord,
}: LibraryProps) {
  const [filter, setFilter] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  const filteredSounds = sounds.filter((sound) => {
    const matchesName = sound.name.toLowerCase().includes(filter.toLowerCase());

    const matchesTags =
      selectedTags.length === 0 ||
      sound.tags?.some((soundTag) =>
        selectedTags.some((selectedTag) => selectedTag.id === soundTag.id),
      );

    return matchesName && matchesTags;
  });

  return (
    <>
      <div
        className="grid-gap"
        style={{
          gridTemplateColumns: full ? "0.1fr 1fr" : "1fr",
        }}
      >
        {full && (
          <HoverDropdown
            data-tour="add-sound-modal"
            label={<PlusIcon className="icon fill" data-tour="add-sound" />}
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
        )}

        <div className="flex-gap" style={{ justifyContent: "end" }}>
          <div className="flex-gap">
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <MagnifyGlassIcon className="icon stroke" />
          </div>
          {allTags.length > 0 && (
            <div className="flex-gap">
              <Carousel
                items={allTags}
                curItemId={0}
                onSelect={(id) =>
                  setSelectedTags((prev) =>
                    prev.some((t) => t.id === id)
                      ? prev.filter((t) => t.id !== id)
                      : [...prev, allTags.find((t) => t.id === id)!],
                  )
                }
                maxItems={2}
                isHighlighted={(tag) =>
                  selectedTags.some((t) => tag.id === t.id)
                }
              />
              <TagIcon className="icon stroke" />
            </div>
          )}
        </div>
      </div>
      <div
        className="flex-gap"
        style={{
          flex: "1",
          flexDirection: "column",
          overflowY: "auto",
          textAlign: "start",
          alignItems: "start",
          padding: 5,
        }}
      >
        {filteredSounds.map((s) => (
          <SoundLibraryItem
            key={s.id}
            sound={s}
            playSound={playSound}
            onEdit={onEdit}
            onDelete={onDelete}
            onClick={onClick}
            full={full}
          />
        ))}
      </div>
    </>
  );
}
