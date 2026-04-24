// Auto-generated from Supabase schema — run `npm run db:types` to regenerate
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          phone: string | null;
          public_key: string | null;
          bio: string;
          status: "online" | "away" | "offline";
          last_seen: string;
          privacy_settings: Json;
          gdpr_consented_at: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      conversations: {
        Row: {
          id: string;
          type: "direct" | "group" | "channel" | "mini_app";
          name: string | null;
          avatar_url: string | null;
          description: string | null;
          created_by: string | null;
          encrypted_key: string | null;
          is_archived: boolean;
          last_message_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["conversations"]["Row"]> & {
          type: "direct" | "group" | "channel" | "mini_app";
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Row"]>;
      };
      conversation_members: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          last_read_at: string;
          joined_at: string;
          is_muted: boolean;
          is_pinned: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["conversation_members"]["Row"]> & {
          conversation_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversation_members"]["Row"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          type: "text" | "image" | "video" | "audio" | "file" | "payment" | "location" | "system" | "sticker";
          content: string | null;
          media_url: string | null;
          media_metadata: Json | null;
          reply_to_id: string | null;
          reactions: Json;
          is_deleted: boolean;
          deleted_at: string | null;
          edited_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & {
          conversation_id: string;
          sender_id: string;
          type: Database["public"]["Tables"]["messages"]["Row"]["type"];
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          nickname: string | null;
          is_blocked: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["contacts"]["Row"]> & {
          user_id: string;
          contact_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          conversation_id: string | null;
          amount_cents: number;
          currency: string;
          note: string | null;
          status: "pending" | "processing" | "completed" | "failed" | "refunded" | "cancelled";
          stripe_payment_intent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          sender_id: string;
          receiver_id: string;
          amount_cents: number;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Convenience types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationMember = Database["public"]["Tables"]["conversation_members"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];

// Enriched types
export type ConversationWithMembers = Conversation & {
  members: (ConversationMember & { user: User })[];
  last_message?: Message;
  unread_count?: number;
};

export type MessageWithSender = Message & {
  sender: User;
  reply_to?: Message & { sender: User };
};
