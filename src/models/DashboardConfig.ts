import mongoose, { Schema, Document, Model } from "mongoose";

export type WidgetType =
  | "stat-card"
  | "conversation-chart"
  | "integration-status"
  | "recent-activity"
  | "quick-actions"
  | "ai-usage";

export interface IWidget {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  order: number;
  span?: "full" | "half" | "third";
  config?: Record<string, unknown>;
}

export interface ISection {
  id: string;
  label: string;
  description?: string;
  order: number;
  widgets: IWidget[];
}

export interface IDashboardConfig extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  subtitle?: string;
  sections: ISection[];
  theme?: "light" | "dark" | "system";
  updatedAt: Date;
}

const WidgetSchema = new Schema<IWidget>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["stat-card","conversation-chart","integration-status","recent-activity","quick-actions","ai-usage"],
      required: true,
    },
    title: { type: String, required: true },
    subtitle: { type: String },
    order: { type: Number, required: true },
    span: { type: String, enum: ["full", "half", "third"], default: "half" },
    config: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const SectionSchema = new Schema<ISection>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
    widgets: [WidgetSchema],
  },
  { _id: false }
);

const DashboardConfigSchema = new Schema<IDashboardConfig>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, unique: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    sections: [SectionSchema],
    theme: { type: String, enum: ["light", "dark", "system"], default: "light" },
  },
  { timestamps: true }
);

export const DashboardConfig: Model<IDashboardConfig> =
  mongoose.models.DashboardConfig ||
  mongoose.model<IDashboardConfig>("DashboardConfig", DashboardConfigSchema);
