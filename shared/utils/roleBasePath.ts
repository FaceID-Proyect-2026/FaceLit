import { UserRole } from "@/shared/contexts/AuthContext";

export function getRoleBasePath(
  role?: UserRole,
): "/admin" | "/instructor" | "/apprentice" {
  if (role === "INSTRUCTOR") return "/instructor";
  if (role === "APPRENTICE") return "/apprentice";
  return "/admin";
}
