import { supabase } from "@/integrations/supabase/client";

interface LogActivityInput {
  shopId: string;
  eventType: string;
  action: string;
  entityType: string;
  entityId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export const logActivity = async ({
  shopId,
  eventType,
  action,
  entityType,
  entityId,
  message,
  metadata = {},
}: LogActivityInput) => {
  if (!shopId) return;

  await supabase.from("activity_logs" as any).insert({
    shop_id: shopId,
    event_type: eventType,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    message,
    metadata,
  } as any);
};
