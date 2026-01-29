import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_LABELS, Inquiry, InquiryStatus, ItemCategory, LostItem, STATUS_COLORS, STATUS_LABELS } from '@/types/database';
import { format } from 'date-fns';
import { Calendar, Check, Clock, Image as ImageIcon, Loader2, MapPin, Plus, Search, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function TrackInquiries() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchInquiries();
      // Realtime subscription
      const channel = supabase
        .channel('inquiries-changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'inquiries',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setInquiries(prev => prev.map(i => i.id === payload.new.id ? { ...i, ...payload.new } : i));
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user, authLoading, navigate]);

  const fetchInquiries = async () => {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inquiries:', error);
    } else {
      setInquiries((data || []) as Inquiry[]);
    }
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">My Inquiries</h1>
              <p className="text-muted-foreground">
                Track the status of your lost item reports
              </p>
            </div>
            <Button variant="hero" onClick={() => navigate('/submit')}>
              <Plus className="h-4 w-4 mr-2" />
              New Inquiry
            </Button>
          </div>

          {/* Inquiries List */}
          {inquiries.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-xl">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-xl font-semibold mb-2">No Inquiries Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't submitted any lost item inquiries.
              </p>
              <Button variant="hero" onClick={() => navigate('/submit')}>
                Report a Lost Item
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <InquiryCard key={inquiry.id} inquiry={inquiry} refreshInquiries={fetchInquiries} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function InquiryCard({ inquiry, refreshInquiries }: { inquiry: Inquiry; refreshInquiries: () => void }) {
  const [matchedItem, setMatchedItem] = useState<LostItem | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (inquiry.status === 'matched') {
      fetchApprovedMatch();
    }
  }, [inquiry.status]);

  const fetchApprovedMatch = async () => {
    setItemLoading(true);
    try {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('lost_item_id')
        .eq('inquiry_id', inquiry.id)
        .single();  // Assume one match per inquiry

      if (matchError || !match) {
        setMatchedItem(null);
        setConfidenceScore(null);
        return;
      }

      const { data: item, error: itemError } = await supabase
        .from('lost_items')
        .select('*')
        .eq('id', match.lost_item_id)
        .single();

      if (itemError) throw itemError;
      setMatchedItem(item as LostItem);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load matched item');
    } finally {
      setItemLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (processing || !matchedItem) return;
    setProcessing(true);
    try {
      // 1. Delete the lost_item from inventory
      const { error: deleteItemError } = await supabase
        .from('lost_items')
        .delete()
        .eq('id', matchedItem.id);

      if (deleteItemError) throw deleteItemError;

      // 2. Delete the match record
      const { error: deleteMatchError } = await supabase
        .from('matches')
        .delete()
        .eq('inquiry_id', inquiry.id);

      if (deleteMatchError) console.warn('Failed to delete match', deleteMatchError);

      // 3. Update inquiry status to resolved
      const { error: updateError } = await supabase
        .from('inquiries')
        .update({ status: 'resolved' })
        .eq('id', inquiry.id);

      if (updateError) throw updateError;

      toast.success('Item confirmed and recovered!');
      setMatchedItem(null);
      refreshInquiries();
    } catch (e) {
      console.error(e);
      toast.error('Failed to confirm');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      // Update inquiry status
      const { error: inquiryError } = await supabase
        .from('inquiries')
        .update({ status: 'rejected' })
        .eq('id', inquiry.id);

      if (inquiryError) throw inquiryError;

      // Delete the match row
      const { error: matchError } = await supabase
        .from('matches')
        .delete()
        .eq('inquiry_id', inquiry.id);

      if (matchError) console.warn('Failed to delete match', matchError);  // Optional log

      toast.success('Match rejected');
      refreshInquiries();
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 hover:border-accent/30 transition-all">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Image Preview */}
        {inquiry.image_urls && inquiry.image_urls.length > 0 ? (
          <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={inquiry.image_urls[0]}
              alt={inquiry.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full sm:w-24 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <h3 className="font-display font-semibold text-lg">{inquiry.title}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inquiry.status as InquiryStatus]}`}>
              {STATUS_LABELS[inquiry.status as InquiryStatus]}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {inquiry.description}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {inquiry.category && (
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {CATEGORY_LABELS[inquiry.category as ItemCategory]}
              </span>
            )}
            {inquiry.location_lost && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {inquiry.location_lost}
              </span>
            )}
            {inquiry.date_lost && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Lost on {format(new Date(inquiry.date_lost), 'MMM d, yyyy')}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Submitted {format(new Date(inquiry.created_at), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Matched Item Display */}
          {inquiry.status === 'matched' && (
            <div className="mt-4 p-4 bg-success/10 rounded-lg space-y-2">
              <h4 className="text-sm font-medium text-success">Matched Item Found {confidenceScore !== null ? `(${confidenceScore}% confidence)` : ''}</h4>
              {itemLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : matchedItem ? (
                <div className="flex items-start gap-3">
                  {matchedItem.image_urls?.[0] && (
                    <img src={matchedItem.image_urls[0]} alt={matchedItem.name} className="w-16 h-16 rounded object-cover" />
                  )}
                  <div>
                    <p className="font-medium">{matchedItem.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{matchedItem.description}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No approved match found</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={handleConfirm} disabled={processing || !matchedItem}>
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                  Confirm It's Mine
                </Button>
                <Button size="sm" variant="destructive" onClick={handleReject} disabled={processing || !matchedItem}>
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1" />}
                  Not Mine
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}