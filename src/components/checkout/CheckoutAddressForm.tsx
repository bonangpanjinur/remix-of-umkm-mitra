import { useState, useEffect, useCallback } from 'react';
import { MapPin, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressSelector, type AddressData, formatFullAddress, createEmptyAddressData } from '@/components/AddressSelector';
import { LocationPicker } from './LocationPicker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneInput } from '@/components/ui/PhoneInput';

export interface CheckoutAddressData {
  name: string;
  phone: string;
  address: AddressData;
  location: { lat: number; lng: number } | null;
  fullAddress: string;
}

interface CheckoutAddressFormProps {
  value: CheckoutAddressData;
  onChange: (data: CheckoutAddressData) => void;
  onDistanceChange?: (distanceKm: number) => void;
  merchantLocation?: { lat: number; lng: number } | null;
  errors?: {
    name?: string;
    phone?: string;
    address?: string;
    location?: string;
  };
}

export function CheckoutAddressForm({
  value,
  onChange,
  onDistanceChange,
  merchantLocation,
  errors,
}: CheckoutAddressFormProps) {
  const { user } = useAuth();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileWasEmpty, setProfileWasEmpty] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || profileLoaded) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          // Check if profile address is empty
          const profileHasAddress = profile.province_id || profile.city_id || profile.district_id;
          setProfileWasEmpty(!profileHasAddress);
          
          // Auto-fill from profile if checkout form is empty
          const hasExistingData = value.name || value.phone || value.address.province;
          
          if (!hasExistingData && profileHasAddress) {
            const addressData: AddressData = {
              province: profile.province_id || '',
              provinceName: profile.province_name || '',
              city: profile.city_id || '',
              cityName: profile.city_name || '',
              district: profile.district_id || '',
              districtName: profile.district_name || '',
              village: profile.village_id || '',
              villageName: profile.village_name || '',
              detail: profile.address_detail || '',
            };

            onChange({
              name: profile.full_name || '',
              phone: profile.phone || '',
              address: addressData,
              location: value.location,
              fullAddress: formatFullAddress(addressData),
            });
          } else if (!hasExistingData) {
            // Just fill name and phone if available
            onChange({
              ...value,
              name: profile.full_name || '',
              phone: profile.phone || '',
            });
          }
        }
        setProfileLoaded(true);
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfileLoaded(true);
      }
    };

    loadProfile();
  }, [user, profileLoaded]);

  // Save address to profile if profile was empty
  const saveAddressToProfile = useCallback(async (addressData: CheckoutAddressData) => {
    if (!user || !profileWasEmpty) return;
    
    // Only save if we have complete address data
    if (!addressData.address.province || !addressData.address.city) return;

    try {
      await supabase
        .from('profiles')
        .update({
          full_name: addressData.name || undefined,
          phone: addressData.phone || undefined,
          province_id: addressData.address.province,
          province_name: addressData.address.provinceName,
          city_id: addressData.address.city,
          city_name: addressData.address.cityName,
          district_id: addressData.address.district || null,
          district_name: addressData.address.districtName || null,
          village_id: addressData.address.village || null,
          village_name: addressData.address.villageName || null,
          address_detail: addressData.address.detail || null,
        })
        .eq('user_id', user.id);
      
      // Mark as saved so we don't save again
      setProfileWasEmpty(false);
    } catch (error) {
      console.error('Error saving address to profile:', error);
    }
  }, [user, profileWasEmpty]);

  const handleNameChange = (name: string) => {
    onChange({ ...value, name });
  };

  const handlePhoneChange = (phone: string) => {
    onChange({ ...value, phone });
  };

  const handleAddressChange = (address: AddressData) => {
    const newData = {
      ...value,
      address,
      fullAddress: formatFullAddress(address),
    };
    onChange(newData);
    
    // Auto-save to profile if profile was empty and we have complete address
    if (profileWasEmpty && address.province && address.city) {
      saveAddressToProfile(newData);
    }
  };

  const handleLocationChange = (location: { lat: number; lng: number }) => {
    onChange({ ...value, location });
  };

  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">Info Penerima</h4>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="checkout-name" className="text-xs text-muted-foreground">
              Nama Penerima
            </Label>
            <Input
              id="checkout-name"
              placeholder="Nama lengkap penerima"
              value={value.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
            {errors?.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="checkout-phone" className="text-xs text-muted-foreground">
              No. Telepon (WhatsApp)
            </Label>
            <PhoneInput
              value={value.phone}
              onChange={handlePhoneChange}
              placeholder="08xxxxxxxxxx"
            />
            {errors?.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">Alamat Pengiriman</h4>
        </div>

        <AddressSelector
          value={value.address}
          onChange={handleAddressChange}
        />
        {errors?.address && (
          <p className="text-xs text-destructive">{errors.address}</p>
        )}
      </div>

      {/* Map Location Picker */}
      <div className="space-y-4">
        <LocationPicker
          value={value.location}
          onChange={handleLocationChange}
          merchantLocation={merchantLocation}
          onDistanceChange={onDistanceChange}
        />
        {errors?.location && (
          <p className="text-xs text-destructive">{errors.location}</p>
        )}
      </div>
    </div>
  );
}

export function createEmptyCheckoutAddress(): CheckoutAddressData {
  return {
    name: '',
    phone: '',
    address: createEmptyAddressData(),
    location: null,
    fullAddress: '',
  };
}