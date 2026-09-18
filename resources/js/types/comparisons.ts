export type ComparisonMode = 'side_by_side' | 'overlay';

export type ComparisonAnnotationSide = 'left' | 'right' | 'general';

export type ComparisonFileSummary = {
    id: number;
    name: string;
    mime_type: string | null;
    size: number;
    uploaded_by: { id: number; name: string };
    created_at: string;
    view_url: string;
    download_url: string;
    is_image: boolean;
    is_pdf: boolean;
};

export type ComparisonAnnotation = {
    id: number;
    side: ComparisonAnnotationSide;
    x: number | null;
    y: number | null;
    body: string;
    author: { id: number; name: string };
    resolved_at: string | null;
    resolved_by: { id: number; name: string } | null;
    created_at: string;
    replies: ComparisonAnnotation[];
};

export type ComparisonSummary = {
    id: number;
    title: string;
    mode: ComparisonMode;
    project: { id: number; name: string };
    creator: { id: number; name: string };
    left_file: { id: number; name: string; mime_type: string | null } | null;
    right_file: { id: number; name: string; mime_type: string | null } | null;
    is_complete: boolean;
    updated_at: string;
};

export type ComparisonDetail = {
    id: number;
    title: string;
    mode: ComparisonMode;
    project: { id: number; name: string };
    creator: { id: number; name: string };
    created_at: string;
    is_complete: boolean;
    is_previewable: boolean;
    is_overlayable: boolean;
};

export type ComparisonReviewer = { id: number; name: string; email: string };
