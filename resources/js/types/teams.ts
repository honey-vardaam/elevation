export type TeamMemberSummary = {
    id: number;
    name: string;
    email: string;
};

export type TeamSummary = {
    id: number;
    name: string;
    description: string | null;
    members: TeamMemberSummary[];
};
