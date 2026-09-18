import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PhaseFlowStepNodeData = {
    name: string;
    description: string | null;
    onEdit: () => void;
    onDelete: () => void;
    canEdit: boolean;
};

export function PhaseFlowStepNode({
    data,
}: NodeProps & { data: PhaseFlowStepNodeData }) {
    return (
        <div className="bg-card w-56 rounded-lg border p-3 shadow-sm">
            {data.canEdit && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!bg-primary !size-2.5"
                />
            )}

            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{data.name}</p>
                    {data.description && (
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                            {data.description}
                        </p>
                    )}
                </div>
                {data.canEdit && (
                    <div className="-mt-1 -mr-1 flex shrink-0 items-center">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={data.onEdit}
                        >
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit step</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={data.onDelete}
                        >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete step</span>
                        </Button>
                    </div>
                )}
            </div>

            {data.canEdit && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!bg-primary !size-2.5"
                />
            )}
        </div>
    );
}
