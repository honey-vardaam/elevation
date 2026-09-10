export type ProjectRole = 'owner' | 'manager' | 'editor' | 'viewer';

export type ProjectAbilities = {
    update: boolean;
    delete: boolean;
    manageMembers: boolean;
    uploadFiles: boolean;
    createFolders: boolean;
    editItems: boolean;
    deleteItems: boolean;
};

export type ProjectMemberSummary = {
    id: number;
    role: Exclude<ProjectRole, 'owner'>;
    user: {
        id: number;
        name: string;
        email: string;
    };
};

export type ProjectFolderSummary = {
    id: number;
    name: string;
};

export type ProjectFileSummary = {
    id: number;
    name: string;
    size: number;
    mime_type: string | null;
    uploaded_by: {
        id: number;
        name: string;
    };
    created_at: string;
    can: {
        edit: boolean;
        delete: boolean;
    };
    folder?: ProjectFolderSummary | null;
};

export type ProjectSummary = {
    id: number;
    name: string;
    description: string | null;
    owner: {
        id: number;
        name: string;
    };
    role: ProjectRole;
    members_count: number;
    folders_count: number;
    files_count: number;
    can: ProjectAbilities;
};

export type ProjectDetail = {
    id: number;
    name: string;
    description: string | null;
    owner: {
        id: number;
        name: string;
    };
    role: ProjectRole;
    can: ProjectAbilities;
    members: ProjectMemberSummary[];
};
