import { useEffect, useState } from "react";
import SaveIcon from "../../icons/SaveIcon";
import Modal from "./Modal";

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
    <Modal isOpen={show} onClose={onClose} lockedCondition={loading}>
      <div
        className="flex-gap"
        style={{ position: "absolute", top: 10, left: 10 }}
      >
        <h2>Youtube Link</h2>
      </div>
      <div
        className="icon-btn"
        style={{ position: "absolute", top: 10, right: 50 }}
        onClick={() => {
          onSave(url);
          setLoading(true);
        }}
      >
        <SaveIcon className="icon fill" />
      </div>

      {loading && <div>{progress}%</div>}

      <div className="flex-gap">
        <span>Link:</span>
        <input value={url} onChange={(e) => setURL(e.target.value)} />
      </div>
    </Modal>
  );
}
