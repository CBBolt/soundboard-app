import { useEffect, useState } from "react";

import LoadingSpinner from "../LoadingSpinner";

import { Icon } from "@iconify/react";
import MagnifyGlassIcon from "../../icons/MagnifyGlassIcon";

type PickerProps = {
  onSelect: (name: string) => void;
};

type PickerConfig = {
  loading: boolean;
  search: string;
  icons: string[];
  page: number;
};

const PAGE_SIZE = 100;

export default function IconPicker({ onSelect }: PickerProps) {
  const [config, setConfig] = useState<PickerConfig>({
    loading: true,
    search: "",
    icons: [],
    page: 0,
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
      .finally(() =>
        setConfig((prev) => ({
          ...prev,
          loading: false,
        })),
      );
  }, []);

  const filtered = config.search
    ? config.icons.filter((i) =>
        i.toLowerCase().includes(config.search.toLowerCase()),
      )
    : config.icons;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const visibleIcons = config.search
    ? filtered.slice(0, PAGE_SIZE)
    : filtered.slice(
        config.page * PAGE_SIZE,
        config.page * PAGE_SIZE + PAGE_SIZE,
      );

  const updateSearch = (value: string) => {
    setConfig((prev) => ({
      ...prev,
      search: value,
      page: 0,
    }));
  };

  const changePage = (direction: number) => {
    setConfig((prev) => ({
      ...prev,
      page: Math.max(0, Math.min(prev.page + direction, totalPages - 1)),
    }));
  };

  return (
    <>
      <div className="flex-gap">
        <input
          value={config.search}
          onChange={(e) => updateSearch(e.target.value)}
          placeholder="Search icons..."
        />

        <MagnifyGlassIcon className="icon stroke" />
      </div>

      {config.loading && <LoadingSpinner />}

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
        {visibleIcons.map((icon) => (
          <button key={icon} onClick={() => onSelect(icon)}>
            <Icon icon={icon} className="icon" />
          </button>
        ))}
      </div>

      {!config.loading && !config.search && (
        <div
          className="flex-gap"
          style={{
            justifyContent: "center",
            margin: "10px 0",
          }}
        >
          <button disabled={config.page === 0} onClick={() => changePage(-1)}>
            ◀
          </button>

          <span>
            {config.page + 1} / {totalPages}
          </span>

          <button
            disabled={config.page >= totalPages - 1}
            onClick={() => changePage(1)}
          >
            ▶
          </button>
        </div>
      )}
    </>
  );
}
