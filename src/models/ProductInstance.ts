import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductInstance extends Document {
  projectId: mongoose.Types.ObjectId;
  nameSpace: string;
  productType: "ai-sales-assistant" | "ai-support-agent" | "ai-onboarding";
  displayName: string;
  systemPrompt?: string;
  createdAt: Date;
}

const ProductInstanceSchema = new Schema<IProductInstance>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    nameSpace: { type: String, required: true },
    productType: {
      type: String,
      enum: ["ai-sales-assistant", "ai-support-agent", "ai-onboarding"],
      required: true,
    },
    displayName: { type: String, required: true },
    systemPrompt: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ProductInstance: Model<IProductInstance> =
  mongoose.models.ProductInstance ||
  mongoose.model<IProductInstance>("ProductInstance", ProductInstanceSchema);
