"use client";
import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import KanbanCard from "./kanban-card";
import { Doc, Id } from "@workspace/backend/_generated/dataModel";
import { Plus } from "lucide-react";

interface KanbanColumnProps {
  id: "todo" | "in-progress" | "done";
  title: string;
  tasks: Doc<"kanban_tasks">[];
  onAddTask: (status: "todo" | "in-progress" | "done") => void;
  onDeleteTask: (id: Id<"kanban_tasks">) => void;
  color: string;
  isPending: boolean;
}

const KanbanColumn = ({ id, title, tasks, onAddTask, onDeleteTask, color, isPending }: KanbanColumnProps) => {
  return (
    <div className="flex flex-col w-[350px] min-h-[500px] rounded-2xl bg-muted/30 border border-border p-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="text-sm font-bold text-foreground/70 uppercase tracking-wider">
            {title}
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-md bg-accent text-accent-foreground/50">
              {tasks.length}
            </span>
          </h3>
        </div>
        <button
          onClick={() => onAddTask(id)}
          disabled={isPending}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
        </button>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[100px] transition-colors rounded-xl p-1 ${
              snapshot.isDraggingOver ? "bg-accent/30" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <KanbanCard 
                key={task._id} 
                task={task} 
                index={index} 
                onDelete={onDeleteTask} 
                isPending={isPending}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
