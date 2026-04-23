// input: 批量导出 API、React context 与本地存储中的任务标记。
// output: 全局批量导出任务状态、跨页面轮询恢复与完成提醒。
// pos: 前端批量导出状态中心。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { downloadBatchExportFile, fetchBatchExportStatus } from "../lib/api";
import type { BatchExportJobResponse } from "../types/models";
import { BatchExportNoticeDialog } from "../components/BatchExportNoticeDialog";

const ACTIVE_BATCH_EXPORT_JOB_ID_KEY = "activeBatchExportJobId";
const BATCH_EXPORT_COMPLETION_NOTIFIED_JOB_ID_KEY = "batchExportCompletionNotifiedJobId";
const DOWNLOADED_BATCH_EXPORT_JOB_IDS_KEY = "downloadedBatchExportJobIds";

interface BatchExportContextValue {
  trackedJob: BatchExportJobResponse | null;
  setTrackedJob: (job: BatchExportJobResponse | null) => void;
  downloadTrackedFile: () => Promise<void>;
  downloadBusy: boolean;
  isTrackedJobDownloaded: boolean;
}

const BatchExportContext = createContext<BatchExportContextValue | null>(null);

export function BatchExportProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [trackedJob, setTrackedJobState] = useState<BatchExportJobResponse | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const previousStatusRef = useRef<string>("");

  useEffect(() => {
    const storedJobId = window.localStorage.getItem(ACTIVE_BATCH_EXPORT_JOB_ID_KEY);
    if (!storedJobId) {
      return;
    }

    void (async () => {
      try {
        const job = await fetchBatchExportStatus(storedJobId);
        setTrackedJobState(job);
      } catch {
        clearStoredTracking();
        setTrackedJobState(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!trackedJob) {
      previousStatusRef.current = "";
      return;
    }

    if (trackedJob.status === "completed") {
      const notifiedJobId = window.localStorage.getItem(BATCH_EXPORT_COMPLETION_NOTIFIED_JOB_ID_KEY);
      if (notifiedJobId !== trackedJob.jobId && previousStatusRef.current === "running") {
        window.localStorage.setItem(BATCH_EXPORT_COMPLETION_NOTIFIED_JOB_ID_KEY, trackedJob.jobId);
        if (location.pathname !== "/") {
          setNoticeOpen(true);
        }
      }
    }

    previousStatusRef.current = trackedJob.status;
  }, [location.pathname, trackedJob]);

  useEffect(() => {
    if (!trackedJob || trackedJob.status === "completed" || trackedJob.status === "failed") {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const nextJob = await fetchBatchExportStatus(trackedJob.jobId);
        setTrackedJobState(nextJob);
      } catch {
        clearStoredTracking();
        setTrackedJobState(null);
      }
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [trackedJob]);

  function setTrackedJob(job: BatchExportJobResponse | null) {
    if (!job) {
      clearStoredTracking();
      setTrackedJobState(null);
      return;
    }
    window.localStorage.setItem(ACTIVE_BATCH_EXPORT_JOB_ID_KEY, job.jobId);
    window.localStorage.removeItem(BATCH_EXPORT_COMPLETION_NOTIFIED_JOB_ID_KEY);
    previousStatusRef.current = job.status;
    setTrackedJobState(job);
  }

  async function downloadTrackedFile() {
    if (!trackedJob) {
      return;
    }
    setDownloadBusy(true);
    try {
      await downloadBatchExportFile(trackedJob.jobId);
      markJobDownloaded(trackedJob.jobId);
    } finally {
      setDownloadBusy(false);
    }
  }

  const isTrackedJobDownloaded = trackedJob ? getDownloadedJobIds().includes(trackedJob.jobId) : false;

  const value = useMemo<BatchExportContextValue>(
    () => ({
      trackedJob,
      setTrackedJob,
      downloadTrackedFile,
      downloadBusy,
      isTrackedJobDownloaded,
    }),
    [downloadBusy, isTrackedJobDownloaded, trackedJob],
  );

  return (
    <BatchExportContext.Provider value={value}>
      {children}
      <BatchExportNoticeDialog
        open={noticeOpen}
        title="批量导出任务已完成"
        description="导出任务已完成，请回首页下载。"
        onClose={() => setNoticeOpen(false)}
      />
    </BatchExportContext.Provider>
  );
}

function clearStoredTracking() {
  window.localStorage.removeItem(ACTIVE_BATCH_EXPORT_JOB_ID_KEY);
  window.localStorage.removeItem(BATCH_EXPORT_COMPLETION_NOTIFIED_JOB_ID_KEY);
}

function getDownloadedJobIds() {
  const rawValue = window.localStorage.getItem(DOWNLOADED_BATCH_EXPORT_JOB_IDS_KEY);
  if (!rawValue) {
    return [];
  }
  try {
    const parsed = JSON.parse(rawValue) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function markJobDownloaded(jobId: string) {
  const nextIds = Array.from(new Set([...getDownloadedJobIds(), jobId]));
  window.localStorage.setItem(DOWNLOADED_BATCH_EXPORT_JOB_IDS_KEY, JSON.stringify(nextIds));
}

export function useBatchExport() {
  const context = useContext(BatchExportContext);
  if (!context) {
    throw new Error("useBatchExport must be used within BatchExportProvider");
  }
  return context;
}
