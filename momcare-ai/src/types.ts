export type PageId =
  | 'home'
  | 'about'
  | 'services'
  | 'pregnancy-tracker'
  | 'baby-development'
  | 'ai-assistant'
  | 'nutrition'
  | 'doctors'
  | 'appointments'
  | 'reminders'
  | 'community'
  | 'postpartum'
  | 'auth'
  | 'profile'
  | 'admin';

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  role: 'patient' | 'admin' | 'doctor' | string;
  fullName: string;
  age: number | null;
  pregnancyWeek: number | null;
  lmpDate: string | null;
  expectedDeliveryDate: string | null;
  bloodGroup: string | null;
  medicalHistory: string | null;
  dietPreference: 'vegetarian' | 'non-vegetarian' | string;
  isActive: boolean;
  createdAt?: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  hospital: string;
  consultationFee: number;
  rating: string;
  languages: string;
  bio: string;
  imageUrl: string;
  availableSlots: string;
  isAvailable: boolean;
}

export interface Appointment {
  id: number;
  userId: number;
  doctorId: number;
  appointmentDate: string;
  timeSlot: string;
  consultationType: string;
  reason: string;
  status: string;
  notes: string | null;
  createdAt: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorHospital?: string;
  doctorImageUrl?: string;
  patientName?: string;
  patientEmail?: string;
}

export interface Reminder {
  id: number;
  userId: number;
  title: string;
  category: string;
  dueDate: string;
  dueTime: string;
  frequency: string;
  notes: string | null;
  completed: boolean;
  createdAt: string;
}

export interface CommunityComment {
  id: number;
  postId: number;
  userId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: number;
  userId: number;
  authorName: string;
  authorWeek: number | null;
  category: string;
  title: string;
  content: string;
  likesCount: number;
  createdAt: string;
  comments: CommunityComment[];
}

export interface PostpartumLog {
  id: number;
  userId: number;
  logDate: string;
  mood: string;
  sleepHours: string;
  feedingCount: number;
  painLevel: number;
  notes: string | null;
  createdAt: string;
}

export interface AdminOverview {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalDoctors: number;
    totalAppointments: number;
  };
  users: UserProfile[];
  doctors: Doctor[];
  appointments: Appointment[];
  posts: Array<{
    id: number;
    userId: number;
    authorName: string;
    authorWeek: number | null;
    category: string;
    title: string;
    content: string;
    likesCount: number;
    createdAt: string;
  }>;
}
