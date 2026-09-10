import type { ProjectType } from '@/types/projects';

export type PortfolioSectionKind =
    | 'hero'
    | 'stats'
    | 'map'
    | 'gallery'
    | 'testimonials'
    | 'company_info'
    | 'custom_text';

export type PortfolioSummary = {
    id: number;
    year: number;
    title: string | null;
    hero_url: string | null;
    is_published: boolean;
    share_url: string | null;
    photos_count: number;
    testimonials_count: number;
    completed_count: number;
};

export type PortfolioDetail = {
    id: number;
    year: number;
    title: string | null;
    intro: string | null;
    hero_url: string | null;
    is_published: boolean;
    share_slug: string;
    share_url: string;
};

export type PortfolioSectionAdmin = {
    id: number;
    type: PortfolioSectionKind;
    label: string;
    title: string | null;
    body: string | null;
    sort_order: number;
    is_visible: boolean;
    is_deletable: boolean;
};

export type PortfolioPhoto = {
    id: number;
    url: string;
    caption: string | null;
    sort_order?: number;
};

export type PortfolioTestimonial = {
    id: number;
    author_name: string;
    author_role: string | null;
    quote: string;
    photo_url: string | null;
};

export type PortfolioStats = {
    completed_count: number;
    ongoing_count: number;
    sqft_covered: number;
    type_breakdown: Partial<Record<ProjectType | 'uncategorized', number>>;
};

export type PortfolioMapPin = {
    id: number;
    name: string;
    type: ProjectType | null;
    latitude: number;
    longitude: number;
};

export type PublicPortfolioSection = {
    id: number;
    type: PortfolioSectionKind;
    title: string | null;
    body: string | null;
};

export type PortfolioMeta = {
    title: string;
    description: string;
    image: string | null;
};
