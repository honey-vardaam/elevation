import { Form, Head, Link } from '@inertiajs/react';
import { ExternalLink, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { GalleryManager } from '@/components/portfolio/gallery-manager';
import { HeroEditor } from '@/components/portfolio/hero-editor';
import { SectionList } from '@/components/portfolio/section-list';
import { SharePanel } from '@/components/portfolio/share-panel';
import { SiteMap } from '@/components/portfolio/site-map';
import { StatsStrip } from '@/components/portfolio/stats-strip';
import { TestimonialManager } from '@/components/portfolio/testimonial-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { destroy, index, show } from '@/routes/portfolios';
import type {
    CompanyProfile,
    PortfolioDetail,
    PortfolioMapPin,
    PortfolioPhoto,
    PortfolioSectionAdmin,
    PortfolioStats,
    PortfolioTestimonial,
} from '@/types';

export default function Show({
    portfolio,
    sections,
    photos,
    testimonials,
    stats,
    pins,
    company,
}: {
    portfolio: PortfolioDetail;
    sections: PortfolioSectionAdmin[];
    photos: PortfolioPhoto[];
    testimonials: PortfolioTestimonial[];
    stats: PortfolioStats;
    pins: PortfolioMapPin[];
    company: CompanyProfile;
}) {
    const galleryVisible = sections.some(
        (s) => s.type === 'gallery' && s.is_visible,
    );
    const testimonialsVisible = sections.some(
        (s) => s.type === 'testimonials' && s.is_visible,
    );

    return (
        <>
            <Head title={portfolio.title ?? `${portfolio.year} Portfolio`} />

            <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    {portfolio.is_published ? (
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href={portfolio.share_url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="size-4" />
                                View public page
                            </a>
                        </Button>
                    ) : (
                        <span />
                    )}

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Trash2 className="size-4" />
                                Delete portfolio
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle>Delete this portfolio?</DialogTitle>
                            <p className="text-muted-foreground text-sm">
                                This permanently removes the {portfolio.year}{' '}
                                portfolio, its gallery, and its testimonials.
                                This cannot be undone.
                            </p>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Form {...destroy.form(portfolio.id)}>
                                    {({ processing }) => (
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing}
                                        >
                                            {processing && <Spinner />}
                                            Delete
                                        </Button>
                                    )}
                                </Form>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <HeroEditor portfolio={portfolio} />
                    </CardContent>
                </Card>

                {portfolio.is_published && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Share</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SharePanel
                                shareUrl={portfolio.share_url}
                                title={
                                    portfolio.title ??
                                    `${portfolio.year} Portfolio`
                                }
                            />
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Sections</CardTitle>
                        <p className="text-muted-foreground text-sm">
                            Show, hide, and reorder what appears on the public
                            page. Add your own text sections too.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <SectionList
                            portfolioId={portfolio.id}
                            sections={sections}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Stats & Map</CardTitle>
                        <p className="text-muted-foreground text-sm">
                            Computed automatically from your projects - nothing
                            to edit here.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <StatsStrip stats={stats} />
                        <SiteMap pins={pins} height={260} />
                    </CardContent>
                </Card>

                {galleryVisible && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Gallery</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <GalleryManager
                                portfolioId={portfolio.id}
                                photos={photos}
                            />
                        </CardContent>
                    </Card>
                )}

                {testimonialsVisible && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Testimonials</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TestimonialManager
                                portfolioId={portfolio.id}
                                testimonials={testimonials}
                            />
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Company info</CardTitle>
                        <p className="text-muted-foreground text-sm">
                            Shown at the end of the public page.
                        </p>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-sm">
                        {company.name ? (
                            <p>
                                {company.name}
                                {company.address && ` · ${company.address}`}
                            </p>
                        ) : (
                            <p>
                                Your company profile is empty.{' '}
                                <Link
                                    href="/company"
                                    className="text-foreground underline"
                                >
                                    Fill it in
                                </Link>{' '}
                                so it shows up here.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Show.layout = (page: unknown) => {
    // Inertia calls this twice with different shapes: first with the raw
    // page props (to probe whether it returns an element), then with the
    // actual child element to render - handle both so neither call throws.
    const props = page as
        | {
              portfolio?: PortfolioDetail;
              props?: { portfolio?: PortfolioDetail };
          }
        | undefined;
    const portfolio = props?.props?.portfolio ?? props?.portfolio;

    return (
        <AppLayout
            breadcrumbs={
                portfolio
                    ? [
                          { title: 'Portfolio', href: index() },
                          {
                              title:
                                  portfolio.title ??
                                  `${portfolio.year} Portfolio`,
                              href: show(portfolio.id),
                          },
                      ]
                    : [{ title: 'Portfolio', href: index() }]
            }
        >
            {page as React.ReactNode}
        </AppLayout>
    );
};
