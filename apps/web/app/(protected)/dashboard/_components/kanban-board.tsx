"use client";
import React, { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import KanbanColumn from "./kanban-column";
import { useQuery, useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@workspace/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { useChatStore, TOGGLE_POPUP } from "../../_components/chat/chat-store";
import { Id } from "@workspace/backend/_generated/dataModel";

const KanbanBoard = () => {
  const tasks = useQuery(api.kanban.listTasks, {});
  const moveTask = useMutation(api.kanban.moveTask).withOptimisticUpdate((localQueryStore, args) => {
    const tasks = localQueryStore.getQuery(api.kanban.listTasks, {});
    if (tasks !== undefined) {
      const newTasks = tasks.map(t => 
        t._id === args.id ? { ...t, status: args.status, position: args.position } : t
      ).sort((a, b) => a.position - b.position);
      localQueryStore.setQuery(api.kanban.listTasks, {}, newTasks);
    }
  });

  const createTask = useMutation(api.kanban.createTask);

  const deleteTask = useMutation(api.kanban.deleteTask).withOptimisticUpdate((localQueryStore, args) => {
    const tasks = localQueryStore.getQuery(api.kanban.listTasks, {});
    if (tasks !== undefined) {
      localQueryStore.setQuery(api.kanban.listTasks, {}, tasks.filter(t => t._id !== args.id));
    }
  });

  const [addTaskStatus, setAddTaskStatus] = useState<"todo" | "in-progress" | "done" | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Id<"kanban_tasks"> | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { setShowAIPopup } = useChatStore();

  if (tasks === undefined) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const columns: { id: "todo" | "in-progress" | "done"; title: string; color: string }[] = [
    { id: "todo", title: "Todo", color: "bg-amber-400" },
    { id: "in-progress", title: "In Progress", color: "bg-sky-400" },
    { id: "done", title: "Done", color: "bg-emerald-400" },
  ];

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const columnTasks = tasks
      .filter((t) => t.status === destination.droppableId)
      .sort((a, b) => a.position - b.position);

    // Filter out the dragged task if it's already in the destination column
    const otherTasks = columnTasks.filter(t => t._id !== draggableId);
    
    // The position should be calculated based on the item's position in the list
    // after it has been removed from its source.
    const prevTask = otherTasks[destination.index - 1];
    const nextTask = otherTasks[destination.index];

    let newPosition: number;
    if (prevTask && nextTask) {
      newPosition = (prevTask.position + nextTask.position) / 2;
    } else if (prevTask) {
      newPosition = prevTask.position + 1024;
    } else if (nextTask) {
      newPosition = nextTask.position / 2;
    } else {
      newPosition = 1024;
    }

    try {
      setIsPending(true);
      await moveTask({
        id: draggableId as Id<"kanban_tasks">,
        status: destination.droppableId as "todo" | "in-progress" | "done",
        position: newPosition,
      });
      toast.success("Task moved");
    } catch (error) {
      toast.error("Failed to move task");
    } finally {
      setIsPending(false);
    }
  };

  const confirmAddTask = async () => {
    if (!newTaskTitle || !addTaskStatus || isPending) return;
    try {
      setIsPending(true);
      await createTask({
        title: newTaskTitle,
        status: addTaskStatus,
      });
      toast.success("Task created");
      setNewTaskTitle("");
      setAddTaskStatus(null);
    } catch (error) {
      toast.error("Failed to create task");
    } finally {
      setIsPending(false);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete || isPending) return;
    try {
      setIsPending(true);
      await deleteTask({ id: taskToDelete });
      toast.success("Task deleted");
      setTaskToDelete(null);
    } catch (error) {
      toast.error("Failed to delete task");
    } finally {
      setIsPending(false);
    }
  };

  const handleAddTask = (status: "todo" | "in-progress" | "done") => {
    setAddTaskStatus(status);
  };

  const handleDeleteTask = (id: Id<"kanban_tasks">) => {
    setTaskToDelete(id);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Board</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your tasks and workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="default"
            onClick={() => setShowAIPopup(TOGGLE_POPUP)}
            title="Toggle AI Chat"
          >
            Ask AI <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-8">
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={col.color}
              tasks={tasks.filter((t) => t.status === col.id)}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              isPending={isPending}
            />
          ))}
        </div>
      </DragDropContext>

      <Dialog open={!!addTaskStatus} onOpenChange={(open) => !open && setAddTaskStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="py-4">
             <Input 
               placeholder="Task title..." 
               value={newTaskTitle} 
               onChange={(e) => setNewTaskTitle(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && confirmAddTask()}
               autoFocus
             />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTaskStatus(null)} disabled={isPending}>Cancel</Button>
            <Button onClick={confirmAddTask} disabled={!newTaskTitle.trim() || isPending}>
              {isPending ? "Adding..." : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTask} 
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KanbanBoard;
