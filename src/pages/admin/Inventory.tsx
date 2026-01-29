import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LostItem, ItemCategory, CATEGORY_LABELS } from '@/types/database';
import { Plus, Package, Loader2, Image as ImageIcon, Upload, X, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export default function AdminInventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('lost_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      toast.error('Failed to load inventory');
    } else {
      setItems((data || []) as LostItem[]);
    }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const { error } = await supabase
      .from('lost_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete item');
    } else {
      toast.success('Item deleted');
      fetchItems();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Lost Items Inventory</h1>
          <p className="text-muted-foreground">
            Manage the private catalog of found items
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Add New Item</DialogTitle>
            </DialogHeader>
            <AddItemForm 
              userId={user?.id || ''} 
              onSuccess={() => {
                setIsAddDialogOpen(false);
                fetchItems();
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Empty Inventory</h2>
            <p className="text-muted-foreground mb-4">
              No items have been added to the inventory yet.
            </p>
            <Button variant="hero" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="glass-card overflow-hidden">
              {/* Image */}
              {item.image_urls && item.image_urls.length > 0 ? (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={item.image_urls[0]}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-semibold">{item.name}</h3>
                  <Badge variant={item.is_claimed ? "secondary" : "default"}>
                    {item.is_claimed ? 'Claimed' : 'Available'}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                  <span className="bg-muted px-2 py-1 rounded">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  {item.color && (
                    <span className="bg-muted px-2 py-1 rounded">{item.color}</span>
                  )}
                  {item.brand && (
                    <span className="bg-muted px-2 py-1 rounded">{item.brand}</span>
                  )}
                </div>

                {item.date_found && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Found: {format(new Date(item.date_found), 'MMM d, yyyy')}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddItemForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other' as ItemCategory,
    color: '',
    brand: '',
    distinguishing_features: '',
    location_found: '',
    date_found: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const { file } of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `inventory/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('item-images')
            .getPublicUrl(filePath);
          imageUrls.push(publicUrl);
        }
      }

      // Insert item
      const { error } = await supabase.from('lost_items').insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        color: formData.color.trim() || null,
        brand: formData.brand.trim() || null,
        distinguishing_features: formData.distinguishing_features.trim() || null,
        location_found: formData.location_found.trim() || null,
        date_found: formData.date_found || null,
        image_urls: imageUrls,
        added_by: userId,
      });

      if (error) throw error;

      toast.success('Item added to inventory');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image Upload */}
      <div>
        <Label>Photos</Label>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {images.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="aspect-square rounded-lg border-2 border-dashed cursor-pointer flex flex-col items-center justify-center text-muted-foreground hover:text-accent hover:border-accent transition-colors">
              <Upload className="h-5 w-5" />
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as ItemCategory })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location_found">Location Found</Label>
          <Input
            id="location_found"
            value={formData.location_found}
            onChange={(e) => setFormData({ ...formData, location_found: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_found">Date Found</Label>
          <Input
            id="date_found"
            type="date"
            value={formData.date_found}
            onChange={(e) => setFormData({ ...formData, date_found: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="distinguishing_features">Distinguishing Features</Label>
        <Textarea
          id="distinguishing_features"
          value={formData.distinguishing_features}
          onChange={(e) => setFormData({ ...formData, distinguishing_features: e.target.value })}
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          'Add to Inventory'
        )}
      </Button>
    </form>
  );
}
