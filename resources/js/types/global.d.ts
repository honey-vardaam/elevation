import type { Auth } from '@/types/auth';
import type { DueReminder } from '@/types/calendar';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            dueReminders: DueReminder[];
            [key: string]: unknown;
        };
    }
}
