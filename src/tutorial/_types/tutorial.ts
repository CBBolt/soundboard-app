export type TutorialStep = {
  id: string;
  text: string;
  target?: string;
  placement?: "top" | "bottom" | "left" | "right";
  advance?: "next-button" | "click-target" | "auto";
  delayMs?: number;
  condition?: TutorialCondition[];
  closeModal?: boolean;
};

export type TutorialCondition =
  | {
      type: "sidebar-closed";
    }
  | {
      type: "vm-toggled";
    }
  | { type: "sidebar-item"; item: string }
  | { type: "boards-created" };

export type TutorialFlow = {
  id: string;
  steps: TutorialStep[];
};
