"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/utils/cn";

import { ITask } from "@workflow/shared";

interface TaskCardProps {
  task: ITask & { assignee?: any };
  isDragging?: boolean;
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white p-3 rounded shadow-sm border border-gray-200 cursor-grab",
        "hover:shadow-md transition-shadow",
        isDragging && "opacity-50"
      )}
    >
      <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
      {task.description && (
        <p className="text-gray-700 text-xs mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded",
            priorityColors[task.priority] || priorityColors.medium
          )}
        >
          {task.priority}
        </span>
        {task.assignee && (
          <span className="text-xs text-gray-700">{task.assignee.name}</span>
        )}
      </div>
    </div>
  );
};
