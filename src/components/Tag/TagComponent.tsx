import PencilIcon from "../../icons/PencilIcon";
import TrashIcon from "../../icons/TrashIcon";
import { getContrastTextColor, truncateText } from "../../lib/helpers";

import styles from "./_styles/Tag.module.css";

type TagComponentProps = {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (id: number) => void;
};

export default function TagComponent({
  tag,
  onEdit,
  onDelete,
}: TagComponentProps) {
  const textColor = getContrastTextColor(tag.color);

  return (
    <div
      className="grid-gap grey"
      style={{
        margin: "5px 0px",
        padding: 5,
        borderRadius: 5,
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      <div
        className={styles.tag}
        style={{ background: tag.color, color: textColor }}
      >
        {truncateText(tag.name)}
      </div>
      <div className="flex-gap">
        <button onClick={() => onEdit(tag)}>
          <PencilIcon className="icon fill" />
        </button>
        <button onClick={() => onDelete(tag.id)}>
          <TrashIcon className="icon stroke" />
        </button>
      </div>
    </div>
  );
}
