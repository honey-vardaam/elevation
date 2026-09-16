import { Head, setLayoutProps } from '@inertiajs/react';
import { useLayoutEffect, useState } from 'react';
import { MoreHorizontal, Users as UsersIcon } from 'lucide-react';
import { EditUserDialog } from '@/components/users/edit-user-dialog';
import { NewUserDialog } from '@/components/users/new-user-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { destroy, index } from '@/routes/users';
import type { Paginated, UserSummary } from '@/types';

export default function Index({ users }: { users: Paginated<UserSummary> }) {
    const [editing, setEditing] = useState<UserSummary | null>(null);
    const [deleting, setDeleting] = useState<UserSummary | null>(null);

    useLayoutEffect(() => {
        setLayoutProps({ headerAction: <NewUserDialog /> });
    }, []);

    return (
        <>
            <Head title="Team" />

            <h1 className="sr-only">Team</h1>

            <div className="flex h-[calc(100svh-4rem)] flex-col gap-4 p-4">
                {users.data.length === 0 ? (
                    <EmptyState icon={UsersIcon} message="No users yet." />
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 z-10">
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="capitalize"
                                            >
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                        <span className="sr-only">
                                                            User actions
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            setEditing(user)
                                                        }
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onSelect={() =>
                                                            setDeleting(user)
                                                        }
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {users.data.length > 0 && (
                    <div className="bg-background sticky bottom-0 shrink-0 border-t px-1 pt-3">
                        <Pagination
                            links={users.links}
                            from={users.from}
                            to={users.to}
                            total={users.total}
                            perPage={users.per_page}
                        />
                    </div>
                )}
            </div>

            {editing && (
                <EditUserDialog
                    user={editing}
                    open
                    onOpenChange={(open) => !open && setEditing(null)}
                />
            )}

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete user?"
                description={
                    <>
                        This permanently removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>
                        's account and their access to every project. This
                        cannot be undone.
                    </>
                }
                confirmLabel="Delete user"
                formAction={deleting ? destroy.form(deleting.id) : undefined}
                onSuccess={() => setDeleting(null)}
            />
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Team', href: index() }],
};
