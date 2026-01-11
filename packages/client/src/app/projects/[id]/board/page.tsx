"use client";
import { TaskStatus, TaskPriority, ITask, VALID_TRANSITIONS } from "@workflow/shared";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useTasksStore, useTasksByStatus } from "@/store/tasks.store";
import { useUIStore } from "@/store/ui.store";
import { tasksApi } from "@/api/tasks.api";
import { projectsApi } from "@/api/projects.api";
import { useWebSocket } from "@/hooks/useWebSocket";

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: TaskStatus.BACKLOG, title: "Backlog" },
  { status: TaskStatus.IN_PROGRESS, title: "In Progress" },
  { status: TaskStatus.REVIEW, title: "Review" },
  { status: TaskStatus.DONE, title: "Done" },
];

export default function KanbanBoardPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [projectName, setProjectName] = useState("");
  const [activeTask, setActiveTask] = useState<ITask | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: TaskPriority.MEDIUM as string,
  });
  const [isCreating, setIsCreating] = useState(false);

  const { tasks, setBoard, moveTask, addTask, isLoading, setLoading } =
    useTasksStore();
  const { showToast } = useUIStore();

  useWebSocket(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Fetch board data
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [boardRes, projectRes] = await Promise.all([
          tasksApi.getKanbanBoard(projectId),
          projectsApi.getById(projectId),
        ]);
        setBoard(boardRes.data.data);
        setProjectName(projectRes.data.data.name);
      } catch (error) {
        showToast("error", "Failed to load board");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const findTask = (id: string): ITask | undefined => {
    for (const status of Object.values(TaskStatus)) {
      const found = tasks[status]?.find((t) => t._id === id);
      if (found) return found;
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTask(event.active.id as string);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = findTask(taskId);

    if (!task || task.status === newStatus) return;

    // Validate transition (client-side check)
    if (!VALID_TRANSITIONS[task.status]?.includes(newStatus)) {
      showToast(
        "error",
        `Cannot move from ${task.status} to ${newStatus}. Allowed: ${
          VALID_TRANSITIONS[task.status]?.join(", ") || "none"
        }`
      );
      return;
    }

    // Optimistic update
    const previousStatus = task.status;
    moveTask(taskId, newStatus);

    try {
      await tasksApi.updateStatus(taskId, newStatus);
      showToast("success", "Status updated");
    } catch (error: any) {
      // Rollback on failure
      moveTask(taskId, previousStatus);
      showToast(
        "error",
        error.response?.data?.error?.message || "Failed to update"
      );
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await tasksApi.create(projectId, newTask as any);
      addTask(response.data.data);
      showToast("success", "Task created");
      setIsCreateModalOpen(false);
      setNewTask({ title: "", description: "", priority: TaskPriority.MEDIUM });
    } catch (error: any) {
      // ...
      showToast(
        "error",
        error.response?.data?.error?.message || "Failed to create"
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading board...</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/projects/${projectId}`}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back to project
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {projectName} - Board
        </h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Add Task</Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.status}
              status={column.status}
              title={column.title}
              tasks={tasks[column.status] || []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Description
            </label>
            <textarea
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Priority
            </label>
            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
