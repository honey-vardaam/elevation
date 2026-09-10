import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ProjectMemberSummary } from '@/types';

type MemberRole = ProjectMemberSummary['role'];

export function MemberRoleSelect({
    name,
    defaultValue,
    value,
    onValueChange,
    disabled,
}: {
    name?: string;
    defaultValue?: MemberRole;
    value?: MemberRole;
    onValueChange?: (value: MemberRole) => void;
    disabled?: boolean;
}) {
    return (
        <Select
            name={name}
            defaultValue={defaultValue}
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
        >
            <SelectTrigger>
                <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
        </Select>
    );
}
