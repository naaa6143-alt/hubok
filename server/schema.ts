import { pgTable, pgEnum, serial, integer, varchar, text, timestamp, boolean, date, uniqueIndex, index } from "drizzle-orm/pg-core";

/* الأنواع المعدودة */
export const applicantKind = pgEnum("applicant_kind", ["student", "teacher"]);
export const gender = pgEnum("gender", ["male", "female"]);
export const applicantStatus = pgEnum("applicant_status", ["new", "accepted", "rejected"]);
export const attendanceStatus = pgEnum("attendance_status", ["present", "late", "absent", "excused"]);

const archived = () => timestamp("archived_at", { mode: "date", withTimezone: true });
const created = () => timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull();

export const applicants = pgTable("applicants", {
  id: serial("id").primaryKey(),
  kind: applicantKind("kind").notNull().default("student"),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  guardianPhone: varchar("guardian_phone", { length: 20 }),
  email: varchar("email", { length: 200 }),
  gender: gender("gender"),
  age: integer("age"),
  city: varchar("city", { length: 100 }),
  program: varchar("program", { length: 200 }),
  notes: text("notes"),
  status: applicantStatus("status").notNull().default("new"),
  archivedAt: archived(),
  createdAt: created(),
}, (t) => [
  uniqueIndex("applicants_phone_kind").on(t.phone, t.kind),
  index("applicants_status_idx").on(t.status, t.kind),
]);

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 200 }),
  phone: varchar("phone", { length: 20 }),
  bio: text("bio"),
  archivedAt: archived(),
  createdAt: created(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 300 }).notNull(),
  createdAt: created(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  tokenHash: varchar("token_hash", { length: 100 }).notNull().unique(),
  adminId: integer("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
  createdAt: created(),
}, (t) => [index("sessions_admin_idx").on(t.adminId)]);

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  isDefault: boolean("is_default").notNull().default(false),
  archivedAt: archived(),
  createdAt: created(),
});

export const curricula = pgTable("curricula", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  archivedAt: archived(),
  createdAt: created(),
});

export const curriculumItems = pgTable("curriculum_items", {
  id: serial("id").primaryKey(),
  curriculumId: integer("curriculum_id").notNull().references(() => curricula.id),
  position: integer("position").notNull().default(0),
  title: varchar("title", { length: 250 }).notNull(),
  description: text("description"),
  archivedAt: archived(),
}, (t) => [index("ci_cur").on(t.curriculumId)]);

export const circles = pgTable("circles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  teacherId: integer("teacher_id").references(() => applicants.id),
  courseId: integer("course_id").references(() => courses.id),
  curriculumId: integer("curriculum_id").references(() => curricula.id),
  capacity: integer("capacity").notNull().default(15),
  archivedAt: archived(),
  createdAt: created(),
}, (t) => [index("ci_teacher").on(t.teacherId), index("ci_course").on(t.courseId), index("ci_curriculum").on(t.curriculumId)]);

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").notNull().references(() => applicants.id),
  circleId: integer("circle_id").notNull().references(() => circles.id),
  archivedAt: archived(),
  createdAt: created(),
}, (t) => [index("en_a").on(t.applicantId), index("en_c").on(t.circleId)]);

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").notNull().references(() => applicants.id),
  circleId: integer("circle_id").notNull().references(() => circles.id),
  date: date("date", { mode: "string" }).notNull(),
  status: attendanceStatus("status").notNull(),
  archivedAt: archived(),
  createdAt: created(),
}, (t) => [uniqueIndex("att_unique").on(t.applicantId, t.circleId, t.date), index("att_date").on(t.date)]);

export const progressRecords = pgTable("progress_records", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").notNull().references(() => applicants.id),
  circleId: integer("circle_id").notNull().references(() => circles.id),
  date: date("date", { mode: "string" }).notNull(),
  portion: varchar("portion", { length: 250 }).notNull(),
  pages: integer("pages").notNull().default(0),
  grade: integer("grade"),
  notes: text("notes"),
  archivedAt: archived(),
  createdAt: created(),
}, (t) => [index("pr_a").on(t.applicantId), index("pr_c").on(t.circleId)]);
