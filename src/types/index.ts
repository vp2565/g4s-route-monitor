export type UserRole =
  | "soc_operator"
  | "customer_admin"
  | "customer_user"
  | "field_user"
  | "oem_partner"
  | "g4s_admin";

export interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  customer: string;
  email: string;
  avatarInitials: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "usr-001",
    name: "Nikos Papadopoulos",
    role: "soc_operator",
    roleLabel: "SOC Operator",
    customer: "G4S Telematix",
    email: "n.papadopoulos@g4s.com",
    avatarInitials: "NP",
  },
  {
    id: "usr-002",
    name: "Sarah Mitchell",
    role: "customer_admin",
    roleLabel: "Customer Admin",
    customer: "British American Tobacco",
    email: "s.mitchell@bat.com",
    avatarInitials: "SM",
  },
  {
    id: "usr-003",
    name: "Klaus Weber",
    role: "customer_user",
    roleLabel: "Customer User (Dispatcher)",
    customer: "TechElectronics GmbH",
    email: "k.weber@techelectronics.de",
    avatarInitials: "KW",
  },
  {
    id: "usr-004",
    name: "Dimitra Alexiou",
    role: "field_user",
    roleLabel: "Field User",
    customer: "G4S Telematix",
    email: "d.alexiou@g4s.com",
    avatarInitials: "DA",
  },
  {
    id: "usr-005",
    name: "Jean-Pierre Moreau",
    role: "oem_partner",
    roleLabel: "OEM Partner",
    customer: "PharmaCo Europe",
    email: "jp.moreau@pharmaco.eu",
    avatarInitials: "JM",
  },
  {
    id: "usr-006",
    name: "Elena Konstantinou",
    role: "g4s_admin",
    roleLabel: "G4S Admin",
    customer: "G4S Telematix",
    email: "e.konstantinou@g4s.com",
    avatarInitials: "EK",
  },
];

export const ROLE_COLORS: Record<UserRole, string> = {
  soc_operator: "!bg-[#C8102E] !text-white",
  customer_admin: "!bg-blue-600 !text-white",
  customer_user: "!bg-emerald-600 !text-white",
  field_user: "!bg-gray-700 !text-white",
  oem_partner: "!bg-purple-600 !text-white",
  g4s_admin: "!bg-[#C8102E] !text-white",
};

/** Internal G4S roles get dark (black) theme; external roles get light (white) theme */
export const DARK_THEME_ROLES: UserRole[] = [
  "soc_operator",
  "field_user",
  "g4s_admin",
];

export function isDarkRole(role: UserRole): boolean {
  return DARK_THEME_ROLES.includes(role);
}
