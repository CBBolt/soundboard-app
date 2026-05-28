import { useEffect, useRef, useState } from "react";

type DropdownItem = {
  label: React.ReactNode;
  button?: boolean;
  onClick?: () => void;
};

type DropdownProps = {
  label: React.ReactNode;
  items: DropdownItem[];
};

export default function Dropdown({ label, items }: DropdownProps) {
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);

  // -----------------------------------
  // Click outside
  // -----------------------------------

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // -----------------------------------
  // Render
  // -----------------------------------

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      {/* Trigger */}

      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          padding: "8px 12px",
          color: "white",

          cursor: "pointer",
        }}
      >
        {label}
      </button>

      {/* Menu */}

      {open && (
        <div
          style={{
            position: "absolute",

            top: "calc(100% + 6px)",
            left: 0,

            minWidth: 180,

            background: "#111",

            border: "1px solid #333",
            borderRadius: 8,

            overflow: "hidden",

            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",

            zIndex: 1000,
          }}
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.button ? (
                <button
                  key={i}
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",

                    padding: "10px 12px",
                    color: "var(--text)",

                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              ) : (
                <div>{item.label}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
