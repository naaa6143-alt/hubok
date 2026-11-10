import { router } from "./trpc.js";
import { authRouter } from "./routers/auth.js";
import { siteRouter } from "./routers/site.js";
import { applicantsRouter } from "./routers/applicants.js";
import { coursesRouter } from "./routers/courses.js";
import { circlesRouter } from "./routers/circles.js";
import { distributionRouter } from "./routers/distribution.js";
import { attendanceRouter } from "./routers/attendance.js";
import { progressRouter } from "./routers/progress.js";
import { curriculaRouter } from "./routers/curricula.js";
import { teamRouter } from "./routers/team.js";
import { reportsRouter } from "./routers/reports.js";
import { certificatesRouter } from "./routers/certificates.js";
import { dashboardRouter } from "./routers/dashboard.js";

export const appRouter = router({
  auth: authRouter, site: siteRouter, applicants: applicantsRouter, courses: coursesRouter, circles: circlesRouter,
  distribution: distributionRouter, attendance: attendanceRouter, progress: progressRouter, curricula: curriculaRouter,
  team: teamRouter, reports: reportsRouter, certificates: certificatesRouter, dashboard: dashboardRouter,
});
export type AppRouter = typeof appRouter;
