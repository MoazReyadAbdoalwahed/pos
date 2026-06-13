import type { RootState } from "../../../store/store";

// ─── Loading flags ────────────────────────────────────────────────────────────
export const selectSendInvoiceLoading = (s: RootState) => s.telegram.loading.sendInvoice;
export const selectSendReturnAlertLoading = (s: RootState) => s.telegram.loading.sendReturnAlert;
export const selectSendReturnStatusLoading = (s: RootState) => s.telegram.loading.sendReturnStatus;
export const selectSendDailyReportLoading = (s: RootState) => s.telegram.loading.sendDailyReport;
export const selectTriggerReportLoading = (s: RootState) => s.telegram.loading.triggerDailyReport;
export const selectBulkBroadcastLoading = (s: RootState) => s.telegram.loading.bulkBroadcast;
export const selectUploadImageLoading = (s: RootState) => s.telegram.loading.uploadImage;
export const selectLinkUserLoading = (s: RootState) => s.telegram.loading.linkUser;
export const selectLinkingStatusLoading = (s: RootState) => s.telegram.loading.linkingStatus;

/** true when ANY telegram action is in-flight */
export const selectTelegramBusy = (s: RootState) =>
    Object.values(s.telegram.loading).some(Boolean);

// ─── Last results ─────────────────────────────────────────────────────────────
export const selectLastInvoiceResult = (s: RootState) => s.telegram.lastInvoiceResult;
export const selectLastReturnAlertResult = (s: RootState) => s.telegram.lastReturnAlertResult;
export const selectLastReturnStatusResult = (s: RootState) => s.telegram.lastReturnStatusResult;
export const selectLastDailyReportResult = (s: RootState) => s.telegram.lastDailyReportResult;
export const selectLastTriggerResult = (s: RootState) => s.telegram.lastTriggerResult;
export const selectLastBroadcastResult = (s: RootState) => s.telegram.lastBroadcastResult;
export const selectLastUploadedImageUrl = (s: RootState) => s.telegram.lastUploadedImageUrl;
export const selectLastLinkResult = (s: RootState) => s.telegram.lastLinkResult;
export const selectLinkingStatus = (s: RootState) => s.telegram.linkingStatus;

// ─── Derived / convenience ───────────────────────────────────────────────────

/** Did the last invoice send succeed (including soft-warning cases)? */
export const selectInvoiceSentSuccessfully = (s: RootState) =>
    s.telegram.lastInvoiceResult?.success === true;

/** Did the last invoice attempt return a "needs link" warning? */
export const selectInvoiceNeedsLink = (s: RootState) =>
    s.telegram.lastInvoiceResult?.needsLink === true;

/** Broadcast stats from the last bulk send */
export const selectBroadcastStats = (s: RootState) =>
    s.telegram.lastBroadcastResult?.results ?? null;

/** How many users are linked vs total */
export const selectLinkedRatio = (s: RootState) => {
    const status = s.telegram.linkingStatus;
    if (!status) return null;
    return { linked: status.linked, total: status.total, unlinked: status.unlinked };
};

// ─── Errors ───────────────────────────────────────────────────────────────────
export const selectSendInvoiceError = (s: RootState) => s.telegram.errors.sendInvoice;
export const selectSendReturnAlertError = (s: RootState) => s.telegram.errors.sendReturnAlert;
export const selectSendReturnStatusError = (s: RootState) => s.telegram.errors.sendReturnStatus;
export const selectSendDailyReportError = (s: RootState) => s.telegram.errors.sendDailyReport;
export const selectTriggerReportError = (s: RootState) => s.telegram.errors.triggerDailyReport;
export const selectBulkBroadcastError = (s: RootState) => s.telegram.errors.bulkBroadcast;
export const selectUploadImageError = (s: RootState) => s.telegram.errors.uploadImage;
export const selectLinkUserError = (s: RootState) => s.telegram.errors.linkUser;
export const selectLinkingStatusError = (s: RootState) => s.telegram.errors.linkingStatus;

/** First non-null error across all telegram actions (useful for a single error banner) */
export const selectFirstTelegramError = (s: RootState): string | null => {
    return (Object.values(s.telegram.errors) as (string | null)[]).find(Boolean) ?? null;
};