import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  projectSlug: z.string().min(1),
});

export const SendMessageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(4000),
  productInstanceId: z.string().min(1),
});

export const CreateConversationSchema = z.object({
  productInstanceId: z.string().min(1),
  title: z.string().optional(),
});

export const UpdateIntegrationsSchema = z.object({
  shopify: z.object({
    enabled: z.boolean(),
    storeUrl: z.string().optional(),
  }),
  crm: z.object({
    enabled: z.boolean(),
    crmName: z.string().optional(),
  }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type UpdateIntegrationsInput = z.infer<typeof UpdateIntegrationsSchema>;
