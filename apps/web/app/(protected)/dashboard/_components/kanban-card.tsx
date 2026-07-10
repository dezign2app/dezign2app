"use client";
import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Trash2, GripVertical } from "lucide-react";
import { Doc, Id } from "@workspace/backend/_generated/dataModel";

interface KanbanCardProps {
  task: Doc<"kanban_tasks">;
  index: number;
  onDelete: (id: Id<"kanban_tasks">) => void;
  isPending: boolean;
}

const KanbanCard = ({ task, index, onDelete, isPending }: KanbanCardProps) => {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative mb-3 p-4 rounded-xl border bg-background backdrop-blur-md transition-all hover:scale-99 ${
            snapshot.isDragging ? "shadow-2xl shadow-accent/20 scale-102 z-50 ring-2 ring-accent/50" : ""
          }`}
        >
          <div className="flex items-start gap-3">
            <div 
              {...provided.dragHandleProps} 
              className="mt-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing"
            >
              <GripVertical size={16} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-card-foreground truncate">
                {task.title}
              </h4>
              {task.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>

            <button
              onClick={() => onDelete(task._id)}
              disabled={isPending}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground/50 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
            </button>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground/50 font-mono">
              #{task._id.slice(-4)}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
