import { Head, setLayoutProps } from '@inertiajs/react';
import { useLayoutEffect, useState } from 'react';
import { Contact, MoreHorizontal } from 'lucide-react';
import { EditClientDialog } from '@/components/clients/edit-client-dialog';
import { NewClientDialog } from '@/components/clients/new-client-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { EmptyState } from '@/components/empty-state';
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
import { destroy, index } from '@/routes/clients';
import type { ClientSummary, Paginated } from '@/types';

export default function Index({
    clients,
}: {
    clients: Paginated<ClientSummary>;
}) {
    const [editing, setEditing] = useState<ClientSummary | null>(null);
    const [deleting, setDeleting] = useState<ClientSummary | null>(null);

    useLayoutEffect(() => {
        setLayoutProps({ headerAction: <NewClientDialog /> });
    }, []);

    return (
        <>
            <Head title="Clients" />

            <h1 className="sr-only">Clients</h1>

            <div className="flex h-[calc(100svh-4rem)] flex-col gap-4 p-4">
                {clients.data.length === 0 ? (
                    <EmptyState
                        icon={Contact}
                        message="No clients yet. Add one to keep their details on hand."
                    />
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 z-10">
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.data.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">
                                            {client.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {client.company ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {client.email ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {client.phone ?? '—'}
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
                                                            Client actions
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            setEditing(client)
                                                        }
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onSelect={() =>
                                                            setDeleting(client)
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

                {clients.data.length > 0 && (
                    <div className="bg-background sticky bottom-0 shrink-0 border-t px-1 pt-3">
                        <Pagination
                            links={clients.links}
                            from={clients.from}
                            to={clients.to}
                            total={clients.total}
                            perPage={clients.per_page}
                        />
                    </div>
                )}
            </div>

            {editing && (
                <EditClientDialog
                    client={editing}
                    open
                    onOpenChange={(open) => !open && setEditing(null)}
                />
            )}

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete client?"
                description={
                    <>
                        This permanently removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>
                        's details. This cannot be undone.
                    </>
                }
                confirmLabel="Delete client"
                formAction={deleting ? destroy.form(deleting.id) : undefined}
                onSuccess={() => setDeleting(null)}
            />
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Clients', href: index() }],
};
