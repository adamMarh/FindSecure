import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_LABELS, Inquiry, InquiryStatus, ItemCategory, STATUS_COLORS, STATUS_LABELS } from '@/types/database';
import { format } from 'date-fns';
import { Calendar, Check, Eye, Image as ImageIcon, Loader2, MapPin, Search, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [processing, setProcessing] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchSummary, setMatchSummary] = useState<Record<string, { count: number; maxConfidence: number }>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);  // ← New: for selecting one match

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    if (selectedInquiry) fetchMatches(selectedInquiry.id);
    else {
      setMatches([]);
      setSelectedMatchId(null);
    }
  }, [selectedInquiry]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      // Fetch all potential matches to get inquiry_ids with matches + summaries
      const { data: allMatches, error: matchesError } = await supabase
        .from('potential_matches')
        .select('inquiry_id, confidence_score');

      if (matchesError) throw matchesError;

      const inquiryIdsWithMatches = [...new Set(allMatches.map(m => m.inquiry_id))];

      const summary: typeof matchSummary = {};
      allMatches.forEach(m => {
        if (!summary[m.inquiry_id]) summary[m.inquiry_id] = { count: 0, maxConfidence: 0 };
        summary[m.inquiry_id].count++;
        if (m.confidence_score > summary[m.inquiry_id].maxConfidence) {
          summary[m.inquiry_id].maxConfidence = m.confidence_score;
        }
      });
      setMatchSummary(summary);

      // Fetch only inquiries with matches
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .in('id', inquiryIdsWithMatches)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries((data || []) as Inquiry[]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async (inquiryId: string) => {
    setMatchesLoading(true);
    try {
      const { data, error } = await supabase
        .from('potential_matches')
        .select('*, lost_items(*)')
        .eq('inquiry_id', inquiryId)
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      setMatches((data as any[]) || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load matches');
      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleApproveSelected = async () => {
  if (!selectedInquiry || !selectedMatchId || processing) return;
  setProcessing(true);
  try {
    const selectedMatch = matches.find(m => m.id === selectedMatchId);
    if (!selectedMatch) throw new Error('Selected match not found');

    // 1) Insert into matches table
    const { error: insertError } = await supabase
      .from('matches')
      .insert({
        lost_item_id: selectedMatch.lost_item_id,
        inquiry_id: selectedInquiry.id,
        user_id: selectedInquiry.user_id,
        match_date: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    // 2) Update inquiry status to matched
    const { error: updateError } = await supabase
      .from('inquiries')
      .update({ status: 'matched' })
      .eq('id', selectedInquiry.id);

    if (updateError) throw updateError;

    // 3) Delete this match candidate from potential_matches
    const { error: deleteError } = await supabase
      .from('potential_matches')
      .delete()
      .eq('inquiry_id', selectedInquiry.id)
      .eq('lost_item_id', selectedMatch.lost_item_id);

    if (deleteError) throw deleteError;

    toast.success('Match approved');
    setSelectedInquiry(null);
    fetchInquiries();
  } catch (e) {
    console.error(e);
    toast.error('Failed to approve match');
  } finally {
    setProcessing(false);
  }
};


  const handleNoMatch = async () => {
  if (!selectedInquiry || processing) return;
  setProcessing(true);
  try {
    // 1) Update inquiry status
    const { error: updateError } = await supabase
      .from('inquiries')
      .update({ status: 'rejected' as const })
      .eq('id', selectedInquiry.id);

    if (updateError) throw updateError;

    // 2) Delete all potential matches for this inquiry
    const { error: deleteError } = await supabase
      .from('potential_matches')
      .delete()
      .eq('inquiry_id', selectedInquiry.id);

    if (deleteError) throw deleteError;

    toast.success('Marked as no match');
    setSelectedInquiry(null);
    fetchInquiries();
  } catch (e) {
    console.error(e);
    toast.error('Failed to update');
  } finally {
    setProcessing(false);
  }
};


  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Manage Matches</h1>  {/* ← Updated title */}
        <p className="text-muted-foreground">
          Review potential matches for user inquiries
        </p>
      </div>

      {inquiries.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">No Matches</h2>
            <p className="text-muted-foreground">
              No inquiries with potential matches yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="glass-card">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Image */}
                  {inquiry.image_urls && inquiry.image_urls.length > 0 ? (
                    <div className="w-full lg:w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={inquiry.image_urls[0]}
                        alt={inquiry.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full lg:w-32 h-32 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <h3 className="font-display font-semibold text-lg">{inquiry.title}</h3>
                      <Badge className={STATUS_COLORS[inquiry.status as InquiryStatus]}>
                        {STATUS_LABELS[inquiry.status as InquiryStatus]}
                      </Badge>
                      {matchSummary[inquiry.id] && matchSummary[inquiry.id].maxConfidence > 0 && (
                        <Badge className="bg-amber-100 text-amber-800">
                          {matchSummary[inquiry.id].count} Potential ({matchSummary[inquiry.id].maxConfidence.toFixed(1)}%)
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {inquiry.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
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
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(inquiry.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInquiry(inquiry)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review Matches
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inquiry Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedInquiry?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedInquiry && (
            <div className="space-y-4">
              {selectedInquiry.image_urls && selectedInquiry.image_urls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedInquiry.image_urls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Image ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="text-sm">{selectedInquiry.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedInquiry.category && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                      <p className="text-sm">{CATEGORY_LABELS[selectedInquiry.category as ItemCategory]}</p>
                    </div>
                  )}
                  {selectedInquiry.color && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Color</h4>
                      <p className="text-sm">{selectedInquiry.color}</p>
                    </div>
                  )}
                  {selectedInquiry.brand && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Brand</h4>
                      <p className="text-sm">{selectedInquiry.brand}</p>
                    </div>
                  )}
                  {selectedInquiry.location_lost && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Location Lost</h4>
                      <p className="text-sm">{selectedInquiry.location_lost}</p>
                    </div>
                  )}
                </div>

                {selectedInquiry.distinguishing_features && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Distinguishing Features</h4>
                    <p className="text-sm">{selectedInquiry.distinguishing_features}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Potential Matches */}
          <div className="mt-4">
            <h4 className="text-sm font-medium">Potential Matches</h4>
            {matchesLoading ? (
              <div className="py-4 flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading matches...
              </div>
            ) : matches.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No potential matches found.</p>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => (
                  <Card key={m.id} className={`p-3 cursor-pointer transition-colors ${selectedMatchId === m.id ? 'border-accent' : ''}`} onClick={() => setSelectedMatchId(m.id)}>
                    <div className="flex items-start gap-3">
                      <div className="w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                        {m.lost_items?.image_urls?.[0] ? (
                          <img src={m.lost_items.image_urls[0]} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{m.lost_items?.name}</h5>
                            <p className="text-xs text-muted-foreground line-clamp-2">Brand: {m.lost_items?.brand}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">Description: {m.lost_items?.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{Number(m.confidence_score).toFixed(1)}%</div>
                          </div>
                        </div>

                        {m.match_reasons && Array.isArray(m.match_reasons) && (
                          <ul className="text-xs text-muted-foreground mt-2 list-disc list-inside">
                            {m.match_reasons.slice(0, 3).map((r: string, i: number) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Overall Actions */}
          {!matchesLoading && matches.length > 0 && (
            <div className="mt-4 flex gap-2 justify-end">
              <Button 
                variant="destructive" 
                onClick={handleNoMatch} 
                disabled={processing}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1" />}
                No Match
              </Button>
              <Button 
                variant="success" 
                onClick={handleApproveSelected} 
                disabled={!selectedMatchId || processing}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                Approve Selected
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}