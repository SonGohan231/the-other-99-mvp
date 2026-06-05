export const ADMIN_EMAILS: string[] = [
  'adambrdon@gmail.com',
  'arnoldjuhasek@gmail.com',
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
