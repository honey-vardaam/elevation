export type ProjectRole = 'owner' | 'manager' | 'editor' | 'viewer';

export type ProjectStatus = 'ongoing' | 'on_hold' | 'completed';

export type ProjectType =
    | 'residential'
    | 'commercial'
    | 'institutional'
    | 'industrial'
    | 'renovation'
    | 'interior'
    | 'landscape'
    | 'mixed_use'
    | 'other';

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

type ProjectDetailFields = {
    id: number;
    name: string;
    description: string | null;
    banner_url: string | null;
    client_name: string | null;
    client_email: string | null;
    client_phone: string | null;
    site_address: string | null;
    site_area: number | null;
    latitude: number | null;
    longitude: number | null;
    start_date: string | null;
    end_date: string | null;
    status: ProjectStatus;
    type: ProjectType | null;
    owner: {
        id: number;
        name: string;
    };
    role: ProjectRole;
    can: ProjectAbilities;
};

export type ProjectSummary = ProjectDetailFields & {
    members_count: number;
    folders_count: number;
    files_count: number;
};

export type ProjectDetail = ProjectDetailFields & {
    members: ProjectMemberSummary[];
};

export type AssignableUser = {
    id: number;
    name: string;
    email: string;
};
