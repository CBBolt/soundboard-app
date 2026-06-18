import { useState } from "react";

import TagComponent from "./TagComponent";
import PlusIcon from "../../icons/PlusIcon";
import Modal from "../Modal/Modal";
import SaveIcon from "../../icons/SaveIcon";
import PencilIcon from "../../icons/PencilIcon";
import TrashIcon from "../../icons/TrashIcon";
import MagnifyGlassIcon from "../../icons/MagnifyGlassIcon";

type TagProps = {
  tags: Tag[];
  loadTags: () => void;
};

type TagConfig = {
  filter: string;
  addTag: Partial<Tag> | null;
  editTag: Tag | null;
  deleteId: number;
};

export default function TagManager({ tags, loadTags }: TagProps) {
  const [config, setConfig] = useState<TagConfig>({
    filter: "",
    addTag: null,
    editTag: null,
    deleteId: -1,
  });

  return (
    <>
      <Modal
        isOpen={config.deleteId > 0}
        onClose={() => setConfig((prev) => ({ ...prev, deleteId: -1 }))}
        header={
          <div className="flex-gap">
            <TrashIcon className="icon stroke" />
            Delete Tag
          </div>
        }
      >
        <div>Are you sure you want to delete this tag?</div>
        <button
          onClick={() => {
            window.electronAPI.deleteTag(config.deleteId);
            setConfig((prev) => ({ ...prev, deleteId: -1 }));
            loadTags();
          }}
        >
          Confirm
        </button>
      </Modal>

      <Modal
        isOpen={config.editTag !== null}
        onClose={() => setConfig((prev) => ({ ...prev, editTag: null }))}
        header={
          <div className="flex-gap">
            <PencilIcon className="icon fill" />
            Edit Tag
          </div>
        }
      >
        <div
          className="icon-btn"
          style={{ position: "absolute", top: 10, right: 50 }}
          onClick={() => {
            window.electronAPI.updateTag(config.editTag!);
            setConfig((prev) => ({ ...prev, editTag: null }));
            loadTags();
          }}
        >
          <SaveIcon className="icon fill" />
        </div>

        <div className="grid-gap" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <label className="flex-gap">
            Name:
            <input
              value={config.editTag?.name}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  editTag: { ...prev.editTag, name: e.target.value } as Tag,
                }))
              }
            />
          </label>

          <label className="flex-gap">
            Color:
            <input
              type="color"
              style={{ height: "50px" }}
              value={config.editTag?.color}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  editTag: { ...prev.editTag, color: e.target.value } as Tag,
                }))
              }
            />
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={config.addTag !== null}
        onClose={() => setConfig((prev) => ({ ...prev, addTag: null }))}
        header={
          <div className="flex-gap">
            <PlusIcon className="icon fill" />
            Add Tag
          </div>
        }
      >
        <div
          className="icon-btn"
          style={{ position: "absolute", top: 10, right: 50 }}
          onClick={() => {
            window.electronAPI.addTag(config.addTag as Tag);
            setConfig((prev) => ({ ...prev, addTag: null }));
            loadTags();
          }}
        >
          <SaveIcon className="icon fill" />
        </div>

        <div className="grid-gap" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <label className="flex-gap">
            Name:
            <input
              value={config.addTag?.name}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  addTag: { ...prev.addTag, name: e.target.value } as Tag,
                }))
              }
            />
          </label>

          <label className="flex-gap">
            Color:
            <input
              type="color"
              style={{ height: "50px" }}
              value={config.addTag?.color}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  addTag: { ...prev.addTag, color: e.target.value } as Tag,
                }))
              }
            />
          </label>
        </div>
      </Modal>
      <div>
        <div className="flex-gap">
          <div className="flex-gap">
            <input
              type="search"
              value={config.filter}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, filter: e.target.value }))
              }
            />
            <MagnifyGlassIcon className="icon stroke" />
          </div>
          <button
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                addTag: { name: "New Tag", color: "#FFFFFF" },
              }))
            }
          >
            <PlusIcon className="icon fill" />
          </button>
        </div>

        <div style={{ height: 200, overflowY: "auto" }}>
          {tags
            .filter((t) =>
              t.name.toLowerCase().includes(config.filter.toLowerCase()),
            )
            .map((b, i) => (
              <TagComponent
                key={i}
                tag={b}
                onEdit={(tag) =>
                  setConfig((prev) => ({ ...prev, editTag: tag }))
                }
                onDelete={(id) =>
                  setConfig((prev) => ({ ...prev, deleteId: id }))
                }
              />
            ))}
        </div>
      </div>
    </>
  );
}
