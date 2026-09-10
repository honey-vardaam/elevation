import { useState } from 'react';
import { Check, Copy, Facebook, Linkedin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function XIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
            <path d="M18.9 2H22l-7.6 8.7L23.3 22H16.6l-5.2-6.8L5.4 22H2.3l8.1-9.3L1.7 2h6.9l4.7 6.2L18.9 2Zm-1.2 18h1.7L6.4 4H4.6l13.1 16Z" />
        </svg>
    );
}

export function SharePanel({
    shareUrl,
    title,
}: {
    shareUrl: string;
    title: string;
}) {
    const [copied, setCopied] = useState(false);

    async function copyLink() {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    const links = [
        {
            label: 'Facebook',
            icon: Facebook,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        },
        {
            label: 'X',
            icon: XIcon,
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        },
        {
            label: 'LinkedIn',
            icon: Linkedin,
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        },
        {
            label: 'WhatsApp',
            icon: MessageCircle,
            href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
        },
    ];

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={copyLink}>
                    {copied ? (
                        <Check className="size-4" />
                    ) : (
                        <Copy className="size-4" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                    <Button key={link.label} variant="outline" size="sm" asChild>
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                            <link.icon className="size-4" />
                            {link.label}
                        </a>
                    </Button>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                >
                    Copy link for Instagram
                </Button>
            </div>
            <p className="text-muted-foreground text-xs">
                Instagram doesn't support sharing a link directly - copy the
                link above and paste it into your bio or a story.
            </p>
        </div>
    );
}
