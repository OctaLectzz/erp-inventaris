export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          sku: string
          stock: number
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          sku: string
          stock?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sku?: string
          stock?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          note: string
          product_id: string
          quantity: number
          stock_after: number
          stock_before: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
          product_id: string
          quantity: number
          stock_after: number
          stock_before: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          product_id?: string
          quantity?: number
          stock_after?: number
          stock_before?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stock_movements_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { p_user_id: string }
        Returns: string
      }
      record_stock_movement: {
        Args: {
          p_note: string
          p_product_id: string
          p_quantity: number
          p_type: string
        }
        Returns: Json
      }
      record_batch_stock_movements: {
        Args: {
          p_type: string
          p_items: Json
          p_note: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type PublicSchema = Database['public']

export type Tables<TableName extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][TableName]['Row']

export type TablesInsert<TableName extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][TableName]['Insert']

export type TablesUpdate<TableName extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][TableName]['Update']

export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type ProductRow = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type StockMovementRow = Database['public']['Tables']['stock_movements']['Row']
export type StockMovementInsert = Database['public']['Tables']['stock_movements']['Insert']
export type StockMovementUpdate = Database['public']['Tables']['stock_movements']['Update']
