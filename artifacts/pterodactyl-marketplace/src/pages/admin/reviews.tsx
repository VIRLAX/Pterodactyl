import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useListReviews, getListReviewsQueryKey,
  useReplyReview
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Star, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getApiUrl } from "@/lib/api";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [replyDialog, setReplyDialog] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; author: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: reviews, isLoading } = useListReviews({}, {
    query: { queryKey: getListReviewsQueryKey({}) }
  });

  const replyReview = useReplyReview();

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${getApiUrl()}/admin/reviews/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success("Ulasan berhasil dihapus");
      qc.invalidateQueries({ queryKey: getListReviewsQueryKey({}) });
      setConfirmDelete(null);
    } catch {
      toast.error("Gagal menghapus ulasan");
    } finally {
      setDeleting(false);
    }
  }

  const handleReply = () => {
    if (!replyDialog || !replyText.trim()) return;
    replyReview.mutate({ id: replyDialog.id, data: { reply: replyText } }, {
      onSuccess: () => {
        toast.success("Balasan berhasil dikirim!");
        qc.invalidateQueries({ queryKey: getListReviewsQueryKey({}) });
        setReplyDialog(null);
        setReplyText("");
      },
      onError: () => toast.error("Gagal mengirim balasan"),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kelola Ulasan</h1>
          <p className="text-muted-foreground text-sm">{reviews?.length ?? 0} ulasan masuk</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : !reviews?.length ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
            <p>Belum ada ulasan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id} className="glass-panel border-white/5 hover:border-white/10 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {(review as any).user?.username?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-medium text-white text-sm">{(review as any).user?.username ?? "Anonymous"}</p>
                          <StarRating rating={review.rating} />
                          {(review as any).productId && (
                            <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                              Produk #{(review as any).productId}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{review.comment}</p>
                        <p className="text-xs text-muted-foreground/60">{new Date(review.createdAt).toLocaleString("id-ID")}</p>

                        {(review as any).adminReply && (
                          <div className="mt-3 ml-0 p-3 bg-primary/5 border-l-2 border-primary/30 rounded-r-lg">
                            <p className="text-xs text-primary font-semibold mb-1 flex items-center gap-1">
                              <Reply className="h-3 w-3" /> Balasan Admin
                            </p>
                            <p className="text-sm text-muted-foreground">{(review as any).adminReply}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-xs text-muted-foreground hover:text-white"
                        onClick={() => { setReplyDialog(review); setReplyText((review as any).adminReply ?? ""); }}
                      >
                        <Reply className="h-3.5 w-3.5" />
                        {(review as any).adminReply ? "Edit Balasan" : "Balas"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                        onClick={() => setConfirmDelete({ id: review.id, author: (review as any).user?.username ?? "Anonymous" })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={!!replyDialog} onOpenChange={() => setReplyDialog(null)}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Balas Ulasan</DialogTitle>
          </DialogHeader>
          {replyDialog && (
            <div className="space-y-4">
              <div className="bg-background/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{(replyDialog as any).user?.username}</p>
                  <StarRating rating={replyDialog.rating} />
                </div>
                <p className="text-sm text-muted-foreground">{replyDialog.comment}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Balasan Admin</label>
                <Textarea
                  className="bg-background/50 border-white/10 resize-none"
                  rows={4}
                  placeholder="Tulis balasan Anda..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplyDialog(null)}>Batal</Button>
            <Button onClick={handleReply} disabled={replyReview.isPending || !replyText.trim()} className="bg-primary hover:bg-primary/90 text-white">
              {replyReview.isPending ? "Mengirim..." : "Kirim Balasan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        title={`Hapus ulasan dari "${confirmDelete?.author}"?`}
        description="Ulasan ini akan dihapus secara permanen dari sistem dan tidak dapat dikembalikan."
        confirmText="Ya, Hapus Ulasan"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </AdminLayout>
  );
}
