export type UserRole = 'owner' | 'staff';

export type UserSummary = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    created_at: string;
};
