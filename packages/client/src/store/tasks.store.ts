import { create } from "zustand";
import { ITask, TaskStatus } from "@workflow/shared";

interface TasksState {
  tasks: Record<TaskStatus, ITask[]>;
  isLoading: boolean;
  setTasks: (tasks: Record<TaskStatus, ITask[]>) => void;
  setBoard: (board: Record<TaskStatus, ITask[]>) => void;
  setLoading: (isLoading: boolean) => void;
  addTask: (task: ITask) => void;
  updateTask: (taskId: string, updates: Partial<ITask>) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  removeTask: (taskId: string) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: {
    [TaskStatus.BACKLOG]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.REVIEW]: [],
    [TaskStatus.DONE]: [],
  },
  isLoading: false,

  setTasks: (tasks) => set({ tasks }),
  setBoard: (tasks) => set({ tasks }),
  setLoading: (isLoading) => set({ isLoading }),

  addTask: (task) =>
    set((state) => {
      const existingTask = state.tasks[task.status]?.find(
        (t) => t._id === task._id
      );
      if (existingTask) {
        return state;
      }
      return {
        tasks: {
          ...state.tasks,
          [task.status]: [task, ...state.tasks[task.status]],
        },
      };
    }),

  updateTask: (taskId, updates) =>
    set((state) => {
      const newTasks = { ...state.tasks };

      for (const status of Object.values(TaskStatus)) {
        const index = newTasks[status].findIndex((t) => t._id === taskId);
        if (index !== -1) {
          newTasks[status][index] = { ...newTasks[status][index], ...updates };

          if (updates.status && updates.status !== status) {
            const [task] = newTasks[status].splice(index, 1);
            newTasks[updates.status].push(task);
          }
          break;
        }
      }
      return { tasks: newTasks };
    }),

  moveTask: (taskId, newStatus) =>
    set((state) => {
      const newTasks = { ...state.tasks };
      let taskToMove: ITask | undefined;

      for (const status of Object.values(TaskStatus)) {
        const index = newTasks[status].findIndex((t) => t._id === taskId);
        if (index !== -1) {
          if (status === newStatus) return state;
          [taskToMove] = newTasks[status].splice(index, 1);
          break;
        }
      }

      if (taskToMove) {
        taskToMove.status = newStatus;
        newTasks[newStatus].unshift(taskToMove);
      }

      return { tasks: newTasks };
    }),

  removeTask: (taskId) =>
    set((state) => {
      const newTasks = { ...state.tasks };
      for (const status of Object.values(TaskStatus)) {
        newTasks[status] = newTasks[status].filter((t) => t._id !== taskId);
      }
      return { tasks: newTasks };
    }),
}));

export const useTasksByStatus = (status: TaskStatus) => {
  return useTasksStore((state) => state.tasks[status]);
};
