import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_LABELS, ItemCategory } from '@/types/database';
import { ArrowRight, Camera, FileText, Loader2, Shield, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SubmitInquiry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ItemCategory | '',
    color: '',
    brand: '',
    distinguishing_features: '',
    location_lost: '',
    date_lost: '',
  });

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(prev => [...prev, ...newImages].slice(0, 5));
  }, []);

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    
    setUploadingImages(true);
    const urls: string[] = [];

    for (const { file } of images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `inquiries/${user?.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('item-images')
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      urls.push(publicUrl);
    }

    setUploadingImages(false);
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to submit an inquiry');
      navigate('/login');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please provide a title and description');
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadImages();

      const { data: insertData, error } = await supabase.from('inquiries').insert({
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category || null,
        color: formData.color.trim() || null,
        brand: formData.brand.trim() || null,
        distinguishing_features: formData.distinguishing_features.trim() || null,
        location_lost: formData.location_lost.trim() || null,
        date_lost: formData.date_lost || null,
        image_urls: imageUrls,
        status: 'submitted',
      }).select();

      if (error) throw error;

      
      // Call the AI matching edge function
      const inquiry = insertData?.[0];
      if (inquiry) {
        const { data, error } = await supabase.functions.invoke('match-inquiry', {
          body: { inquiryId: inquiry.id },
        });
        toast.success('Inquiry submitted successfully! We are searching for matches.');

        await supabase
        .from('inquiries')
        .update({ status: 'under_review' })
        .eq('id', inquiry.id);
      }
      navigate('/track');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Shield className="h-4 w-4" />
              Secure Submission
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Report Lost Item</h1>
            <p className="text-muted-foreground">
              Provide as much detail as possible to help us find a match.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Section */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-5 w-5 text-accent" />
                <h2 className="font-display font-semibold">Photos (Optional)</h2>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-accent cursor-pointer flex flex-col items-center justify-center text-muted-foreground hover:text-accent transition-colors">
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Upload up to 5 photos of your item or similar items
              </p>
            </div>

            {/* Description Section */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-accent" />
                <h2 className="font-display font-semibold">Item Details</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Black iPhone 14 Pro"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item in detail: size, condition, any unique features..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as ItemCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      placeholder="e.g., Black, Navy Blue"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      placeholder="e.g., Apple, Samsung, Nike"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_lost">Date Lost</Label>
                    <Input
                      id="date_lost"
                      type="date"
                      value={formData.date_lost}
                      onChange={(e) => setFormData({ ...formData, date_lost: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_lost">Location Lost</Label>
                  <Input
                    id="location_lost"
                    placeholder="e.g., Central Park, Main Street subway station"
                    value={formData.location_lost}
                    onChange={(e) => setFormData({ ...formData, location_lost: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distinguishing_features">Distinguishing Features</Label>
                  <Textarea
                    id="distinguishing_features"
                    placeholder="Any scratches, stickers, custom engravings, or unique marks?"
                    value={formData.distinguishing_features}
                    onChange={(e) => setFormData({ ...formData, distinguishing_features: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading || uploadingImages}
            >
              {loading || uploadingImages ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {uploadingImages ? 'Uploading images...' : 'Analyzing submission...'}
                </>
              ) : (
                <>
                  Submit Inquiry
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                You'll need to sign in to submit your inquiry.
              </p>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
}
