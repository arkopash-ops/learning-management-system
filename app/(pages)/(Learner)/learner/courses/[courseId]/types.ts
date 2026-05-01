export interface LessonResource {
  type: string;
  label: string;
  url: string;
}

export interface LearnerLessonProgress {
  videoWatchedInSeconds: number;
  lastPositionSec: number;
  isCompleted: boolean;
}

export interface LessonItem {
  _id: string;
  title: string;
  description?: string;
  order: number;
  videoUrl?: string;
  videoDurationSec?: number;
  readingContent?: string;
  resources?: LessonResource[];
  progress?: LearnerLessonProgress | null;
}

export interface ModuleItem {
  _id: string;
  title: string;
  description?: string;
  order: number;
  totalLessons: number;
  lessons: LessonItem[];
}

export interface CourseDetail {
  _id: string;
  title: string;
  description?: string;
  tags?: string[];
  totalModules: number;
  totalLessons: number;
  instructorId: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface InstructorProfile {
  bio?: string;
  subjects?: string[];
  education?: { degree: string; institution: string; year: string }[];
}

export interface OverviewData {
  course: CourseDetail;
  instructorProfile: InstructorProfile | null;
  modules: ModuleItem[];
}

export interface EnrollmentCourseRef {
  _id: string;
  title?: string;
}

export interface EnrollmentItem {
  _id: string;
  courseId: string | EnrollmentCourseRef;
  unlockedModules: string[];
  completedModules: string[];
  progressPercent: number;
}

export interface MyEnrollmentsData {
  enrollments: EnrollmentItem[];
}

export interface CourseContentData {
  enrollment: EnrollmentItem;
  modules: ModuleItem[];
}

export type LearnerLesson = LessonItem;

export interface LearnerModule {
  _id: string;
  title: string;
  description?: string;
  order: number;
  lessons: LearnerLesson[];
}
