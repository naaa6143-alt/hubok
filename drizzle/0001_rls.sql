-- تفعيل RLS على كل الجداول بدون سياسات:
-- التطبيق يتصل بدور postgres المباشر (يتجاوز RLS)، بينما واجهة Supabase العامة (anon/authenticated)
-- لا تستطيع قراءة أو تعديل أي بيانات — حماية لبيانات الطلاب وأولياء الأمور.
ALTER TABLE "applicants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "team_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "curricula" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "curriculum_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "circles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "progress_records" ENABLE ROW LEVEL SECURITY;
