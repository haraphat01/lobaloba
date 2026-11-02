export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line: string
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          phone: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line: string
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      asoebi_event_products: {
        Row: {
          event_id: string
          id: string
          notes: string | null
          package_label: string | null
          price_override: number | null
          product_id: string
          sort_order: number
        }
        Insert: {
          event_id: string
          id?: string
          notes?: string | null
          package_label?: string | null
          price_override?: number | null
          product_id: string
          sort_order?: number
        }
        Update: {
          event_id?: string
          id?: string
          notes?: string | null
          package_label?: string | null
          price_override?: number | null
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "asoebi_event_products_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "asoebi_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asoebi_event_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asoebi_event_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      asoebi_events: {
        Row: {
          collective_delivery_note: string | null
          coordinator_email: string | null
          coordinator_name: string | null
          coordinator_phone: string | null
          cover_image_url: string | null
          created_at: string
          delivery_mode: string
          description: string | null
          event_date: string | null
          event_type: string | null
          expected_guests: number | null
          guest_instructions: string | null
          id: string
          is_published: boolean
          order_deadline: string | null
          quotation_id: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          collective_delivery_note?: string | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          coordinator_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          delivery_mode?: string
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          expected_guests?: number | null
          guest_instructions?: string | null
          id?: string
          is_published?: boolean
          order_deadline?: string | null
          quotation_id?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          collective_delivery_note?: string | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          coordinator_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          delivery_mode?: string
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          expected_guests?: number | null
          guest_instructions?: string | null
          id?: string
          is_published?: boolean
          order_deadline?: string | null
          quotation_id?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asoebi_events_quotation_fk"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      asoebi_guest_orders: {
        Row: {
          created_at: string
          delivery_preference: string
          event_id: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id: string
          order_id: string
        }
        Insert: {
          created_at?: string
          delivery_preference?: string
          event_id: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id?: string
          order_id: string
        }
        Update: {
          created_at?: string
          delivery_preference?: string
          event_id?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asoebi_guest_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "asoebi_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asoebi_guest_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      asoebi_packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          included_services: string[]
          is_active: boolean
          is_quote_based: boolean
          name: string
          price: number | null
          price_note: string | null
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          included_services?: string[]
          is_active?: boolean
          is_quote_based?: boolean
          name: string
          price?: number | null
          price_note?: string | null
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          included_services?: string[]
          is_active?: boolean
          is_quote_based?: boolean
          name?: string
          price?: number | null
          price_note?: string | null
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_bio: string | null
          author_name: string
          category_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_demo: boolean
          published_at: string | null
          reading_minutes: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_bio?: string | null
          author_name?: string
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_demo?: boolean
          published_at?: string | null
          reading_minutes?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_bio?: string | null
          author_name?: string
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_demo?: boolean
          published_at?: string | null
          reading_minutes?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          quantity: number
          variant_id: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          quantity: number
          variant_id: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          quantity?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      collection_products: {
        Row: {
          collection_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          amount: number
          coupon_id: string
          created_at: string
          email: string
          id: string
          order_id: string
          user_id: string | null
        }
        Insert: {
          amount: number
          coupon_id: string
          created_at?: string
          email: string
          id?: string
          order_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          coupon_id?: string
          created_at?: string
          email?: string
          id?: string
          order_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          category_ids: string[]
          code: string
          created_at: string
          description: string | null
          discount_type: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_order_amount: number
          per_customer_limit: number | null
          product_ids: string[]
          starts_at: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          category_ids?: string[]
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_amount?: number
          per_customer_limit?: number | null
          product_ids?: string[]
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value: number
        }
        Update: {
          category_ids?: string[]
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_amount?: number
          per_customer_limit?: number | null
          product_ids?: string[]
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          quantity: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          id?: string
          quantity?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          id?: string
          quantity?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirm_token: string
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          source: string | null
          status: string
        }
        Insert: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          source?: string | null
          status?: string
        }
        Update: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          audience: string
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          colour: string | null
          created_at: string
          id: string
          image_url: string | null
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          product_slug: string | null
          quantity: number
          unit_label: string
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          colour?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          product_slug?: string | null
          quantity: number
          unit_label: string
          unit_price: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          colour?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_slug?: string | null
          quantity?: number
          unit_label?: string
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_token: string
          admin_notes: string | null
          asoebi_event_id: string | null
          cancelled_at: string | null
          carrier: string | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          currency: string
          delivery_instructions: string | null
          discount_total: number
          email: string
          full_name: string
          id: string
          order_number: string
          paid_at: string | null
          payment_status: string
          phone: string
          quotation_id: string | null
          shipping_address: Json
          shipping_method: string | null
          shipping_rate_id: string | null
          shipping_requires_quote: boolean
          shipping_total: number
          source: string
          status: string
          stock_deducted: boolean
          subtotal: number
          total: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string
          admin_notes?: string | null
          asoebi_event_id?: string | null
          cancelled_at?: string | null
          carrier?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          delivery_instructions?: string | null
          discount_total?: number
          email: string
          full_name: string
          id?: string
          order_number?: string
          paid_at?: string | null
          payment_status?: string
          phone: string
          quotation_id?: string | null
          shipping_address?: Json
          shipping_method?: string | null
          shipping_rate_id?: string | null
          shipping_requires_quote?: boolean
          shipping_total?: number
          source?: string
          status?: string
          stock_deducted?: boolean
          subtotal: number
          total: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string
          admin_notes?: string | null
          asoebi_event_id?: string | null
          cancelled_at?: string | null
          carrier?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          delivery_instructions?: string | null
          discount_total?: number
          email?: string
          full_name?: string
          id?: string
          order_number?: string
          paid_at?: string | null
          payment_status?: string
          phone?: string
          quotation_id?: string | null
          shipping_address?: Json
          shipping_method?: string | null
          shipping_rate_id?: string | null
          shipping_requires_quote?: boolean
          shipping_total?: number
          source?: string
          status?: string
          stock_deducted?: boolean
          subtotal?: number
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_asoebi_event_id_fkey"
            columns: ["asoebi_event_id"]
            isOneToOne: false
            referencedRelation: "asoebi_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_rate_id_fkey"
            columns: ["shipping_rate_id"]
            isOneToOne: false
            referencedRelation: "shipping_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_key: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          reference: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_key: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider?: string
          reference?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_key?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          reference?: string | null
          status?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          card_brand: string | null
          card_last4: string | null
          channel: string | null
          created_at: string
          currency: string
          gateway_response: string | null
          id: string
          order_id: string
          paid_at: string | null
          provider: string
          reference: string
          status: string
          updated_at: string
          verified_via: string | null
        }
        Insert: {
          amount: number
          card_brand?: string | null
          card_last4?: string | null
          channel?: string | null
          created_at?: string
          currency?: string
          gateway_response?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          provider?: string
          reference: string
          status?: string
          updated_at?: string
          verified_via?: string | null
        }
        Update: {
          amount?: number
          card_brand?: string | null
          card_last4?: string | null
          channel?: string | null
          created_at?: string
          currency?: string
          gateway_response?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          provider?: string
          reference?: string
          status?: string
          updated_at?: string
          verified_via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_colours: {
        Row: {
          created_at: string
          hex: string
          id: string
          name: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          hex?: string
          id?: string
          name: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          hex?: string
          id?: string
          name?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_colours_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_colours_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          colour_id: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number
          storage_path: string | null
          url: string
        }
        Insert: {
          alt?: string | null
          colour_id?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          storage_path?: string | null
          url: string
        }
        Update: {
          alt?: string | null
          colour_id?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          storage_path?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_colour_id_fkey"
            columns: ["colour_id"]
            isOneToOne: false
            referencedRelation: "product_colours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          colour_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          price_override: number | null
          product_id: string
          sku: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          colour_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price_override?: number | null
          product_id: string
          sku?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          colour_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price_override?: number | null
          product_id?: string
          sku?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_colour_id_fkey"
            columns: ["colour_id"]
            isOneToOne: false
            referencedRelation: "product_colours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          care_instructions: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          currency: string
          description: string | null
          fabric_type: string | null
          faqs: Json
          id: string
          is_bestseller: boolean
          is_demo: boolean
          is_featured: boolean
          is_new_arrival: boolean
          low_stock_threshold: number
          max_quantity: number | null
          min_quantity: number
          name: string
          price: number
          purchase_unit: string
          sales_count: number
          search_vector: unknown
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          sku: string | null
          slug: string
          status: string
          tags: string[]
          unit_label: string | null
          updated_at: string
        }
        Insert: {
          care_instructions?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          fabric_type?: string | null
          faqs?: Json
          id?: string
          is_bestseller?: boolean
          is_demo?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          low_stock_threshold?: number
          max_quantity?: number | null
          min_quantity?: number
          name: string
          price: number
          purchase_unit?: string
          sales_count?: number
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          status?: string
          tags?: string[]
          unit_label?: string | null
          updated_at?: string
        }
        Update: {
          care_instructions?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          fabric_type?: string | null
          faqs?: Json
          id?: string
          is_bestseller?: boolean
          is_demo?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          low_stock_threshold?: number
          max_quantity?: number | null
          min_quantity?: number
          name?: string
          price?: number
          purchase_unit?: string
          sales_count?: number
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          status?: string
          tags?: string[]
          unit_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          marketing_opt_in: boolean
          phone: string | null
          role_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          marketing_opt_in?: boolean
          phone?: string | null
          role_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          marketing_opt_in?: boolean
          phone?: string | null
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          colour: string | null
          created_at: string
          description: string
          id: string
          line_total: number | null
          notes: string | null
          product_id: string | null
          quantity: number
          quotation_id: string
          sort_order: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          colour?: string | null
          created_at?: string
          description: string
          id?: string
          line_total?: number | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          quotation_id: string
          sort_order?: number
          unit_price?: number
          variant_id?: string | null
        }
        Update: {
          colour?: string | null
          created_at?: string
          description?: string
          id?: string
          line_total?: number | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          quotation_id?: string
          sort_order?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_requests: {
        Row: {
          access_token: string
          admin_notes: string | null
          budget: string | null
          company_name: string | null
          created_at: string
          currency: string
          delivery_fee: number
          delivery_location: string | null
          details: string | null
          discount_amount: number
          email: string
          event_date: string | null
          event_type: string | null
          full_name: string
          guest_count: number | null
          id: string
          needs_availability_check: boolean
          order_id: string | null
          package_id: string | null
          phone: string
          preferred_category: string | null
          preferred_colours: string | null
          quote_message: string | null
          quoted_at: string | null
          reference: string
          request_type: string
          required_quantity: string | null
          responded_at: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
          valid_until: string | null
        }
        Insert: {
          access_token?: string
          admin_notes?: string | null
          budget?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string
          delivery_fee?: number
          delivery_location?: string | null
          details?: string | null
          discount_amount?: number
          email: string
          event_date?: string | null
          event_type?: string | null
          full_name: string
          guest_count?: number | null
          id?: string
          needs_availability_check?: boolean
          order_id?: string | null
          package_id?: string | null
          phone: string
          preferred_category?: string | null
          preferred_colours?: string | null
          quote_message?: string | null
          quoted_at?: string | null
          reference: string
          request_type: string
          required_quantity?: string | null
          responded_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
        }
        Update: {
          access_token?: string
          admin_notes?: string | null
          budget?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string
          delivery_fee?: number
          delivery_location?: string | null
          details?: string | null
          discount_amount?: number
          email?: string
          event_date?: string | null
          event_type?: string | null
          full_name?: string
          guest_count?: number | null
          id?: string
          needs_availability_check?: boolean
          order_id?: string | null
          package_id?: string | null
          phone?: string
          preferred_category?: string | null
          preferred_colours?: string | null
          quote_message?: string | null
          quoted_at?: string | null
          reference?: string
          request_type?: string
          required_quantity?: string | null
          responded_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_requests_order_fk"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_requests_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "asoebi_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count: number
          key: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      restock_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          product_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          product_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_notifications_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      return_requests: {
        Row: {
          admin_response: string | null
          created_at: string
          details: string | null
          id: string
          order_id: string
          reason: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          details?: string | null
          id?: string
          order_id: string
          reason: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          details?: string | null
          id?: string
          order_id?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: string
          is_approved: boolean
          is_verified_purchase: boolean
          product_id: string
          rating: number
          title: string | null
          user_id: string | null
        }
        Insert: {
          author_name: string
          body: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          product_id: string
          rating: number
          title?: string | null
          user_id?: string | null
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          product_id?: string
          rating?: number
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sample_requests: {
        Row: {
          address: string
          colour: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string
          product_id: string | null
          status: string
        }
        Insert: {
          address: string
          colour?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          product_id?: string | null
          status?: string
        }
        Update: {
          address?: string
          colour?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          product_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sample_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          created_at: string
          description: string | null
          fee: number
          free_over: number | null
          id: string
          is_active: boolean
          max_days: number | null
          min_days: number | null
          name: string
          sort_order: number
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fee?: number
          free_over?: number | null
          id?: string
          is_active?: boolean
          max_days?: number | null
          min_days?: number | null
          name: string
          sort_order?: number
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fee?: number
          free_over?: number | null
          id?: string
          is_active?: boolean
          max_days?: number | null
          min_days?: number | null
          name?: string
          sort_order?: number
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rates_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          countries: string[]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          requires_quote: boolean
          sort_order: number
          states: string[]
          updated_at: string
          zone_type: string
        }
        Insert: {
          countries?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          requires_quote?: boolean
          sort_order?: number
          states?: string[]
          updated_at?: string
          zone_type?: string
        }
        Update: {
          countries?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          requires_quote?: boolean
          sort_order?: number
          states?: string[]
          updated_at?: string
          zone_type?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          wishlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      product_listing: {
        Row: {
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          colour_names: string[] | null
          colours: Json | null
          compare_at_price: number | null
          created_at: string | null
          currency: string | null
          fabric_type: string | null
          id: string | null
          images: Json | null
          is_bestseller: boolean | null
          is_demo: boolean | null
          is_featured: boolean | null
          is_new_arrival: boolean | null
          low_stock_threshold: number | null
          name: string | null
          price: number | null
          purchase_unit: string | null
          rating: number | null
          review_count: number | null
          sales_count: number | null
          short_description: string | null
          slug: string | null
          status: string | null
          total_stock: number | null
          unit_label: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_revenue_series: {
        Args: { p_bucket: string; p_from: string; p_to: string }
        Returns: {
          bucket: string
          orders: number
          revenue: number
        }[]
      }
      admin_sales_summary: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      confirm_order_payment: {
        Args: {
          p_amount_minor: number
          p_card_brand: string
          p_card_last4: string
          p_channel: string
          p_currency: string
          p_gateway_response: string
          p_paid_at: string
          p_reference: string
          p_verified_via: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      rate_limit_hit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      refresh_product_search: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      search_products: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          id: string
          rank: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

