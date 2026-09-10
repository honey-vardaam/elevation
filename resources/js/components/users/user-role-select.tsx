import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { UserRole } from '@/types';

export function UserRoleSelect({
    name,
    defaultValue,
}: {
    name: string;
    defaultValue?: UserRole;
}) {
    return (
        <Select name={name} defaultValue={defaultValue}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
        </Select>
    );
}
