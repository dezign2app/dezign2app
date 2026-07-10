"use client";

import { useCallback, useState } from "react";
import type { WorkflowEditorEdge, WorkflowEditorNode } from "../_components/workflow-editor-types";

export interface WorkflowState {
  nodes: WorkflowEditorNode[];
  edges: WorkflowEditorEdge[];
}

export const useHistory = (initialState: WorkflowState) => {
  const [past, setPast] = useState<WorkflowState[]>([]);
  const [future, setFuture] = useState<WorkflowState[]>([]);

  const record = useCallback((state: WorkflowState) => {
    setPast((prev) => {
      const next = [...prev, state];
      // Limit history to 50 states
      if (next.length > 50) {
        return next.slice(next.length - 50);
      }
      return next;
    });
    setFuture([]);
  }, []);

  const undo = useCallback((currentState: WorkflowState) => {
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture((prev) => [currentState, ...prev]);

    return previous;
  }, [past]);

  const redo = useCallback((currentState: WorkflowState) => {
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    setFuture(newFuture);
    setPast((prev) => [...prev, currentState]);

    return next;
  }, [future]);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    undo,
    redo,
    record,
    clear,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
};
