import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
  name: string;
  slug: string;
  description?: string;
  integrations: {
    shopify: { enabled: boolean; storeUrl?: string };
    crm: { enabled: boolean; crmName?: string };
  };
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    integrations: {
      shopify: {
        enabled: { type: Boolean, default: false },
        storeUrl: { type: String, default: "" },
      },
      crm: {
        enabled: { type: Boolean, default: false },
        crmName: { type: String, default: "HubSpot" },
      },
    },
  },
  { timestamps: true }
);

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
