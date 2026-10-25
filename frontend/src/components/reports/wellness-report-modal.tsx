"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Printer, Sparkles, CheckCircle, FileText } from "lucide-react";
import { WellnessReportView, WellnessReportProps } from "./wellness-report-view";
import toast from "react-hot-toast";

interface WellnessReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData?: WellnessReportProps["data"];
  autoDownloadOnOpen?: boolean;
}

export const WellnessReportModal: React.FC<WellnessReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
  autoDownloadOnOpen = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadPdf = async () => {
    const reportElement = document.getElementById("printable-wellness-report");
    if (!reportElement) {
      toast.error("Report document not ready for export");
      return;
    }

    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      // Dynamically load html2canvas and jspdf to keep initial bundle ultra fast
      const [html2canvasModule, jspdfModule] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = jspdfModule;

      const canvas = await html2canvas(reportElement, {
        scale: 2.5, // 2.5x retina rendering for razor sharp typography and vectors
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#faf8f5",
        logging: false,
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfPageWidth = 210; // A4 width in mm
      const pdfPageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * pdfPageWidth) / canvas.width;

      if (imgHeight <= pdfPageHeight) {
        // Fits perfectly on one A4 sheet with slight top aesthetic breathing margin
        const yOffset = Math.max(2, (pdfPageHeight - imgHeight) / 2);
        pdf.addImage(imgData, "PNG", 0, yOffset, pdfPageWidth, imgHeight, undefined, "FAST");
      } else {
        // Auto scale to guarantee 100% single-page high-fidelity export
        const fitScale = (pdfPageHeight - 8) / imgHeight;
        const fitWidth = pdfPageWidth * fitScale;
        const fitHeight = imgHeight * fitScale;
        const xOffset = (pdfPageWidth - fitWidth) / 2;
        pdf.addImage(imgData, "PNG", xOffset, 4, fitWidth, fitHeight, undefined, "FAST");
      }

      const filename = `MindSync_AI_Wellness_Report_${
        reportData?.period?.replace(/\s+/g, "_") || "October_2026"
      }.pdf`;

      pdf.save(filename);
      setDownloadSuccess(true);
      toast.success("High-fidelity Wellness Report PDF downloaded!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Could not render image canvas directly. Launching print-to-PDF...");
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Auto-download once when modal opens if requested
  useEffect(() => {
    if (isOpen && autoDownloadOnOpen) {
      const timer = setTimeout(() => {
        handleDownloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDownloadOnOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-md transition-all animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#12161f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar (Hidden during print) */}
        <div className="print-hide flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 bg-[#181d28] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                MindSync AI Wellness Report
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {reportData?.period || "October 2026"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Aesthetic illustrated edition ready for export & printing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-3 sm:px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors shadow-sm"
              title="Print Vector Sheet (A4)"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Print / Save as PDF</span>
              <span className="sm:hidden">Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="py-2 px-3 sm:px-4 rounded-xl bg-[#3d8b76] hover:bg-[#347866] active:scale-95 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-[#3d8b76]/20 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle size={15} className="text-emerald-200" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Canvas Preview */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#0c1017]/80 flex justify-center">
          <div className="w-full flex justify-center py-2">
            <WellnessReportView data={reportData} />
          </div>
        </div>
      </div>
    </div>
  );
};
