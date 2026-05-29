import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Hapus",
  cancelText = "Batal",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Top accent bar */}
              <div className={`h-1 w-full ${isDanger ? "bg-gradient-to-r from-red-500 to-rose-600" : "bg-gradient-to-r from-yellow-500 to-orange-500"}`} />

              <div className="p-6">
                {/* Close button */}
                <button
                  className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
                  onClick={onCancel}
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Icon */}
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isDanger
                        ? "bg-red-500/15 border border-red-500/25"
                        : "bg-yellow-500/15 border border-yellow-500/25"
                    }`}
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.08, type: "spring", stiffness: 300 }}
                  >
                    {isDanger
                      ? <Trash2 className={`h-5 w-5 ${isDanger ? "text-red-400" : "text-yellow-400"}`} />
                      : <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    }
                  </motion.div>

                  <div>
                    <h3 className="text-base font-semibold text-white leading-tight">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Tindakan ini tidak bisa dibatalkan</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 pl-0">{description}</p>

                {/* Buttons */}
                <div className="flex gap-2.5">
                  <Button
                    variant="ghost"
                    className="flex-1 border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    className={`flex-1 gap-2 font-semibold ${
                      isDanger
                        ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        : "bg-yellow-600 hover:bg-yellow-500 text-white"
                    }`}
                    onClick={onConfirm}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : isDanger ? (
                      <Trash2 className="h-3.5 w-3.5" />
                    ) : null}
                    {loading ? "Memproses..." : confirmText}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
