import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center">
                <AppLogoIcon className="text-foreground size-6 fill-current" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="font-poppins mb-0.5 truncate text-base leading-tight font-semibold">
                    {name}
                </span>
            </div>
        </>
    );
}
