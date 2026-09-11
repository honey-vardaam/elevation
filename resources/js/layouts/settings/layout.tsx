import type { PropsWithChildren } from 'react';

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className="p-4">
            <div className="mx-auto max-w-xl space-y-8">{children}</div>
        </div>
    );
}
