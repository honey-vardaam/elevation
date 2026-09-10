import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ProjectType } from '@/types';

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'institutional', label: 'Institutional' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'renovation', label: 'Renovation' },
    { value: 'interior', label: 'Interior' },
    { value: 'landscape', label: 'Landscape' },
    { value: 'mixed_use', label: 'Mixed-Use' },
    { value: 'other', label: 'Other' },
];

export function projectTypeLabel(type: ProjectType | null): string {
    if (type === null) {
        return 'Uncategorized';
    }

    return PROJECT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function ProjectTypeSelect({
    value,
    onValueChange,
    className,
}: {
    value: ProjectType | 'none';
    onValueChange: (type: ProjectType | 'none') => void;
    className?: string;
}) {
    return (
        <Select
            value={value}
            onValueChange={(v) => onValueChange(v as ProjectType | 'none')}
        >
            <SelectTrigger className={className}>
                <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">No type</SelectItem>
                {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                        {type.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
