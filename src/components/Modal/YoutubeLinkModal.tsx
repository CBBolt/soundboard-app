import { useEffect, useState } from "react";
import SaveIcon from "../../icons/SaveIcon";
import Modal from "./Modal";
import LoadingSpinner from "../LoadingSpinner";

type Props = {
  show: boolean;
  progress: number;
  onClose: () => void;
  onSave: (url: string) => void;
};

export default function YoutubeLinkModal({
  show,
  progress,
  onClose,
  onSave,
}: Props) {
  const [url, setURL] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (progress >= 100) setLoading(false);
  }, [progress]);

  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      locked={{
        lockedCondition: loading,
        lockedMessage: "Audio is being downloaded",
      }}
      header={
        <>
          <h2>Add Youtube Link</h2>
        </>
      }
    >
      <div
        className="icon-btn"
        style={{ position: "absolute", top: 10, right: 50 }}
        onClick={() => {
          onSave(url);
          setLoading(true);
          setURL("");
        }}
      >
        <SaveIcon className="icon fill" />
      </div>

      {loading && progress >= 0 && <LoadingSpinner />}

      <div className="flex-gap">
        <span>Link:</span>
        <input
          disabled={loading}
          value={url}
          onChange={(e) => setURL(e.target.value)}
        />
      </div>
    </Modal>
  );
}
