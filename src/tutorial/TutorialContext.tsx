import { createContext, useContext, useState } from "react";
import type { TutorialFlow, TutorialStep } from "./_types/tutorial";
import { evaluateCondition } from "./tutorials/helpers";

type TutorialState = {
  active: boolean;

  flows: Record<string, TutorialFlow>;
  currentFlowId: string;

  stepIndex: number;
};

const TutorialContext = createContext<any>(null);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TutorialState>({
    active: false,
    flows: {},
    currentFlowId: "",
    stepIndex: 0,
  });

  const findNextStepIndex = (steps: TutorialStep[], startIndex: number) => {
    for (let i = startIndex; i < steps.length; i++) {
      const step = steps[i];

      if (!step.condition || evaluateCondition(step.condition)) {
        return i;
      }
    }

    return -1;
  };

  const startFlow = (
    flows: Record<string, TutorialFlow>,
    startFlowId: string,
  ) => {
    console.log(flows);

    setState({
      active: true,
      flows,
      currentFlowId: startFlowId,
      stepIndex: 0,
    });
  };

  const goToFlow = (flowId: string) => {
    setState((prev) => ({
      ...prev,
      currentFlowId: flowId,
      stepIndex: 0,
    }));
  };

  const next = () => {
    const flow = state.flows[state.currentFlowId];

    const nextIndex = findNextStepIndex(flow.steps, state.stepIndex + 1);

    if (nextIndex === -1) {
      stop();
      return;
    }

    setState((prev) => ({
      ...prev,
      stepIndex: nextIndex,
    }));
  };

  const stop = () => {
    setState((prev) => ({ ...prev, active: false, stepIndex: 0 }));
  };

  return (
    <TutorialContext.Provider
      value={{ state, startFlow, goToFlow, next, stop }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => useContext(TutorialContext);
