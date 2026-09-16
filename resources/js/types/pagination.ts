export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

/** Matches Laravel's `LengthAwarePaginator::toArray()` JSON shape. */
export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};
