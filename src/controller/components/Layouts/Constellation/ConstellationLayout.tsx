import { useEffect, useMemo, useRef, useState } from "react";
import DefaultHeader from "../DefaultHeader";

import { Icon } from "@iconify/react";
import MusicNoteIcon from "../../../../icons/MusicNoteIcon";

import styles from "./_styles/Constellation.module.css";

type ConstellationLayoutProps = {
  settings: Settings;
  sounds: (Sound | null)[];
};

type Node = {
  id: number;
  x: number;
  y: number;
  sound: Sound | null;
};

type Connection = {
  from: number;
  to: number;
};

type Camera = {
  x: number;
  y: number;
  zoom: number;
};

function generateNodes(sounds: (Sound | null)[]): Node[] {
  const maxRadius = 420;

  return sounds.map((sound, index) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * maxRadius;

    return {
      id: index,
      sound,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });
}

function generateConnections(nodes: Node[]): Connection[] {
  const connections: Connection[] = [];

  nodes.forEach((node) => {
    const nearest = nodes
      .filter((n) => n.id !== node.id)
      .sort((a, b) => {
        const da = (a.x - node.x) ** 2 + (a.y - node.y) ** 2;
        const db = (b.x - node.x) ** 2 + (b.y - node.y) ** 2;
        return da - db;
      })
      .slice(0, 2);

    nearest.forEach((neighbor) => {
      const exists = connections.some(
        (c) =>
          (c.from === node.id && c.to === neighbor.id) ||
          (c.from === neighbor.id && c.to === node.id),
      );

      if (!exists) {
        connections.push({
          from: node.id,
          to: neighbor.id,
        });
      }
    });
  });

  return connections;
}

const SIZE = 35;

export default function ConstellationLayout({
  settings,
  sounds,
}: ConstellationLayoutProps) {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [hoverId, setHoverId] = useState(-1);
  const [time, setTime] = useState(0);

  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  function getDrift(id: number) {
    return {
      x:
        Math.sin(time * 0.8 + id * 12) * 12 + Math.cos(time * 1.4 + id * 5) * 6,
      y: Math.cos(time * 0.7 + id * 9) * 12 + Math.sin(time * 1.3 + id * 7) * 6,
    };
  }

  const handleWheel = (e: WheelEvent) => {
    const zoomFactor = Math.exp(-e.deltaY * 0.0015);

    setCamera((c) => {
      const newZoom = Math.min(3, Math.max(0.3, c.zoom * zoomFactor));

      return {
        ...c,
        zoom: newZoom,
      };
    });
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.isDragging) return;

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragRef.current.moved = true;
      }

      setCamera((c) => ({
        ...c,
        x: c.x + (dragRef.current.originX + dx - c.x) * 0.35,
        y: c.y + (dragRef.current.originY + dy - c.y) * 0.35,
      }));
    };

    window.addEventListener("pointermove", onMove);

    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    let raf: number;

    const loop = () => {
      setTime((t) => t + 0.01);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const nodes = useMemo(() => generateNodes(sounds), [sounds]);
  const connections = useMemo(() => generateConnections(nodes), [nodes]);

  return (
    <div className="grid-gap">
      <DefaultHeader settings={settings} onTop={true} />
      <div
        className={styles.network}
        onPointerDown={(e) => {
          dragRef.current.isDragging = true;
          dragRef.current.moved = false;

          dragRef.current.startX = e.clientX;
          dragRef.current.startY = e.clientY;

          dragRef.current.originX = camera.x;
          dragRef.current.originY = camera.y;
        }}
        onPointerMove={(e) => {
          if (!dragRef.current.isDragging) return;

          const dx = e.clientX - dragRef.current.startX;
          const dy = e.clientY - dragRef.current.startY;

          if (
            !dragRef.current.moved &&
            (Math.abs(dx) > 6 || Math.abs(dy) > 6)
          ) {
            dragRef.current.moved = true;
          }

          setCamera((c) => ({
            ...c,
            x: dragRef.current.originX + dx,
            y: dragRef.current.originY + dy,
          }));
        }}
        onPointerUp={() => {
          dragRef.current.isDragging = false;
        }}
        onMouseLeave={() => {
          dragRef.current.isDragging = false;
          setHoverId(-1);
        }}
        onWheel={(e) => handleWheel(e as any)}
      >
        <svg className={styles.lines} viewBox="-500 -500 1000 1000">
          <g
            transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}
          >
            {connections.map((connection) => {
              const from = nodes[connection.from];
              const to = nodes[connection.to];
              const fromDrift = getDrift(from.id);
              const toDrift = getDrift(to.id);

              return (
                <line
                  key={`${connection.from}-${connection.to}`}
                  x1={from.x + fromDrift.x}
                  y1={from.y + fromDrift.y}
                  x2={to.x + toDrift.x}
                  y2={to.y + toDrift.y}
                />
              );
            })}

            {nodes.map((node) => {
              const drift = getDrift(node.id);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x + drift.x}, ${node.y + drift.y}) scale(${
                    node.sound && hoverId === node.id ? 1.1 : 1
                  })`}
                  style={{
                    cursor: node.sound ? "pointer" : "default",
                    pointerEvents: "all",
                    transition: "0.3s transform ease",
                  }}
                  onPointerDown={(e) => {
                    if (!node.sound) return;

                    e.stopPropagation();

                    window.electronAPI.sendSound(node.sound.id.toString());
                  }}
                  onPointerOver={() => setHoverId(node.id)}
                  onPointerLeave={() => setHoverId(-1)}
                >
                  {node.sound && (
                    <circle
                      r={22}
                      fill={
                        hoverId === node.id ? node.sound?.color : "transparent"
                      }
                      opacity={hoverId === node.id ? "0.25" : "0"}
                      style={{
                        transition: "0.3s fill ease, 0.3s opacity ease",
                      }}
                      pointerEvents="all"
                    />
                  )}

                  {node.sound ? (
                    <>
                      {node.sound.icon ? (
                        <Icon
                          icon={node.sound.icon}
                          className="icon"
                          x={-(SIZE / 2)}
                          y={-(SIZE / 2)}
                          width={SIZE}
                          height={SIZE}
                          style={{
                            color: node.sound.color,
                            filter:
                              node.sound && hoverId === node.id
                                ? "url(#glow)"
                                : "none",
                          }}
                        />
                      ) : (
                        <MusicNoteIcon
                          className="icon"
                          x={-(SIZE / 2)}
                          y={-(SIZE / 2)}
                          width={SIZE}
                          height={SIZE}
                          style={{
                            fill: node.sound.color,
                            filter:
                              node.sound && hoverId === node.id
                                ? "url(#glow)"
                                : "none",
                          }}
                        />
                      )}
                      {hoverId === node.id && (
                        <text x={SIZE * 0.75}>{node.sound?.name}</text>
                      )}
                    </>
                  ) : (
                    <circle r="6" fill="white" opacity={0.3} />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
