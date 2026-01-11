"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { projectsApi } from "@/api/projects.api";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";

interface Project {
  _id: string;
  name: string;
  description?: string;
  owner: { _id: string; name: string };
  members: { _id: string; name: string }[];
  createdAt: string;
}

export default function ProjectListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  const { showToast } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await projectsApi.getAll();
      // API returns { projects: [...], pagination: {...} }
      return (response.data.data?.projects ||
        response.data.data ||
        []) as Project[];
    },
    enabled: !!user,
  });

  const createProjectMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      showToast("success", "Project created!");
      setIsModalOpen(false);
      setNewProject({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: any) => {
      showToast(
        "error",
        error.response?.data?.error?.message || "Failed to create project"
      );
    },
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation.mutate(newProject);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
        {user?.role === "owner" && (
          <Button onClick={() => setIsModalOpen(true)}>New Project</Button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-700">
          No projects yet.{" "}
          {user?.role === "owner" && "Create your first project!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project._id}
              href={`/projects/${project._id}`}
              className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-lg text-gray-900">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-gray-700 text-sm mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between text-sm text-gray-700">
                <span>Owner: {project.owner.name}</span>
                <span>{project.members.length} members</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Name"
            value={newProject.name}
            onChange={(e) =>
              setNewProject({ ...newProject, name: e.target.value })
            }
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Description
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createProjectMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
