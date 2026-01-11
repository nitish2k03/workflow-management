"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  owner: { _id: string; name: string; email: string };
  members: { _id: string; name: string; email: string }[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const { showToast } = useUIStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await projectsApi.getById(projectId);
      return response.data.data as Project;
    },
    retry: false,
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (email: string) => projectsApi.inviteMember(projectId, email),
    onSuccess: () => {
      showToast("success", "Member invited!");
      setIsInviteModalOpen(false);
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (error: any) => {
      showToast(
        "error",
        error.response?.data?.error?.message || "Failed to invite"
      );
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(projectId, userId),
    onSuccess: () => {
      showToast("success", "Member removed");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: () => {
      showToast("error", "Failed to remove member");
    },
  });

  if (error) {
    if ((error as any).response?.status === 404) {
      return <div className="text-center py-8">Project not found</div>;
    }
    showToast("error", "Failed to load project");
    router.push("/projects");
    return null;
  }

  const isOwner = project?.owner._id === user?._id;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMemberMutation.mutate(inviteEmail);
  };

  const handleRemoveMember = (userId: string) => {
    if (!confirm("Remove this member?")) return;
    removeMemberMutation.mutate(userId);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading project...</div>;
  }

  if (!project) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/projects"
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back to projects
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-gray-700 mt-2">{project.description}</p>
            )}
          </div>
          <Link href={`/projects/${projectId}/board`}>
            <Button>Open Board</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          {isOwner && (
            <Button size="sm" onClick={() => setIsInviteModalOpen(true)}>
              Invite Member
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {/* Owner */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <span className="font-medium text-gray-900">
                {project.owner.name}
              </span>
              <span className="text-gray-700 text-sm ml-2">
                {project.owner.email}
              </span>
            </div>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Owner
            </span>
          </div>

          {/* Members */}
          {project.members.map((member) => (
            <div
              key={member._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div>
                <span className="font-medium text-gray-900">{member.name}</span>
                <span className="text-gray-700 text-sm ml-2">
                  {member.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-gray-200 rounded text-gray-900">
                  Member
                </span>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          {project.members.length === 0 && (
            <p className="text-gray-700 text-center py-4">No members yet</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="member@example.com"
            required
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={inviteMemberMutation.isPending}>
              Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
