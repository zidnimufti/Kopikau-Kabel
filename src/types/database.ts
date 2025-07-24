export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          created_at: string
          name: string
          description: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          description?: string | null
        }
      }
      products: {
        Row: {
          id: number
          created_at: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          category_id: number
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          category_id: number
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          category_id?: number
        }
      }
      orders: {
        Row: {
          id: number
          created_at: string
          customer_name: string
          total_amount: number
          status: string
          created_by: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          customer_name: string
          total_amount: number
          status?: string
          created_by?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          customer_name?: string
          total_amount?: number
          status?: string
          created_by?: string | null
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number
          quantity: number
          subtotal: number
        }
        Insert: {
          id?: number
          order_id: number
          product_id: number
          quantity: number
          subtotal: number
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number
          quantity?: number
          subtotal?: number
        }
      }
      users: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          role: "admin" | "barista"
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          role?: "admin" | "barista"
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          role?: "admin" | "barista"
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
