import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/storeHooks";
import { clearTelegramErrors, clearLastResults } from "../store/sliceTelegram";
import {
    sendInvoiceByPhone,
    sendReturnAlert,
    sendReturnStatusUpdate,
    sendDailyReport,
    triggerDailyReport,
    sendBulkBroadcast,
    sendBulkBroadcastWithFile,
    uploadImage,
    linkUserToTelegram,
    getTelegramLinkingStatus,
} from "../store/thunkTelegram";
import {
    selectSendInvoiceLoading,
    selectSendReturnAlertLoading,
    selectSendReturnStatusLoading,
    selectSendDailyReportLoading,
    selectTriggerReportLoading,
    selectBulkBroadcastLoading,
    selectUploadImageLoading,
    selectLinkUserLoading,
    selectLinkingStatusLoading,
    selectTelegramBusy,
    selectLastInvoiceResult,
    selectLastReturnAlertResult,
    selectLastReturnStatusResult,
    selectLastDailyReportResult,
    selectLastTriggerResult,
    selectLastBroadcastResult,
    selectLastUploadedImageUrl,
    selectLastLinkResult,
    selectLinkingStatus,
    selectInvoiceSentSuccessfully,
    selectInvoiceNeedsLink,
    selectBroadcastStats,
    selectLinkedRatio,
    selectSendInvoiceError,
    selectSendReturnAlertError,
    selectSendReturnStatusError,
    selectSendDailyReportError,
    selectTriggerReportError,
    selectBulkBroadcastError,
    selectUploadImageError,
    selectLinkUserError,
    selectLinkingStatusError,
    selectFirstTelegramError,
} from "../store/SelectorsTelegram";
import type {
    SendInvoiceRequest,
    SendReturnAlertRequest,
    SendReturnStatusRequest,
    SendDailyReportRequest,
    TriggerDailyReportRequest,
    LinkUserRequest,
} from "../../../types/Telegram";

export function useTelegram() {
    const dispatch = useAppDispatch();

    // ── Loading ───────────────────────────────────────────────────────────────
    const loading = {
        sendInvoice: useAppSelector(selectSendInvoiceLoading),
        sendReturnAlert: useAppSelector(selectSendReturnAlertLoading),
        sendReturnStatus: useAppSelector(selectSendReturnStatusLoading),
        sendDailyReport: useAppSelector(selectSendDailyReportLoading),
        triggerReport: useAppSelector(selectTriggerReportLoading),
        bulkBroadcast: useAppSelector(selectBulkBroadcastLoading),
        uploadImage: useAppSelector(selectUploadImageLoading),
        linkUser: useAppSelector(selectLinkUserLoading),
        linkingStatus: useAppSelector(selectLinkingStatusLoading),
    };
    const isBusy = useAppSelector(selectTelegramBusy);

    // ── Results ───────────────────────────────────────────────────────────────
    const lastInvoiceResult = useAppSelector(selectLastInvoiceResult);
    const lastReturnAlertResult = useAppSelector(selectLastReturnAlertResult);
    const lastReturnStatusResult = useAppSelector(selectLastReturnStatusResult);
    const lastDailyReportResult = useAppSelector(selectLastDailyReportResult);
    const lastTriggerResult = useAppSelector(selectLastTriggerResult);
    const lastBroadcastResult = useAppSelector(selectLastBroadcastResult);
    const lastUploadedImageUrl = useAppSelector(selectLastUploadedImageUrl);
    const lastLinkResult = useAppSelector(selectLastLinkResult);
    const linkingStatus = useAppSelector(selectLinkingStatus);

    // ── Derived ───────────────────────────────────────────────────────────────
    const invoiceSentSuccessfully = useAppSelector(selectInvoiceSentSuccessfully);
    const invoiceNeedsLink = useAppSelector(selectInvoiceNeedsLink);
    const broadcastStats = useAppSelector(selectBroadcastStats);
    const linkedRatio = useAppSelector(selectLinkedRatio);

    // ── Errors ────────────────────────────────────────────────────────────────
    const errors = {
        sendInvoice: useAppSelector(selectSendInvoiceError),
        sendReturnAlert: useAppSelector(selectSendReturnAlertError),
        sendReturnStatus: useAppSelector(selectSendReturnStatusError),
        sendDailyReport: useAppSelector(selectSendDailyReportError),
        triggerReport: useAppSelector(selectTriggerReportError),
        bulkBroadcast: useAppSelector(selectBulkBroadcastError),
        uploadImage: useAppSelector(selectUploadImageError),
        linkUser: useAppSelector(selectLinkUserError),
        linkingStatus: useAppSelector(selectLinkingStatusError),
    };
    const firstError = useAppSelector(selectFirstTelegramError);

    // ── Actions ───────────────────────────────────────────────────────────────
    const sendInvoice = useCallback(
        (payload: SendInvoiceRequest) => dispatch(sendInvoiceByPhone(payload)),
        [dispatch]
    );

    const sendReturn = useCallback(
        (payload: SendReturnAlertRequest) => dispatch(sendReturnAlert(payload)),
        [dispatch]
    );

    const sendReturnStatus = useCallback(
        (payload: SendReturnStatusRequest) => dispatch(sendReturnStatusUpdate(payload)),
        [dispatch]
    );

    const sendReport = useCallback(
        (payload: SendDailyReportRequest) => dispatch(sendDailyReport(payload)),
        [dispatch]
    );

    const triggerReport = useCallback(
        (payload: TriggerDailyReportRequest) => dispatch(triggerDailyReport(payload)),
        [dispatch]
    );

    const broadcast = useCallback(
        (message: string) => dispatch(sendBulkBroadcast({ message })),
        [dispatch]
    );

    const broadcastWithFile = useCallback(
        (message: string, file?: File) => dispatch(sendBulkBroadcastWithFile({ message, file })),
        [dispatch]
    );

    const uploadImg = useCallback(
        (file: File) => dispatch(uploadImage({ file })),
        [dispatch]
    );

    const linkUser = useCallback(
        (payload: LinkUserRequest) => dispatch(linkUserToTelegram(payload)),
        [dispatch]
    );

    const fetchLinkingStatus = useCallback(
        () => dispatch(getTelegramLinkingStatus()),
        [dispatch]
    );

    const clearErrors = useCallback(() => dispatch(clearTelegramErrors()), [dispatch]);
    const clearResults = useCallback(() => dispatch(clearLastResults()), [dispatch]);

    return {
        // loading
        loading,
        isBusy,
        // results
        lastInvoiceResult,
        lastReturnAlertResult,
        lastReturnStatusResult,
        lastDailyReportResult,
        lastTriggerResult,
        lastBroadcastResult,
        lastUploadedImageUrl,
        lastLinkResult,
        linkingStatus,
        // derived
        invoiceSentSuccessfully,
        invoiceNeedsLink,
        broadcastStats,
        linkedRatio,
        // errors
        errors,
        firstError,
        // actions
        sendInvoice,
        sendReturn,
        sendReturnStatus,
        sendReport,
        triggerReport,
        broadcast,
        broadcastWithFile,
        uploadImg,
        linkUser,
        fetchLinkingStatus,
        clearErrors,
        clearResults,
    };
}