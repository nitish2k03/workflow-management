"use client";
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "@/components/tasks/TaskCard";
import { cn } from "@/utils/cn";

import { TaskStatus, ITask } from "@workflow/shared";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: (ITask & { assignee?: any })[]; // Allow populated assignee
}

const statusColors: Record<TaskStatus, string> = {
  BACKLOG: "border-t-gray-400",
  IN_PROGRESS: "border-t-blue-500",
  REVIEW: "border-t-yellow-500",
  DONE: "border-t-green-500",
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 bg-gray-100 rounded-lg border-t-4",
        statusColors[status],
        isOver && "ring-2 ring-blue-400"
      )}
    >
      <div className="p-3 bg-white rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="px-2 py-0.5 text-xs bg-gray-200 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="p-2 space-y-2 min-h-[150px] max-h-[calc(100vh-280px)] overflow-y-auto">
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No tasks</div>
        )}
      </div>
    </div>
  );
};
