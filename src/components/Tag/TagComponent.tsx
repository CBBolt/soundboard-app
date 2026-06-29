import { getContrastTextColor } from "../../lib/helpers";

import PencilIcon from "../../icons/PencilIcon";
import TrashIcon from "../../icons/TrashIcon";

import styles from "./_styles/Tag.module.css";

type TagComponentProps = {
  tag: Tag;
  onEdit?: (tag: Tag) => void;
  onDelete?: (id: number) => void;
  editable?: boolean;
  mini?: boolean;
};

export default function TagComponent({
  tag,
  onEdit,
  onDelete,
  mini = false,
  editable = true,
}: TagComponentProps) {
  const textColor = getContrastTextColor(tag.color);

  return (
    <div
      className={`${styles["tag-wrapper"]} grey`}
      data-tooltip={mini ? tag.name : undefined}
      style={{
        gridTemplateColumns: editable ? "1fr 1fr" : "1fr",
      }}
    >
      <div
        className={`${styles.tag} ${mini ? styles.mini : ""}`}
        style={{ background: tag.color, color: textColor }}
      >
        {!mini && <div className={styles.truncated}>{tag.name}</div>}
      </div>

      {editable && (
        <div className="flex-gap">
          <button onClick={() => onEdit?.(tag)}>
            <PencilIcon className="icon fill" />
          </button>
          <button onClick={() => onDelete?.(tag.id)}>
            <TrashIcon className="icon stroke" />
          </button>
        </div>
      )}
    </div>
  );
}
