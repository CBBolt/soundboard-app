import { useState } from "react";
import PlusIcon from "../../icons/PlusIcon";
import styles from "./_styles/BoardTile.module.css";
import Modal from "../Modal/Modal";
import TrashIcon from "../../icons/TrashIcon";
import { truncateText } from "../../lib/helpers";

type TileProps = {
  sounds: Sound[];
  sound: Sound | null;
  setSound: (soundId: number) => void;
};

export default function BoardTile({ sounds, sound, setSound }: TileProps) {
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
        className={styles.tile}
        onClick={() => {
          if (sound) {
          } else {
            setEdit(true);
          }
        }}
      >
        {sound ? (
          <>
            <div
              className="icon-btn"
              onClick={() => {
                setSound(0);
              }}
            >
              <TrashIcon className="icon stroke" />
            </div>
            {truncateText(sound.name)}
          </>
        ) : (
          <PlusIcon className="icon fill" style={{ opacity: 0.5 }} />
        )}
      </div>
    </>
  );
}
