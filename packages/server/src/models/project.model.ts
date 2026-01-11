import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProjectDocument extends Document {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProjectDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Index for member lookup
projectSchema.index({ members: 1 });

// Compound index for access checks
projectSchema.index({ owner: 1, members: 1 });

export const Project = mongoose.model<IProjectDocument>(
  "Project",
  projectSchema
);
