import React from 'react';

export interface Setting {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

export interface Economics {
  commissionPercent: number;
  clickFeePercent: number;
  payoutFeePercent: number;
  onlineMarginPercent: number;
  cashMarginPercent: number;
  examplePer100k: {
    online: {
      commission: number;
      clickFee: number;
      payoutFee: number;
      platformNet: number;
      sellerNet: number;
    };
    cash: {
      commission: number;
      platformNet: number;
      sellerNet: number;
    };
  };
  warnings: string[];
}

export type SettingsTab = 'finance' | 'legal' | 'fiscal' | 'risk' | 'inventory';

export interface SettingMeta {
  tab: SettingsTab;
  label: string;
  category: string;
  unit?: string;
  icon: React.ElementType;
  hint: string;
  min?: number;
  max?: number;
  isSecret?: boolean;
  options?: { value: string; label: string; desc?: string }[];
}

export interface SoliqStatus {
  hasKey: boolean;
  keyPath: string;
  keyFileName: string;
  keyFileSize: number;
  hasPassword: boolean;
  hasToken: boolean;
  isTokenExpired: boolean;
  tokenExpiresAt: string;
  operatorTin: string;
  tokenPreview: string;
  certificate?: {
    companyName: string;
    directorName: string;
    tin: string;
    pinfl: string;
    region: string;
    validFrom: string;
    validTo: string;
    issuer: string;
    verified: boolean;
  };
}
