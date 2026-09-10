import { Head } from '@inertiajs/react';
import { Building2, Mail, MapPin, Phone } from 'lucide-react';
import { SharePanel } from '@/components/portfolio/share-panel';
import { SiteMap } from '@/components/portfolio/site-map';
import { StatsStrip } from '@/components/portfolio/stats-strip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type {
    CompanyProfile,
    PortfolioMapPin,
    PortfolioMeta,
    PortfolioPhoto,
    PortfolioStats,
    PortfolioTestimonial,
    PublicPortfolioSection,
} from '@/types';

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
                <meta
                    name="twitter:description"
                    content={meta.description}
                />
                {meta.image && (
                    <meta name="twitter:image" content={meta.image} />
                )}
            </Head>

            <div className="mx-auto max-w-4xl px-6 py-12">
                {sections.map((section) => (
                    <section key={section.id} className="mb-16 last:mb-0">
                        {section.type === 'hero' && (
                            <div className="space-y-4 text-center">
                                {portfolio.hero_url && (
                                    <img
                                        src={portfolio.hero_url}
                                        alt=""
                                        className="h-80 w-full rounded-2xl object-cover"
                                    />
                                )}
                                <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                                    {portfolio.year}
                                </p>
                                <h1 className="text-4xl font-semibold">
                                    {title}
                                </h1>
                                {portfolio.intro && (
                                    <p className="text-muted-foreground mx-auto max-w-xl">
                                        {portfolio.intro}
                                    </p>
                                )}
                            </div>
                        )}

                        {section.type === 'stats' && (
                            <div>
                                <SectionHeading
                                    title={section.title ?? 'By the numbers'}
                                />
                                <StatsStrip stats={stats} />
                            </div>
                        )}

                        {section.type === 'map' && (
                            <div>
                                <SectionHeading
                                    title={section.title ?? 'Where we built'}
                                />
                                <SiteMap pins={pins} height={360} />
                            </div>
                        )}

                        {section.type === 'gallery' && photos.length > 0 && (
                            <div>
                                <SectionHeading
                                    title={section.title ?? 'Gallery'}
                                />
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {photos.map((photo) => (
                                        <img
                                            key={photo.id}
                                            src={photo.url}
                                            alt={photo.caption ?? ''}
                                            className="aspect-square w-full rounded-lg object-cover"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {section.type === 'testimonials' &&
                            testimonials.length > 0 && (
                                <div>
                                    <SectionHeading
                                        title={
                                            section.title ?? 'What clients say'
                                        }
                                    />
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {testimonials.map((testimonial) => (
                                            <div
                                                key={testimonial.id}
                                                className="rounded-xl border p-4"
                                            >
                                                <p className="text-sm italic">
                                                    "{testimonial.quote}"
                                                </p>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <Avatar className="size-8">
                                                        {testimonial.photo_url && (
                                                            <AvatarImage
                                                                src={
                                                                    testimonial.photo_url
                                                                }
                                                            />
                                                        )}
                                                        <AvatarFallback>
                                                            {testimonial.author_name.charAt(
                                                                0,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {
                                                                testimonial.author_name
                                                            }
                                                        </p>
                                                        {testimonial.author_role && (
                                                            <p className="text-muted-foreground text-xs">
                                                                {
                                                                    testimonial.author_role
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        {section.type === 'company_info' && (
                            <div className="rounded-xl border p-6 text-center">
                                <Avatar className="mx-auto size-14 rounded-lg">
                                    {company.logo_url && (
                                        <AvatarImage
                                            src={company.logo_url}
                                            className="object-contain"
                                        />
                                    )}
                                    <AvatarFallback className="rounded-lg">
                                        <Building2 className="size-6" />
                                    </AvatarFallback>
                                </Avatar>
                                {company.name && (
                                    <h2 className="mt-3 text-xl font-semibold">
                                        {company.name}
                                    </h2>
                                )}
                                {company.about && (
                                    <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm">
                                        {company.about}
                                    </p>
                                )}
                                <div className="text-muted-foreground mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
                                    {company.address && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="size-3.5" />
                                            {company.address}
                                        </span>
                                    )}
                                    {company.phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="size-3.5" />
                                            {company.phone}
                                        </span>
                                    )}
                                    {company.email && (
                                        <span className="flex items-center gap-1">
                                            <Mail className="size-3.5" />
                                            {company.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {section.type === 'custom_text' && (
                            <div>
                                {section.title && (
                                    <SectionHeading title={section.title} />
                                )}
                                {section.body && (
                                    <p className="text-muted-foreground whitespace-pre-line">
                                        {section.body}
                                    </p>
                                )}
                            </div>
                        )}
                    </section>
                ))}

                <div className="border-t pt-8">
                    <SharePanel shareUrl={portfolio.share_url} title={title} />
                </div>
            </div>
        </>
    );
}

function SectionHeading({ title }: { title: string }) {
    return (
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">
            {title}
        </h2>
    );
}
