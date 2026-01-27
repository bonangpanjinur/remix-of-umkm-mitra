import { supabase } from '@/integrations/supabase/client';

export interface AutocompleteSuggestion {
  id: string;
  name: string;
  type: 'product' | 'merchant' | 'village' | 'tourism';
}

export async function fetchAutocompleteSuggestions(query: string): Promise<AutocompleteSuggestion[]> {
  if (!query || query.length < 2) return [];
  
  const searchTerm = `%${query}%`;
  
  try {
    // Fetch products, merchants, villages in parallel
    const [productsRes, merchantsRes, villagesRes, tourismRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name')
        .ilike('name', searchTerm)
        .eq('is_active', true)
        .limit(5),
      supabase
        .from('merchants')
        .select('id, name')
        .ilike('name', searchTerm)
        .eq('status', 'active')
        .limit(3),
      supabase
        .from('villages')
        .select('id, name')
        .ilike('name', searchTerm)
        .eq('is_active', true)
        .limit(3),
      supabase
        .from('tourism')
        .select('id, name')
        .ilike('name', searchTerm)
        .eq('is_active', true)
        .limit(3),
    ]);

    const suggestions: AutocompleteSuggestion[] = [];

    // Add products
    if (productsRes.data) {
      productsRes.data.forEach(p => {
        suggestions.push({ id: p.id, name: p.name, type: 'product' });
      });
    }

    // Add merchants
    if (merchantsRes.data) {
      merchantsRes.data.forEach(m => {
        suggestions.push({ id: m.id, name: m.name, type: 'merchant' });
      });
    }

    // Add villages
    if (villagesRes.data) {
      villagesRes.data.forEach(v => {
        suggestions.push({ id: v.id, name: v.name, type: 'village' });
      });
    }

    // Add tourism
    if (tourismRes.data) {
      tourismRes.data.forEach(t => {
        suggestions.push({ id: t.id, name: t.name, type: 'tourism' });
      });
    }

    return suggestions;
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error);
    return [];
  }
}
