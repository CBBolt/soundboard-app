import type { TutorialCondition } from "../_types/tutorial";

function evalCondition(cond: TutorialCondition) {
  switch (cond.type) {
    case "sidebar-closed":
      return (
        document
          .querySelector("[data-tour='sidebar-button']")
          ?.getAttribute("tour-cond") === "closed"
      );
    case "vm-toggled":
      return (
        document
          .querySelector("[data-tour='vm-toggle']")
          ?.getAttribute("tour-cond") === "local"
      );
    case "sidebar-item":
      return (
        document
          .querySelector("[data-tour='sidebar-menu']")
          ?.getAttribute("tour-cond") !== cond.item
      );
    case "boards-created":
      return (
        Number(
          document
            .querySelector("[data-tour='boards-section']")
            ?.getAttribute("tour-cond"),
        ) === 0
      );
  }
}

export function evaluateCondition(condition: TutorialCondition[]) {
  return condition.every((c) => evalCondition(c));
}
