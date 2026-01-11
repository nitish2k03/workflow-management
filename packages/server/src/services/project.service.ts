import { Project } from "../models/project.model";
import { User } from "../models/user.model";
import { Task } from "../models/task.model";
import { ActivityLog } from "../models/activity-log.model";
import { ApiError } from "../utils/api-error";
import { CreateProjectInput, UpdateProjectInput } from "@workflow/shared";

export class ProjectService {
  async create(data: CreateProjectInput, ownerId: string) {
    const project = await Project.create({
      ...data,
      owner: ownerId,
      members: [],
    });

    return project.populate("owner", "name email");
  }

  async findUserProjects(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const query = {
      $or: [{ owner: userId }, { members: userId }],
    };

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate("owner", "name email")
        .populate("members", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
    ]);

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(projectId: string) {
    const project = await Project.findById(projectId)
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) {
      throw new ApiError("NOT_FOUND", "Project not found", 404);
    }

    return project;
  }

  async update(projectId: string, data: UpdateProjectInput) {
    try {
      const project = await Project.findByIdAndUpdate(
        projectId,
        { $set: data },
        { new: true, runValidators: true }
      )
        .populate("owner", "name email")
        .populate("members", "name email");

      if (!project) {
        throw new ApiError("NOT_FOUND", "Project not found", 404);
      }

      return project;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "INTERNAL_SERVER_ERROR",
        "Failed to update project",
        500
      );
    }
  }

  async delete(projectId: string, userId: string) {
    try {
      const project = await Project.findById(projectId);
      if (!project) throw new ApiError("NOT_FOUND", "Project not found", 404);

      if (project.owner.toString() !== userId) {
        throw new ApiError("FORBIDDEN", "Only owner can delete project", 403);
      }

      // Delete all related data before removing the project
      await Task.deleteMany({ projectId });
      await ActivityLog.deleteMany({ projectId });
      await Project.findByIdAndDelete(projectId);

      return { message: "Project deleted successfully" };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "INTERNAL_SERVER_ERROR",
        "Failed to delete project",
        500
      );
    }
  }

  async inviteMember(projectId: string, email: string) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError("NOT_FOUND", "User with this email not found", 404);
    }

    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError("NOT_FOUND", "Project not found", 404);
    }

    // Check if already owner
    if (project.owner.toString() === user._id.toString()) {
      throw new ApiError(
        "BAD_REQUEST",
        "User is already the project owner",
        400
      );
    }

    // Check if already member
    if (project.members.some((m) => m.toString() === user._id.toString())) {
      throw new ApiError(
        "BAD_REQUEST",
        "User is already a project member",
        400
      );
    }

    project.members.push(user._id);
    await project.save();

    return project.populate([
      { path: "owner", select: "name email" },
      { path: "members", select: "name email" },
    ]);
  }

  async removeMember(projectId: string, userId: string) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError("NOT_FOUND", "Project not found", 404);
    }

    const memberIndex = project.members.findIndex(
      (m) => m.toString() === userId
    );

    if (memberIndex === -1) {
      throw new ApiError(
        "NOT_FOUND",
        "User is not a member of this project",
        404
      );
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    return project.populate([
      { path: "owner", select: "name email" },
      { path: "members", select: "name email" },
    ]);
  }
}

export const projectService = new ProjectService();
