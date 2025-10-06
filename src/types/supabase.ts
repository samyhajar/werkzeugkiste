export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          attempt_id: string
          option_id: string
          question_id: string
        }
        Insert: {
          attempt_id: string
          option_id: string
          question_id: string
        }
        Update: {
          attempt_id?: string
          option_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          id: string
          issued_at: string | null
          meta: Json | null
          module_id: string
          name_used: string | null
          pdf_url: string
          show_name: boolean | null
          user_id: string
        }
        Insert: {
          id?: string
          issued_at?: string | null
          meta?: Json | null
          module_id: string
          name_used?: string | null
          pdf_url: string
          show_name?: boolean | null
          user_id: string
        }
        Update: {
          id?: string
          issued_at?: string | null
          meta?: Json | null
          module_id?: string
          name_used?: string | null
          pdf_url?: string
          show_name?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          admin_id: string | null
          created_at: string | null
          description: string | null
          hero_image: string | null
          id: string
          legacy_id: string | null
          module_id: string | null
          order: number | null
          slug: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          legacy_id?: string | null
          module_id?: string | null
          order?: number | null
          slug?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          legacy_id?: string | null
          module_id?: string | null
          order?: number | null
          slug?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      digi_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          image_url: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      digi_resource_slides: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          resource_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          resource_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          resource_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digi_resource_slides_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "digi_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      digi_resources: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          sort_order: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "digi_resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "digi_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      enhanced_quiz_attempts: {
        Row: {
          finished_at: string | null
          id: string
          meta: Json | null
          passed: boolean | null
          quiz_id: string
          raw_answers: Json | null
          score_percent: number | null
          score_points: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          finished_at?: string | null
          id?: string
          meta?: Json | null
          passed?: boolean | null
          quiz_id: string
          raw_answers?: Json | null
          score_percent?: number | null
          score_points?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          finished_at?: string | null
          id?: string
          meta?: Json | null
          passed?: boolean | null
          quiz_id?: string
          raw_answers?: Json | null
          score_percent?: number | null
          score_points?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enhanced_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "enhanced_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enhanced_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_details"
            referencedColumns: ["id"]
          },
        ]
      }
      enhanced_quizzes: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          feedback_mode:
            | Database["public"]["Enums"]["quiz_feedback_mode"]
            | null
          id: string
          legacy_id: string | null
          lesson_id: string | null
          max_points: number | null
          pass_percent: number | null
          scope: Database["public"]["Enums"]["quiz_scope"]
          settings: Json | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          feedback_mode?:
            | Database["public"]["Enums"]["quiz_feedback_mode"]
            | null
          id?: string
          legacy_id?: string | null
          lesson_id?: string | null
          max_points?: number | null
          pass_percent?: number | null
          scope: Database["public"]["Enums"]["quiz_scope"]
          settings?: Json | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          feedback_mode?:
            | Database["public"]["Enums"]["quiz_feedback_mode"]
            | null
          id?: string
          legacy_id?: string | null
          lesson_id?: string | null
          max_points?: number | null
          pass_percent?: number | null
          scope?: Database["public"]["Enums"]["quiz_scope"]
          settings?: Json | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enhanced_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enhanced_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      income_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          emoji: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          emoji: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      legacy_course_mapping: {
        Row: {
          legacy_id: string
          new_id: string
        }
        Insert: {
          legacy_id: string
          new_id: string
        }
        Update: {
          legacy_id?: string
          new_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_course_mapping_new_id_fkey"
            columns: ["new_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_lesson_mapping: {
        Row: {
          legacy_id: string
          new_id: string | null
        }
        Insert: {
          legacy_id: string
          new_id?: string | null
        }
        Update: {
          legacy_id?: string
          new_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legacy_lesson_mapping_new_id_fkey"
            columns: ["new_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          last_viewed_at: string | null
          lesson_id: string
          progress_percent: number | null
          reward_reason: string | null
          student_id: string
          xp_awarded: number | null
        }
        Insert: {
          completed_at?: string | null
          last_viewed_at?: string | null
          lesson_id: string
          progress_percent?: number | null
          reward_reason?: string | null
          student_id: string
          xp_awarded?: number | null
        }
        Update: {
          completed_at?: string | null
          last_viewed_at?: string | null
          lesson_id?: string
          progress_percent?: number | null
          reward_reason?: string | null
          student_id?: string
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string | null
          created_at: string | null
          id: string
          markdown: string | null
          order: number | null
          sort_order: number | null
          title: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          markdown?: string | null
          order?: number | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          markdown?: string | null
          order?: number | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string | null
          description: string | null
          hero_image: string | null
          id: string
          legacy_id: number | null
          order: number | null
          presenter_materials_content: string | null
          presenter_materials_urls: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          legacy_id?: number | null
          order?: number | null
          presenter_materials_content?: string | null
          presenter_materials_urls?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          legacy_id?: number | null
          order?: number | null
          presenter_materials_content?: string | null
          presenter_materials_urls?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      options: {
        Row: {
          created_at: string | null
          id: string
          is_correct: boolean | null
          option_text: string | null
          question_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          option_text?: string | null
          question_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          option_text?: string | null
          question_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string | null
          id: string
          question: string | null
          quiz_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          question?: string | null
          quiz_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          question?: string | null
          quiz_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answer_html: string
          feedback_html: string | null
          id: string
          is_correct: boolean | null
          legacy_id: string | null
          meta: Json | null
          question_id: string
          sort_order: number | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          answer_html: string
          feedback_html?: string | null
          id?: string
          is_correct?: boolean | null
          legacy_id?: string | null
          meta?: Json | null
          question_id: string
          sort_order?: number | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          answer_html?: string
          feedback_html?: string | null
          id?: string
          is_correct?: boolean | null
          legacy_id?: string | null
          meta?: Json | null
          question_id?: string
          sort_order?: number | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_number: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          passed: boolean | null
          quiz_id: string | null
          score_percentage: number | null
          score_raw: number | null
          started_at: string | null
          student_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string | null
          score_percentage?: number | null
          score_raw?: number | null
          started_at?: string | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string | null
          score_percentage?: number | null
          score_raw?: number | null
          started_at?: string | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          category: string | null
          explanation_html: string | null
          id: string
          legacy_id: string | null
          meta: Json | null
          points: number | null
          question_html: string
          quiz_id: string
          sort_order: number | null
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          category?: string | null
          explanation_html?: string | null
          id?: string
          legacy_id?: string | null
          meta?: Json | null
          points?: number | null
          question_html: string
          quiz_id: string
          sort_order?: number | null
          type: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          category?: string | null
          explanation_html?: string | null
          id?: string
          legacy_id?: string | null
          meta?: Json | null
          points?: number | null
          question_html?: string
          quiz_id?: string
          sort_order?: number | null
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "enhanced_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_details"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          lesson_id: string | null
          pass_pct: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          pass_pct?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          pass_pct?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string | null
          id: string
          note: string | null
          points: number
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note?: string | null
          points: number
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string | null
          points?: number
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      static_pages: {
        Row: {
          content_html: string | null
          content_json: Json | null
          created_at: string
          id: string
          meta: Json | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content_html?: string | null
          content_json?: Json | null
          created_at?: string
          id?: string
          meta?: Json | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content_html?: string | null
          content_json?: Json | null
          created_at?: string
          id?: string
          meta?: Json | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_income_entries: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          is_recurring: boolean | null
          month_year: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          month_year: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          month_year?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_income_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "income_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      wp_answers_raw: {
        Row: {
          answer_html: string | null
          feedback_html: string | null
          id: string
          is_correct: boolean | null
          meta: Json | null
          order: number | null
          question_id: string | null
          sort_order: number | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          answer_html?: string | null
          feedback_html?: string | null
          id: string
          is_correct?: boolean | null
          meta?: Json | null
          order?: number | null
          question_id?: string | null
          sort_order?: number | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          answer_html?: string | null
          feedback_html?: string | null
          id?: string
          is_correct?: boolean | null
          meta?: Json | null
          order?: number | null
          question_id?: string | null
          sort_order?: number | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: []
      }
      wp_questions_raw: {
        Row: {
          category: string | null
          explanation_html: string | null
          id: string
          meta: Json | null
          order: number | null
          points: number | null
          question_html: string | null
          quiz_id: string | null
          sort_order: number | null
          type: string | null
        }
        Insert: {
          category?: string | null
          explanation_html?: string | null
          id: string
          meta?: Json | null
          order?: number | null
          points?: number | null
          question_html?: string | null
          quiz_id?: string | null
          sort_order?: number | null
          type?: string | null
        }
        Update: {
          category?: string | null
          explanation_html?: string | null
          id?: string
          meta?: Json | null
          order?: number | null
          points?: number | null
          question_html?: string | null
          quiz_id?: string | null
          sort_order?: number | null
          type?: string | null
        }
        Relationships: []
      }
      wp_quizzes_raw: {
        Row: {
          course_id: string | null
          description: string | null
          feedback_mode: string | null
          id: string
          lesson_id: string | null
          max_points: number | null
          order: number | null
          pass_percent: number | null
          settings: Json | null
          sort_order: number | null
          title: string | null
        }
        Insert: {
          course_id?: string | null
          description?: string | null
          feedback_mode?: string | null
          id: string
          lesson_id?: string | null
          max_points?: number | null
          order?: number | null
          pass_percent?: number | null
          settings?: Json | null
          sort_order?: number | null
          title?: string | null
        }
        Update: {
          course_id?: string | null
          description?: string | null
          feedback_mode?: string | null
          id?: string
          lesson_id?: string | null
          max_points?: number | null
          order?: number | null
          pass_percent?: number | null
          settings?: Json | null
          sort_order?: number | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      quiz_details: {
        Row: {
          course_id: string | null
          course_title: string | null
          description: string | null
          feedback_mode:
            | Database["public"]["Enums"]["quiz_feedback_mode"]
            | null
          id: string | null
          lesson_id: string | null
          lesson_title: string | null
          max_points: number | null
          pass_percent: number | null
          question_count: number | null
          scope: Database["public"]["Enums"]["quiz_scope"] | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enhanced_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enhanced_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress_with_rewards: {
        Row: {
          completed_at: string | null
          course_title: string | null
          last_viewed_at: string | null
          lesson_id: string | null
          lesson_title: string | null
          progress_percent: number | null
          reward_reason: string | null
          student_id: string | null
          total_xp: number | null
          xp_awarded: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      award_lesson_xp: {
        Args: {
          lesson_uuid: string
          reason?: string
          user_uuid: string
          xp_amount?: number
        }
        Returns: undefined
      }
      award_quiz_xp: {
        Args: {
          quiz_uuid: string
          reason?: string
          user_uuid: string
          xp_amount?: number
        }
        Returns: undefined
      }
      check_module_completion: {
        Args: { p_module_id: string; p_student_id: string }
        Returns: boolean
      }
      create_legacy_mapping: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user_with_profile: {
        Args: {
          confirm_email?: boolean
          user_email: string
          user_password: string
          user_role?: string
        }
        Returns: string
      }
      delete_module_with_cascade: {
        Args: { module_id: string }
        Returns: boolean
      }
      determine_quiz_scope: {
        Args: { course_id_text: string; lesson_id_text: string }
        Returns: Database["public"]["Enums"]["quiz_scope"]
      }
      get_user_total_xp: {
        Args: { user_uuid: string }
        Returns: number
      }
      normalize_question_type: {
        Args: { ld_type: string }
        Returns: Database["public"]["Enums"]["question_type"]
      }
      reorder_lessons_in_course: {
        Args: { course_id_param: string }
        Returns: undefined
      }
      reorder_quizzes_in_course: {
        Args: { course_id_param: string }
        Returns: undefined
      }
      transform_raw_answers: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      transform_raw_questions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      transform_raw_quizzes: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_quiz_references: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      validate_quiz_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          details: Json
          issue: string
          quiz_id: string
          quiz_legacy: string
        }[]
      }
    }
    Enums: {
      question_type:
        | "single"
        | "multiple"
        | "true_false"
        | "free_text"
        | "fill_blank"
        | "sorting"
        | "matching"
        | "matrix"
      quiz_feedback_mode: "per_question" | "at_end" | "none"
      quiz_scope: "course" | "lesson"
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
  public: {
    Enums: {
      question_type: [
        "single",
        "multiple",
        "true_false",
        "free_text",
        "fill_blank",
        "sorting",
        "matching",
        "matrix",
      ],
      quiz_feedback_mode: ["per_question", "at_end", "none"],
      quiz_scope: ["course", "lesson"],
    },
  },
} as const
