import { Form } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

type DeleteFormAction = { action: string; method: 'post' | 'delete' };

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    trigger,
    title,
    description,
    confirmLabel = 'Delete',
    formAction,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: ReactNode;
    title: ReactNode;
    description: ReactNode;
    confirmLabel?: string;
    formAction?: DeleteFormAction;
    onSuccess?: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogTitle>{title}</DialogTitle>
                <p className="text-muted-foreground text-sm">{description}</p>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    {formAction && (
                        <Form {...formAction} onSuccess={onSuccess}>
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}
                                    {confirmLabel}
                                </Button>
                            )}
                        </Form>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
