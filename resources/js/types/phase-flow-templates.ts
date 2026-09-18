export type PhaseFlowStepSummary = {
    id: number;
    name: string;
    description: string | null;
    position_x: number;
    position_y: number;
    next_phase_template_id: number | null;
};

export type PhaseFlowTemplateSummary = {
    id: number;
    name: string;
    description: string | null;
    steps_count: number;
    is_ready: boolean;
};

export type PhaseFlowTemplateDetail = {
    id: number;
    name: string;
    description: string | null;
    is_ready: boolean;
    steps: PhaseFlowStepSummary[];
};
