import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ProjectStatus } from '@/types';

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
];

export function projectStatusLabel(status: ProjectStatus): string {
    return PROJECT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function ProjectStatusSelect({
    value,
    onValueChange,
    className,
    disabled,
}: {
    value: ProjectStatus;
    onValueChange: (status: ProjectStatus) => void;
    className?: string;
    disabled?: boolean;
}) {
    return (
        <Select
            value={value}
            onValueChange={(v) => onValueChange(v as ProjectStatus)}
            disabled={disabled}
        >
            <SelectTrigger className={className}>
                <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
                {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                        {status.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
