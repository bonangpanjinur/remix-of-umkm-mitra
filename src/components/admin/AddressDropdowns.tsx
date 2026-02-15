import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
  Region,
} from '@/lib/addressApi';

interface AddressDropdownsProps {
  provinceCode: string;
  regencyCode: string;
  districtCode: string;
  villageCode: string;
  provinceName: string;
  regencyName: string;
  districtName: string;
  villageName: string;
  onChange: (data: {
    provinceCode: string;
    provinceName: string;
    regencyCode: string;
    regencyName: string;
    districtCode: string;
    districtName: string;
    villageCode: string;
    villageName: string;
  }) => void;
  disabled?: boolean;
}

export function AddressDropdowns({
  provinceCode,
  regencyCode,
  districtCode,
  villageCode,
  provinceName,
  regencyName,
  districtName,
  villageName,
  onChange,
  disabled,
}: AddressDropdownsProps) {
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load dependent data when codes change (for edit mode)
  useEffect(() => {
    if (provinceCode && provinces.length > 0) {
      const province = provinces.find(p => p.code === provinceCode);
      if (province && province.name !== provinceName) {
        onChange({
          provinceCode,
          provinceName: province.name,
          regencyCode,
          regencyName,
          districtCode,
          districtName,
          villageCode,
          villageName,
        });
      }
      loadRegencies(provinceCode);
    }
  }, [provinceCode, provinces.length]);

  useEffect(() => {
    if (regencyCode && regencies.length > 0) {
      const regency = regencies.find(r => r.code === regencyCode);
      if (regency && regency.name !== regencyName) {
        onChange({
          provinceCode,
          provinceName,
          regencyCode,
          regencyName: regency.name,
          districtCode,
          districtName,
          villageCode,
          villageName,
        });
      }
      loadDistricts(regencyCode);
    }
  }, [regencyCode, regencies.length]);

  useEffect(() => {
    if (districtCode && districts.length > 0) {
      const district = districts.find(d => d.code === districtCode);
      if (district && district.name !== districtName) {
        onChange({
          provinceCode,
          provinceName,
          regencyCode,
          regencyName,
          districtCode,
          districtName: district.name,
          villageCode,
          villageName,
        });
      }
      loadVillages(districtCode);
    }
  }, [districtCode, districts.length]);

  useEffect(() => {
    if (villageCode && villages.length > 0) {
      const village = villages.find(v => v.code === villageCode);
      if (village && village.name !== villageName) {
        onChange({
          provinceCode,
          provinceName,
          regencyCode,
          regencyName,
          districtCode,
          districtName,
          villageCode,
          villageName: village.name,
        });
      }
    }
  }, [villageCode, villages.length]);

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const data = await fetchProvinces();
      setProvinces(data);
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadRegencies = async (code: string) => {
    setLoadingRegencies(true);
    try {
      const data = await fetchRegencies(code);
      setRegencies(data);
    } catch (error) {
      console.error('Error loading regencies:', error);
    } finally {
      setLoadingRegencies(false);
    }
  };

  const loadDistricts = async (code: string) => {
    setLoadingDistricts(true);
    try {
      const data = await fetchDistricts(code);
      setDistricts(data);
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadVillages = async (code: string) => {
    setLoadingVillages(true);
    try {
      const data = await fetchVillages(code);
      setVillages(data);
    } catch (error) {
      console.error('Error loading villages:', error);
    } finally {
      setLoadingVillages(false);
    }
  };

  const handleProvinceChange = async (code: string) => {
    const selected = provinces.find(p => p.code === code);
    if (!selected) return;

    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    onChange({
      provinceCode: code,
      provinceName: selected.name,
      regencyCode: '',
      regencyName: '',
      districtCode: '',
      districtName: '',
      villageCode: '',
      villageName: '',
    });

    loadRegencies(code);
  };

  // Pre-load regencies when province dropdown is hovered or focused
  const preLoadRegencies = () => {
    if (provinceCode && regencies.length === 0 && !loadingRegencies) {
      loadRegencies(provinceCode);
    }
  };

  const handleRegencyChange = async (code: string) => {
    const selected = regencies.find(r => r.code === code);
    if (!selected) return;

    setDistricts([]);
    setVillages([]);

    onChange({
      provinceCode,
      provinceName,
      regencyCode: code,
      regencyName: selected.name,
      districtCode: '',
      districtName: '',
      villageCode: '',
      villageName: '',
    });

    loadDistricts(code);
  };

  // Pre-load districts when regency dropdown is hovered or focused
  const preLoadDistricts = () => {
    if (regencyCode && districts.length === 0 && !loadingDistricts) {
      loadDistricts(regencyCode);
    }
  };

  const handleDistrictChange = async (code: string) => {
    const selected = districts.find(d => d.code === code);
    if (!selected) return;

    setVillages([]);

    onChange({
      provinceCode,
      provinceName,
      regencyCode,
      regencyName,
      districtCode: code,
      districtName: selected.name,
      villageCode: '',
      villageName: '',
    });

    loadVillages(code);
  };

  // Pre-load villages when district dropdown is hovered or focused
  const preLoadVillages = () => {
    if (districtCode && villages.length === 0 && !loadingVillages) {
      loadVillages(districtCode);
    }
  };

  const handleVillageChange = (code: string) => {
    const selected = villages.find(v => v.code === code);
    if (!selected) return;

    onChange({
      provinceCode,
      provinceName,
      regencyCode,
      regencyName,
      districtCode,
      districtName,
      villageCode: code,
      villageName: selected.name,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Provinsi *</Label>
        <Select
          value={provinceCode}
          onValueChange={handleProvinceChange}
          disabled={loadingProvinces || disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingProvinces ? "Memuat..." : "Pilih Provinsi"} />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((p) => (
              <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2" onMouseEnter={preLoadRegencies} onFocusCapture={preLoadRegencies}>
        <Label>Kabupaten/Kota *</Label>
        <Select
          value={regencyCode}
          onValueChange={handleRegencyChange}
          disabled={!provinceCode || loadingRegencies || disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingRegencies ? "Memuat..." : "Pilih Kabupaten/Kota"} />
          </SelectTrigger>
          <SelectContent>
            {regencies.map((r) => (
              <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2" onMouseEnter={preLoadDistricts} onFocusCapture={preLoadDistricts}>
        <Label>Kecamatan *</Label>
        <Select
          value={districtCode}
          onValueChange={handleDistrictChange}
          disabled={!regencyCode || loadingDistricts || disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingDistricts ? "Memuat..." : "Pilih Kecamatan"} />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2" onMouseEnter={preLoadVillages} onFocusCapture={preLoadVillages}>
        <Label>Kelurahan/Desa *</Label>
        <Select
          value={villageCode}
          onValueChange={handleVillageChange}
          disabled={!districtCode || loadingVillages || disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingVillages ? "Memuat..." : "Pilih Kelurahan/Desa"} />
          </SelectTrigger>
          <SelectContent>
            {villages.map((v) => (
              <SelectItem key={v.code} value={v.code}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
