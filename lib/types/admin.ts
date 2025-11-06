// lib/types/admin.ts
export type AdminRecipeRow = {
  id: number;
  title: string;
  slug: string | null;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string; // ISO
  author: { id: number; name: string | null; email: string };
  rejectionReason?: string | null; 
};

export type AdminRecipeList = {
  items: AdminRecipeRow[];
  page: number;
  pageCount: number;
  total: number;
};

export type AdminCommentRow = {
  id: number;
  content: string;
  hidden: boolean;
  createdAt: string; // ISO
  author: { id: number; name: string | null; email: string };
  recipe: { id: number; title: string; slug: string | null };
};

export type AdminCommentList = {
  items: AdminCommentRow[];
  page: number;
  pageCount: number;
  total: number;
};

export type AdminStats = {
  usersTotal: number;
  recipesTotal: number;
  recipesPending: number;
  recipesApproved: number;
  recipesRejected: number;
  commentsTotal: number;
  commentsHidden: number;
  latestPending: Array<{ id: number; title: string; slug: string | null; createdAt: string }>;
};

