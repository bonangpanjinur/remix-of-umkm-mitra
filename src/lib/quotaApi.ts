import { supabase } from '@/integrations/supabase/client';

export interface QuotaTier {
  id: string;
  min_price: number;
  max_price: number | null;
  credit_cost: number;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export async function fetchQuotaTiers(): Promise<QuotaTier[]> {
  try {
    const { data, error } = await supabase
      .from('quota_tiers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching quota tiers:', error);
      // Return default tiers as fallback
      return getDefaultTiers();
    }

    return data && data.length > 0 ? data : getDefaultTiers();
  } catch (error) {
    console.error('Error fetching quota tiers:', error);
    return getDefaultTiers();
  }
}

function getDefaultTiers(): QuotaTier[] {
  return [
    { id: '1', min_price: 0, max_price: 3000, credit_cost: 1 },
    { id: '2', min_price: 3001, max_price: 5000, credit_cost: 2 },
    { id: '3', min_price: 5001, max_price: 8000, credit_cost: 3 },
    { id: '4', min_price: 8001, max_price: 15000, credit_cost: 4 },
    { id: '5', min_price: 15001, max_price: null, credit_cost: 5 },
  ];
}

export function calculateCreditCost(price: number, tiers: QuotaTier[]): number {
  // Sort tiers by min_price ascending
  const sortedTiers = [...tiers].sort((a, b) => a.min_price - b.min_price);
  
  for (const tier of sortedTiers) {
    if (price >= tier.min_price && (tier.max_price === null || price <= tier.max_price)) {
      return tier.credit_cost;
    }
  }
  
  // Default to highest tier cost if price exceeds all tiers
  return sortedTiers[sortedTiers.length - 1]?.credit_cost || 1;
}

export async function calculateOrderCreditCost(items: { price: number; quantity: number }[]): Promise<number> {
  const tiers = await fetchQuotaTiers();
  return items.reduce((total, item) => {
    return total + (calculateCreditCost(item.price, tiers) * item.quantity);
  }, 0);
}

export async function useMerchantQuotaCredits(merchantId: string, credits: number): Promise<boolean> {
  try {
    // Use the existing use_merchant_quota function
    const { data, error } = await supabase.rpc('use_merchant_quota', {
      p_merchant_id: merchantId,
      p_credits: credits
    });

    if (error) {
      console.error('Error using merchant quota credits:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error using merchant quota credits:', error);
    return false;
  }
}
