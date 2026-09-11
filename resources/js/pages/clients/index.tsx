import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { Contact, MoreHorizontal } from 'lucide-react';
import { EditClientDialog } from '@/components/clients/edit-client-dialog';
import { NewClientDialog } from '@/components/clients/new-client-dialog';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { destroy, index } from '@/routes/clients';
import type { ClientSummary } from '@/types';

export default function Index({ clients }: { clients: ClientSummary[] }) {
    const [editing, setEditing] = useState<ClientSummary | null>(null);
    const [deleting, setDeleting] = useState<ClientSummary | null>(null);

    return (
        <>
            <Head title="Clients" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                        Your firm's regular clients.
                    </p>
                    <NewClientDialog />
                </div>

                {clients.length === 0 ? (
                    <EmptyState
                        icon={Contact}
                        message="No clients yet. Add one to keep their details on hand."
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((client) => (
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
                )}
            </div>

            {editing && (
                <EditClientDialog
                    client={editing}
                    open
                    onOpenChange={(open) => !open && setEditing(null)}
                />
            )}

            <Dialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent>
                    <DialogTitle>Delete client?</DialogTitle>
                    <p className="text-muted-foreground text-sm">
                        This permanently removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>
                        's details. This cannot be undone.
                    </p>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        {deleting && (
                            <Form
                                {...destroy.form(deleting.id)}
                                onSuccess={() => setDeleting(null)}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        {processing && <Spinner />}
                                        Delete client
                                    </Button>
                                )}
                            </Form>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Clients', href: index() }],
};
