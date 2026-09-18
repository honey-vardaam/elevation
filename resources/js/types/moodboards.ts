export type MoodboardColor =
    | 'yellow'
    | 'pink'
    | 'blue'
    | 'green'
    | 'purple'
    | 'orange'
    | 'gray';

export type ChecklistItem = { id: string; text: string; done: boolean };

export type MoodboardElementData = {
    title?: string;
    text?: string;
    color?: MoodboardColor | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    emoji?: string;
    label?: string;
    path?: string;
    url?: string;
    items?: ChecklistItem[];
};

export type MoodboardElementType =
    | 'checklist'
    | 'note'
    | 'text'
    | 'image'
    | 'sticker'
    | 'section';

export type MoodboardElement = {
    id: string;
    type: MoodboardElementType;
    x: number;
    y: number;
    width: number | null;
    height: number | null;
    z_index: number;
    data: MoodboardElementData;
};

export type MoodboardSummary = {
    id: number;
    title: string;
    project: { id: number; name: string } | null;
    owner: { id: number; name: string };
    items_total: number;
    items_done: number;
    elements_count: number;
    cover_url: string | null;
    updated_at: string;
    can: { update: boolean };
};

export type MoodboardMemberUser = {
    id: number;
    name: string;
    email: string;
};

export type MoodboardProjectMember = {
    id: number;
    role: string;
    user: MoodboardMemberUser;
};

export type MoodboardDetail = {
    id: number;
    title: string;
    project: {
        id: number;
        name: string;
        owner?: MoodboardMemberUser | null;
        members?: MoodboardProjectMember[];
    } | null;
};
