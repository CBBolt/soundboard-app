import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import MagnifyGlassIcon from "../../icons/MagnifyGlassIcon";

type PickerProps = {
  onSelect: (name: string) => void;
};

type PickerConfig = {
  loading: boolean;
  search: string;
  icons: string[];
};

const MAX_VISIBLE = 100;

export default function IconPicker({ onSelect }: PickerProps) {
  const [config, setConfig] = useState<PickerConfig>({
    loading: true,
    search: "",
    icons: [],
  });

  useEffect(() => {
    fetch("https://api.iconify.design/collection?prefix=mdi")
      .then((r) => r.json())
      .then((data) => {
        setConfig((prev) => ({
          ...prev,
          icons: data.uncategorized.map((name: string) => `mdi:${name}`),
        }));
      })
      .finally(() => setConfig((prev) => ({ ...prev, loading: false })));
  }, []);

  const filtered = config.icons.filter((i) =>
    i.toLowerCase().includes(config.search.toLowerCase()),
  );

  return (
    <>
      <div className="flex-gap">
        <input
          value={config.search}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, search: e.target.value }))
          }
        />
        <MagnifyGlassIcon className="icon stroke" />
      </div>

      {config.loading && <span>Loading...</span>}

      <div
        className="grid-gap"
        style={{
          alignItems: "start",
          height: "200px",
          overflowY: "auto",
          margin: "10px 0",
          gridTemplateColumns: "repeat(auto-fit, minmax(50px, 1fr))",
        }}
      >
        {filtered.slice(0, MAX_VISIBLE).map((icon) => (
          <button key={icon} onClick={() => onSelect(icon)}>
            <Icon icon={icon} className="icon" />
          </button>
        ))}
      </div>
    </>
  );
}
