import { Head } from '@inertiajs/react';
import {
    Building2,
    ChevronDown,
    Mail,
    MapPin,
    Phone,
    Plus,
    Quote,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { SiteMap } from '@/components/portfolio/site-map';
import { StatsStrip } from '@/components/portfolio/stats-strip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useParallax } from '@/hooks/use-parallax';
import { useReveal } from '@/hooks/use-reveal';
import { cn } from '@/lib/utils';
import type {
    CompanyProfile,
    PortfolioMapPin,
    PortfolioMeta,
    PortfolioPhoto,
    PortfolioStats,
    PortfolioTestimonial,
    PublicPortfolioSection,
} from '@/types';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Elevation';

/**
 * An "architectural blueprint" treatment built entirely from the app's own
 * black/white theme tokens (--foreground / --background / --border) rather
 * than a separate accent hue, so it still follows the user's light/dark
 * preference like the rest of the app.
 */
const INK = 'text-foreground';
const LINE = 'text-foreground/20';
const ACCENT = 'text-muted-foreground';

/** Faint drafting-paper grid, ruled in the theme's own foreground color. */
const GRID_PAPER =
    'bg-[linear-gradient(color-mix(in_oklch,var(--foreground)_2%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_2%,transparent)_1px,transparent_1px)] bg-[size:36px_36px] bg-[position:-1px_-1px]';

type PublicPortfolio = {
    year: number;
    title: string | null;
    intro: string | null;
    hero_url: string | null;
    share_url: string;
};

export default function Public({
    portfolio,
    sections,
    stats,
    pins,
    photos,
    testimonials,
    company,
    meta,
}: {
    portfolio: PublicPortfolio;
    sections: PublicPortfolioSection[];
    stats: PortfolioStats;
    pins: PortfolioMapPin[];
    photos: PortfolioPhoto[];
    testimonials: PortfolioTestimonial[];
    company: CompanyProfile;
    meta: PortfolioMeta;
}) {
    const title = portfolio.title ?? `${portfolio.year} Portfolio`;
    const heroSection = sections.find((s) => s.type === 'hero');
    const renderableSections = sections
        .filter((s) => s.type !== 'hero')
        .filter((section) => {
            if (section.type === 'gallery') return photos.length > 0;
            if (section.type === 'testimonials') return testimonials.length > 0;
            if (section.type === 'custom_text')
                return Boolean(section.title || section.body);
            return true;
        });

    return (
        <>
            <Head title={title}>
                <meta name="description" content={meta.description} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:url" content={portfolio.share_url} />
                {meta.image && (
                    <meta property="og:image" content={meta.image} />
                )}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={meta.title} />
                <meta name="twitter:description" content={meta.description} />
                {meta.image && (
                    <meta name="twitter:image" content={meta.image} />
                )}
            </Head>

            <div className={cn('bg-background min-h-screen', GRID_PAPER, INK)}>
                {heroSection && <Hero portfolio={portfolio} title={title} />}

                {renderableSections.map((section, index) => (
                    <PortfolioSection
                        key={section.id}
                        section={section}
                        sheet={index + 1}
                        stats={stats}
                        pins={pins}
                        photos={photos}
                        testimonials={testimonials}
                        company={company}
                    />
                ))}

                <Footer
                    year={portfolio.year}
                    sheetCount={renderableSections.length}
                />
            </div>
        </>
    );
}

/** Four small L-shaped corner brackets, the framing mark on every drawing sheet. */
function CornerMarks({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'pointer-events-none absolute inset-3 z-10',
                className,
            )}
            aria-hidden="true"
        >
            <span className="absolute top-0 left-0 size-3 border-t border-l border-current" />
            <span className="absolute top-0 right-0 size-3 border-t border-r border-current" />
            <span className="absolute bottom-0 left-0 size-3 border-b border-l border-current" />
            <span className="absolute right-0 bottom-0 size-3 border-r border-b border-current" />
        </div>
    );
}

/** A labeled dimension-line rule, echoing the tick-and-extension-line marks on a dimensioned drawing. */
function DimensionRule({
    label,
    tone = 'light',
    className,
}: {
    label?: string;
    tone?: 'light' | 'dark';
    className?: string;
}) {
    return (
        <div
            className={cn(
                'mx-auto flex max-w-5xl items-center gap-3 px-6',
                tone === 'light' ? LINE : 'text-white/20',
                className,
            )}
            aria-hidden="true"
        >
            <span className="h-2 w-px bg-current" />
            <span className="h-px flex-1 bg-current" />
            {label && (
                <span
                    className={cn(
                        'font-mono text-[10px] tracking-[0.3em] uppercase',
                        tone === 'light' ? ACCENT : 'text-white/70',
                    )}
                >
                    {label}
                </span>
            )}
            <span className="h-px flex-1 bg-current" />
            <span className="h-2 w-px bg-current" />
        </div>
    );
}

function Hero({
    portfolio,
    title,
}: {
    portfolio: PublicPortfolio;
    title: string;
}) {
    const { containerRef, layerRef } = useParallax<
        HTMLDivElement,
        HTMLDivElement
    >(0.18);

    return (
        <div
            ref={containerRef}
            className="relative flex h-screen min-h-[560px] w-full items-end overflow-hidden bg-black"
        >
            {portfolio.hero_url ? (
                <div
                    ref={layerRef}
                    className="absolute inset-x-0 -top-[12%] h-[124%] w-full"
                >
                    <img
                        src={portfolio.hero_url}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                </div>
            ) : (
                <div
                    ref={layerRef}
                    className="absolute inset-x-0 -top-[12%] h-[124%] w-full bg-gradient-to-b from-neutral-800 to-black"
                />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />
            <div
                className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:56px_56px] mix-blend-overlay"
                aria-hidden="true"
            />

            <div className="relative z-10 m-3 flex-1 self-stretch text-white/40 sm:m-6">
                <CornerMarks />

                <div className="flex h-full items-end px-6 pb-10 sm:px-10 sm:pb-14">
                    <div className="w-full">
                        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-6">
                            <Reveal>
                                <p className="flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-white/70 uppercase">
                                    <Plus className="size-3" />
                                    {portfolio.year} &middot; Sheet 00
                                </p>
                                <h1 className="font-heading mt-4 text-5xl font-semibold tracking-tight text-white sm:text-7xl">
                                    {title}
                                </h1>
                                {portfolio.intro && (
                                    <p className="mt-6 max-w-2xl text-base text-white/75 sm:text-lg">
                                        {portfolio.intro}
                                    </p>
                                )}
                            </Reveal>

                            <div className="hidden shrink-0 rounded border border-white/25 px-4 py-3 font-mono text-[11px] text-white/60 sm:block">
                                <p className="tracking-[0.2em] uppercase">
                                    Drawing No.
                                </p>
                                <p className="mt-1 text-sm text-white">
                                    A-{String(portfolio.year).slice(-2)}.001
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center">
                <ChevronDown className="size-5 animate-bounce text-white/60" />
            </div>
        </div>
    );
}

function Reveal({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    const { ref, visible } = useReveal<HTMLDivElement>();

    return (
        <div
            ref={ref}
            className={cn(
                'transition-all duration-700 ease-out',
                visible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0',
                className,
            )}
        >
            {children}
        </div>
    );
}

function SectionHeading({
    sheet,
    eyebrow,
    title,
}: {
    sheet: number;
    eyebrow?: string;
    title: string;
}) {
    return (
        <div className="flex items-center gap-4 sm:gap-5">
            <span
                className={cn(
                    'shrink-0 font-mono text-6xl leading-none font-semibold tabular-nums',
                    INK,
                )}
            >
                {String(sheet).padStart(2, '0')}
            </span>
            <div className="min-w-0">
                {eyebrow && (
                    <p
                        className={cn(
                            'font-mono text-xs tracking-[0.25em] uppercase',
                            ACCENT,
                        )}
                    >
                        {eyebrow}
                    </p>
                )}
                <h2 className="font-heading mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {title}
                </h2>
            </div>
        </div>
    );
}

function PortfolioSection({
    section,
    sheet,
    stats,
    pins,
    photos,
    testimonials,
    company,
}: {
    section: PublicPortfolioSection;
    sheet: number;
    stats: PortfolioStats;
    pins: PortfolioMapPin[];
    photos: PortfolioPhoto[];
    testimonials: PortfolioTestimonial[];
    company: CompanyProfile;
}) {
    if (section.type === 'stats') {
        return (
            <Reveal className="w-full py-20">
                <div className="mx-auto max-w-5xl px-6">
                    <SectionHeading
                        sheet={sheet}
                        eyebrow="By the numbers"
                        title={section.title ?? 'By the numbers'}
                    />
                    <div className="border-border bg-background/70 mt-12 rounded border p-6">
                        <StatsStrip stats={stats} />
                    </div>
                </div>
            </Reveal>
        );
    }

    if (section.type === 'map') {
        return (
            <Reveal className="w-full py-20">
                <div className="mx-auto max-w-5xl px-6">
                    <SectionHeading
                        sheet={sheet}
                        eyebrow="Site locations"
                        title={section.title ?? 'Where we build'}
                    />
                    <div className="text-foreground/20 relative mt-12">
                        <CornerMarks className="inset-0" />
                        <div className="p-3">
                            <SiteMap pins={pins} height={440} />
                        </div>
                    </div>
                </div>
            </Reveal>
        );
    }

    if (section.type === 'gallery' && photos.length > 0) {
        return (
            <Reveal className="w-full py-20">
                <div className="mx-auto max-w-5xl px-6">
                    <SectionHeading
                        sheet={sheet}
                        eyebrow="Selected work"
                        title={section.title ?? 'Gallery'}
                    />
                </div>
                <div className="mt-12 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
                    {photos.map((photo, i) => (
                        <div
                            key={photo.id}
                            className={cn(
                                'group relative overflow-hidden',
                                i % 5 === 0
                                    ? 'col-span-2 aspect-[16/10]'
                                    : 'aspect-square',
                            )}
                        >
                            <img
                                src={photo.url}
                                alt={photo.caption ?? ''}
                                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                            <span
                                className="pointer-events-none absolute inset-2 border border-white/0 transition-colors duration-500 group-hover:border-white/40"
                                aria-hidden="true"
                            />
                        </div>
                    ))}
                </div>
            </Reveal>
        );
    }

    if (section.type === 'testimonials' && testimonials.length > 0) {
        return (
            <Reveal className="w-full py-20">
                <div className="mx-auto max-w-5xl px-6">
                    <SectionHeading
                        sheet={sheet}
                        eyebrow="Client voices"
                        title={section.title ?? 'What clients say'}
                    />
                    <div className="mt-14 grid gap-12 sm:grid-cols-2">
                        {testimonials.map((testimonial) => (
                            <figure
                                key={testimonial.id}
                                className="border-foreground/20 space-y-4 border-l-2 pl-5"
                            >
                                <Quote className="text-foreground/20 size-8" />
                                <blockquote className="text-lg leading-relaxed">
                                    "{testimonial.quote}"
                                </blockquote>
                                <figcaption className="flex items-center gap-3 pt-2">
                                    <Avatar className="size-10">
                                        {testimonial.photo_url && (
                                            <AvatarImage
                                                src={testimonial.photo_url}
                                            />
                                        )}
                                        <AvatarFallback>
                                            {testimonial.author_name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {testimonial.author_name}
                                        </p>
                                        {testimonial.author_role && (
                                            <p className="text-muted-foreground font-mono text-xs">
                                                {testimonial.author_role}
                                            </p>
                                        )}
                                    </div>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </Reveal>
        );
    }

    if (section.type === 'company_info') {
        return (
            <Reveal className="w-full py-20">
                <div className="mx-auto max-w-2xl px-6">
                    <Avatar className="border-border size-16 rounded border">
                        {company.logo_url && (
                            <AvatarImage
                                src={company.logo_url}
                                className="object-contain"
                            />
                        )}
                        <AvatarFallback className="rounded">
                            <Building2 className="size-6" />
                        </AvatarFallback>
                    </Avatar>
                    {company.name && (
                        <h2 className="font-heading mt-4 text-2xl font-semibold">
                            {company.name}
                        </h2>
                    )}
                    {company.about && (
                        <p className="text-muted-foreground mt-3">
                            {company.about}
                        </p>
                    )}
                    <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-4 font-mono text-xs">
                        {company.address && (
                            <span className="flex items-center gap-1.5">
                                <MapPin className="size-3.5" />
                                {company.address}
                            </span>
                        )}
                        {company.phone && (
                            <span className="flex items-center gap-1.5">
                                <Phone className="size-3.5" />
                                {company.phone}
                            </span>
                        )}
                        {company.email && (
                            <span className="flex items-center gap-1.5">
                                <Mail className="size-3.5" />
                                {company.email}
                            </span>
                        )}
                    </div>
                </div>
            </Reveal>
        );
    }

    if (section.type === 'custom_text' && (section.title || section.body)) {
        return (
            <Reveal className="w-full py-16">
                {section.title && (
                    <div className="mx-auto max-w-5xl px-6">
                        <SectionHeading sheet={sheet} title={section.title} />
                    </div>
                )}
                {section.body && (
                    <div className="mx-auto max-w-2xl px-6">
                        <p className="text-muted-foreground mt-4 leading-relaxed whitespace-pre-line">
                            {section.body}
                        </p>
                    </div>
                )}
            </Reveal>
        );
    }

    return null;
}

function Footer({ year, sheetCount }: { year: number; sheetCount: number }) {
    return (
        <footer className="w-full border-t border-white/15 bg-black py-16 text-white">
            <div className="mx-auto max-w-md px-6">
                <DimensionRule
                    label={`${sheetCount + 1} sheets`}
                    tone="dark"
                    className="px-0"
                />

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-white/50">
                    <span>Rev. {year}</span>
                    <span className="flex items-center gap-1.5 text-white/70">
                        Crafted with
                        <span className="font-semibold tracking-tight text-white">
                            {APP_NAME}
                        </span>
                    </span>
                </div>
            </div>
        </footer>
    );
}
