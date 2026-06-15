import PencilIcon from "../../icons/PencilIcon";
import TrashIcon from "../../icons/TrashIcon";
import HotkeyComponent from "../Hotkey/HotkeyComponent";

type ItemProps = {
  sound: Sound;
  onEdit: (sound: Sound) => void;
  onDelete: (id: number) => void;
};

export default function SoundLibraryItem({
  sound,
  onEdit,
  onDelete,
}: ItemProps) {
  return (
    <>
      <span>{sound.name}</span>
      {sound.hotkey ? (
        <HotkeyComponent hotkey={sound.hotkey} />
      ) : (
        <span>No Hotkey</span>
      )}
      <div className="flex-gap">
        <button onClick={() => onEdit(sound)}>
          <PencilIcon className="icon fill" />
        </button>
        <button onClick={() => onDelete(sound.id)}>
          <TrashIcon className="icon stroke" />
        </button>
      </div>
    </>
  );
}
