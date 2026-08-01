export const iconByState = new Map(Object.entries({
    // moving
    running: "state.running", in_progress: "state.running", active: "state.running", drives: "state.running",
    // done / positive
    completed: "state.completed", done: "state.completed", accepted: "state.completed", approved: "state.completed",
    pass: "state.completed", validates: "state.completed", ready: "state.completed", final_report: "state.completed",
    test_result: "state.completed",
    // terminal / negative
    failed: "state.failed", fail: "state.failed", rejected: "state.failed", denied: "state.failed",
    cancelled: "state.failed", dead_lettered: "state.failed", unsafe: "state.failed",
    // blocked
    blocked: "state.blocked", blocks: "state.blocked",
    // caution
    warn: "state.warning", partial: "state.warning", incomplete: "state.warning", needs_revision: "state.warning",
    needs_human: "state.warning", stale: "state.warning", revising: "state.warning", deprecated: "state.warning",
    expired: "state.warning", security: "state.warning",
    // waiting
    queued: "state.pending", retry_scheduled: "state.pending", deferred: "state.pending", requested: "state.pending",
    awaiting_decision: "state.pending", awaiting_plan_review: "state.pending", depends_on: "state.pending",
    idle: "state.pending",
    // in review
    reviewing: "state.review", under_review: "state.review", submitted: "state.review", review_report: "state.review",
    // paused
    paused: "state.paused",
    // authoring
    draft: "state.draft", planning: "state.draft", planned: "state.draft", proposed: "state.draft",
    // shelved
    archived: "state.archived", used: "state.archived"
}));
/** The glyph for a workflow state, or null when the word is a kind, not a state. */
export function iconNameForState(state) {
    if (typeof state !== "string")
        return null;
    return iconByState.get(state) ?? null;
}
