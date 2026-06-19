import { useState } from "react";
import PlusIcon from "../../icons/PlusIcon";
import styles from "./_styles/BoardTile.module.css";
import Modal from "../Modal/Modal";
import TrashIcon from "../../icons/TrashIcon";
import Marquee from "../Marquee/Marquee";
import { Icon } from "@iconify/react";
import MusicNoteIcon from "../../icons/MusicNoteIcon";

type TileProps = {
  sounds: Sound[];
  sound: Sound | null;
  drag: {
    dragged: boolean;
    dropOver: boolean;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent<HTMLElement>) => void;
    onDragEnd: () => void;
    onDrop: () => void;
  };
  playSound: (sound: Sound) => void;
  setSound: (soundId: number) => void;
};

export default function BoardTile({
  sounds,
  sound,
  drag,
  playSound,
  setSound,
}: TileProps) {
  const [edit, setEdit] = useState(false);

  return (
    <>
      <Modal
        isOpen={edit}
        onClose={() => setEdit(false)}
        header={
          <div className="flex-gap">
            <PlusIcon className="icon fill" />
            Add Sound
          </div>
        }
      >
        <div>
          {sounds.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSound(s.id);
                setEdit(false);
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </Modal>

      <div
        draggable
        className={`${styles.tile} ${sound ? "grey" : ""}`}
        style={{
          opacity: drag.dragged ? 0.5 : 1,
          background: drag.dropOver
            ? "oklch(from var(--base-color) calc(l * 1.1) c h)"
            : "",
        }}
        onClick={() => {
          if (sound) {
            playSound(sound);
          } else {
            setEdit(true);
          }
        }}
        onDragStart={drag.onDragStart}
        onDragOver={(e) => drag.onDragOver(e)}
        onDragEnd={drag.onDragEnd}
        onDrop={drag.onDrop}
      >
        <div
          className={styles["tile-editor"]}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSound(sound ? 0 : -1);
            }}
          >
            <TrashIcon className="icon stroke sml" />
          </div>
        </div>
        {sound ? (
          <>
            {sound ? (
              <div className="grid-gap">
                <div>
                  {sound.icon ? (
                    <Icon
                      icon={sound.icon}
                      className="icon fill"
                      style={{ color: sound.color }}
                    />
                  ) : (
                    <MusicNoteIcon
                      className="icon fill"
                      style={{ fill: sound.color }}
                    />
                  )}
                </div>
                <Marquee text={sound.name} />
              </div>
            ) : (
              <PlusIcon className="icon fill" style={{ opacity: 0.5 }} />
            )}
          </>
        ) : (
          <PlusIcon className="icon fill" style={{ opacity: 0.5 }} />
        )}
      </div>
    </>
  );
}
