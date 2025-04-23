export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_keys: {
        Row: {
          agent_id: number
          created_at: string
          id: number
          key_data: string
          updated_at: string
        }
        Insert: {
          agent_id: number
          created_at?: string
          id?: number
          key_data: string
          updated_at?: string
        }
        Update: {
          agent_id?: number
          created_at?: string
          id?: number
          key_data?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_keys_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          agent_id: number
          created_at: string
          id: number
          message: Json
          message_type: string | null
          pvp_status_effects: Json | null
          room_id: number
          round_id: number
          updated_at: string
        }
        Insert: {
          agent_id: number
          created_at?: string
          id?: number
          message: Json
          message_type?: string | null
          pvp_status_effects?: Json | null
          room_id: number
          round_id: number
          updated_at?: string
        }
        Update: {
          agent_id?: number
          created_at?: string
          id?: number
          message?: Json
          message_type?: string | null
          pvp_status_effects?: Json | null
          room_id?: number
          round_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_agent_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_agent_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
<<<<<<< HEAD
          chain_name: Database["public"]["Enums"]["chain_name"]
          character_card: string | null
          created_at: string
          id: number
          key: string
          last_health_check: string | null
          onchain_id: number
          updated_at: string
          wallet_pubkey: string | null
        }
        Insert: {
          chain_name: Database["public"]["Enums"]["chain_name"]
          character_card?: string | null
          created_at?: string
          id?: number
          key: string
          last_health_check?: string | null
          onchain_id: number
          updated_at?: string
          wallet_pubkey?: string | null
        }
        Update: {
          chain_name?: Database["public"]["Enums"]["chain_name"]
          character_card?: string | null
          created_at?: string
          id?: number
          key?: string
          last_health_check?: string | null
          onchain_id?: number
          updated_at?: string
          wallet_pubkey?: string | null
        }
        Relationships: []
      }
      BACKUP_room_agents: {
        Row: {
          agent_id: number
          created_at: string
          id: number
          last_message: string | null
          room_id: number
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          agent_id: number
          created_at?: string
          id?: number
          last_message?: string | null
          room_id: number
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          agent_id?: number
          created_at?: string
          id?: number
          last_message?: string | null
          room_id?: number
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      BACKUP_room_types: {
        Row: {
          ai_chat_fee: number
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          ai_chat_fee?: number
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          ai_chat_fee?: number
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      BACKUP_rooms: {
        Row: {
          active: boolean
          chain_family: string
          chain_id: number
          color: string | null
          contract_address: string | null
          created_at: string
          creator_id: number
          game_master_id: number | null
          id: number
          image_url: string | null
          name: string
          participants: number
          room_config: Json | null
          type_id: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          chain_family: string
          chain_id: number
          color?: string | null
          contract_address?: string | null
          created_at?: string
          creator_id: number
          game_master_id?: number | null
          id?: number
          image_url?: string | null
          name: string
          participants?: number
          room_config?: Json | null
          type_id: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          chain_family?: string
          chain_id?: number
          color?: string | null
          contract_address?: string | null
          created_at?: string
          creator_id?: number
          game_master_id?: number | null
          id?: number
          image_url?: string | null
          name?: string
          participants?: number
          room_config?: Json | null
          type_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      BACKUP_round_agents: {
        Row: {
          agent_id: number
          created_at: string
          id: number
          kicked: boolean
          mute_until: string | null
          outcome: Json | null
          round_id: number
          updated_at: string
        }
        Insert: {
          agent_id: number
          created_at?: string
          id?: number
          kicked?: boolean
          mute_until?: string | null
          outcome?: Json | null
          round_id: number
          updated_at?: string
        }
        Update: {
          agent_id?: number
          created_at?: string
          id?: number
          kicked?: boolean
          mute_until?: string | null
          outcome?: Json | null
          round_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      BACKUP_round_observations: {
        Row: {
          content: Json
          created_at: string
          creator: string | null
          id: number
          observation_type: string
          round_id: number
        }
        Insert: {
          content: Json
          created_at?: string
          creator?: string | null
          id?: number
          observation_type: string
          round_id: number
        }
        Update: {
          content?: Json
          created_at?: string
          creator?: string | null
          id?: number
          observation_type?: string
          round_id?: number
        }
        Relationships: []
      }
      BACKUP_rounds: {
        Row: {
          active: boolean
          created_at: string
          game_master_id: number | null
          id: number
          pvp_status_effects: Json | null
          room_id: number
          round_config: Json | null
          status: Database["public"]["Enums"]["round_status"]
          underlying_contract_round: number | null
          updated_at: string
        }
        Insert: {
          active: boolean
          created_at?: string
          game_master_id?: number | null
          id?: number
          pvp_status_effects?: Json | null
          room_id: number
          round_config?: Json | null
          status?: Database["public"]["Enums"]["round_status"]
          underlying_contract_round?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          game_master_id?: number | null
          id?: number
          pvp_status_effects?: Json | null
          room_id?: number
          round_config?: Json | null
          status?: Database["public"]["Enums"]["round_status"]
          underlying_contract_round?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      BACKUP_users: {
        Row: {
          address: string
          chain_id: string
          created_at: string
          display_name: string | null
          id: number
          updated_at: string
        }
        Insert: {
          address: string
          chain_id: string
          created_at?: string
          display_name?: string | null
          id?: number
          updated_at?: string
        }
        Update: {
          address?: string
          chain_id?: string
          created_at?: string
          display_name?: string | null
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
=======
          character_card: string | null;
          color: string;
          created_at: string;
          creator_id: number;
          display_name: string;
          earnings: number | null;
          endpoint: string;
          eth_wallet_address: string | null;
          id: number;
          image_url: string;
          last_health_check: string | null;
          platform: string;
          single_sentence_summary: string | null;
          sol_wallet_address: string | null;
          status: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          character_card?: string | null;
          color: string;
          created_at?: string;
          creator_id: number;
          display_name: string;
          earnings?: number | null;
          endpoint: string;
          eth_wallet_address?: string | null;
          id?: number;
          image_url: string;
          last_health_check?: string | null;
          platform: string;
          single_sentence_summary?: string | null;
          sol_wallet_address?: string | null;
          status?: string | null;
          type?: string;
          updated_at?: string;
        };
        Update: {
          character_card?: string | null;
          color?: string;
          created_at?: string;
          creator_id?: number;
          display_name?: string;
          earnings?: number | null;
          endpoint?: string;
          eth_wallet_address?: string | null;
          id?: number;
          image_url?: string;
          last_health_check?: string | null;
          platform?: string;
          single_sentence_summary?: string | null;
          sol_wallet_address?: string | null;
          status?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agents_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
>>>>>>> 85321c6 (feat: add pagination to comments and add replies)
      comments: {
        Row: {
          body: string
          commentID: number | null
          created_at: string
          id: number
          pool_id: string
          signature: string
          trump_responded: boolean | null
          updated_at: string | null
          upvotes: number | null
          user_address: string
        }
        Insert: {
          body: string
          commentID?: number | null
          created_at?: string
          id?: number
          pool_id: string
          signature: string
          trump_responded?: boolean | null
          updated_at?: string | null
          upvotes?: number | null
          user_address: string
        }
        Update: {
          body?: string
          commentID?: number | null
          created_at?: string
          id?: number
          pool_id?: string
          signature?: string
          trump_responded?: boolean | null
          updated_at?: string | null
          upvotes?: number | null
          user_address?: string
        }
        Relationships: []
      }
      facts: {
        Row: {
          comment_id: number | null
          created_at: string
          id: number
          pool_id: string
          user_id: string
        }
        Insert: {
          comment_id?: number | null
          created_at?: string
          id?: number
          pool_id: string
          user_id: string
        }
        Update: {
          comment_id?: number | null
          created_at?: string
          id?: number
          pool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facts_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      ORIGINAL_agents: {
        Row: {
          character_card: string | null
          color: string
          created_at: string
          creator_id: number
          display_name: string
          earnings: number | null
          endpoint: string
          eth_wallet_address: string | null
          id: number
          image_url: string
          last_health_check: string | null
          platform: string
          single_sentence_summary: string | null
          sol_wallet_address: string | null
          status: string | null
          type: string
          updated_at: string
        }
        Insert: {
          character_card?: string | null
          color: string
          created_at?: string
          creator_id: number
          display_name: string
          earnings?: number | null
          endpoint: string
          eth_wallet_address?: string | null
          id?: number
          image_url: string
          last_health_check?: string | null
          platform: string
          single_sentence_summary?: string | null
          sol_wallet_address?: string | null
          status?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          character_card?: string | null
          color?: string
          created_at?: string
          creator_id?: number
          display_name?: string
          earnings?: number | null
          endpoint?: string
          eth_wallet_address?: string | null
          id?: number
          image_url?: string
          last_health_check?: string | null
          platform?: string
          single_sentence_summary?: string | null
          sol_wallet_address?: string | null
          status?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ORIGINAL_agents_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "BACKUP_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ORIGINAL_round_agent_messages: {
        Row: {
          agent_id: number
          created_at: string
          id: number
          message: Json
          message_type: string | null
          original_author: number | null
          pvp_status_effects: Json | null
          round_id: number
          updated_at: string
        }
        Insert: {
          agent_id: number
          created_at?: string
          id?: number
          message: Json
          message_type?: string | null
          original_author?: number | null
          pvp_status_effects?: Json | null
          round_id: number
          updated_at?: string
        }
        Update: {
          agent_id?: number
          created_at?: string
          id?: number
          message?: Json
          message_type?: string | null
          original_author?: number | null
          pvp_status_effects?: Json | null
          round_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      ORIGINAL_round_user_messages: {
        Row: {
          connection_id: string | null
          created_at: string
          id: number
          message: Json | null
          round_id: number
          updated_at: string
          user_id: number | null
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          id?: number
          message?: Json | null
          round_id: number
          updated_at?: string
          user_id?: number | null
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          id?: number
          message?: Json | null
          round_id?: number
          updated_at?: string
          user_id?: number | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          chain_name: Database["public"]["Enums"]["chain_name"]
          created_at: string
          id: number
          key: string
          onchain_id: string
          participants: number
          updated_at: string
        }
        Insert: {
          chain_name: Database["public"]["Enums"]["chain_name"]
          created_at?: string
          id: number
          key: string
          onchain_id: string
          participants?: number
          updated_at?: string
        }
        Update: {
          chain_name?: Database["public"]["Enums"]["chain_name"]
          created_at?: string
          id?: number
          key?: string
          onchain_id?: string
          participants?: number
          updated_at?: string
        }
        Relationships: []
      }
      trump_users: {
        Row: {
          created_at: string
          id: string
          last_login_bonus: string | null
          name: string | null
        }
        Insert: {
          created_at?: string
          id: string
          last_login_bonus?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_login_bonus?: string | null
          name?: string | null
        }
        Relationships: []
      }
      truth_social_posts: {
        Row: {
          chain_id: number
          created_at: string
          image_url: string | null
          json_content: Json | null
          pool_id: string | null
          post_id: string
          prompt_data: Json | null
          string_content: string | null
          transaction_hash: string | null
        }
        Insert: {
          chain_id?: number
          created_at?: string
          image_url?: string | null
          json_content?: Json | null
          pool_id?: string | null
          post_id: string
          prompt_data?: Json | null
          string_content?: string | null
          transaction_hash?: string | null
        }
        Update: {
          chain_id?: number
          created_at?: string
          image_url?: string | null
          json_content?: Json | null
          pool_id?: string | null
          post_id?: string
          prompt_data?: Json | null
          string_content?: string | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          connection_id: string
          created_at: string
          id: number
          message: Json | null
          room_id: number
          round_id: number
          updated_at: string
          user_pubkey: string | null
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: number
          message?: Json | null
          room_id: number
          round_id: number
          updated_at?: string
          user_pubkey?: string | null
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: number
          message?: Json | null
          room_id?: number
          round_id?: number
          updated_at?: string
          user_pubkey?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "round_user_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: number
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: number
        }
        Relationships: []
      }
      wallets: {
        Row: {
          chat_id: number | null
          created_at: string
          eth_address: string | null
          id: number
          tg_id: number | null
          wallet_id: string | null
        }
        Insert: {
          chat_id?: number | null
          created_at?: string
          eth_address?: string | null
          id?: number
          tg_id?: number | null
          wallet_id?: string | null
        }
        Update: {
          chat_id?: number | null
          created_at?: string
          eth_address?: string | null
          id?: number
          tg_id?: number | null
          wallet_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_round_from_room: {
        Args: { room_id_param: number; underlying_contract_round: number }
        Returns: {
          id: number
          room_id: number
          active: boolean
          status: Database["public"]["Enums"]["round_status"]
          round_config: Json
          created_at: string
          updated_at: string
        }[]
      }
      get_active_rooms_needing_rounds: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          active: boolean
          contract_address: string
          chain_id: number
          room_config: Json
        }[]
      }
      get_active_rounds_to_close: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          active: boolean
          room_config: Json
          room_id: number
          contract_address: string
          chain_id: number
        }[]
      }
      get_round_agents: {
        Args: { round_id_param: number }
        Returns: {
          agent_id: number
          wallet_address: string
        }[]
      }
      json_matches_schema: {
        Args: { schema: Json; instance: Json }
        Returns: boolean
      }
      jsonb_matches_schema: {
        Args: { schema: Json; instance: Json }
        Returns: boolean
      }
      jsonschema_is_valid: {
        Args: { schema: Json }
        Returns: boolean
      }
      jsonschema_validation_errors: {
        Args: { schema: Json; instance: Json }
        Returns: string[]
      }
    }
    Enums: {
      chain_name:
        | "solana-devnet"
        | "solana-mainnet"
        | "solana-localnet"
        | "base-sepolia"
      chain_type: "evm" | "solana"
      round_status: "STARTING" | "CLOSING" | "OPEN" | "CLOSED" | "CANCELLED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      chain_name: [
        "solana-devnet",
        "solana-mainnet",
        "solana-localnet",
        "base-sepolia",
      ],
      chain_type: ["evm", "solana"],
      round_status: ["STARTING", "CLOSING", "OPEN", "CLOSED", "CANCELLED"],
    },
  },
} as const
