export interface Bank {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
}

export const predefinedBanks: Bank[] = [
  {
    id: 'sbi',
    name: 'State Bank of India (SBI)',
    shortName: 'SBI',
    color: '#1E40AF',
    icon: '🏛️'
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortName: 'HDFC',
    color: '#DC2626',
    icon: '🏦'
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    color: '#EA580C',
    icon: '🏪'
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    shortName: 'Axis',
    color: '#7C2D12',
    icon: '🏢'
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortName: 'Kotak',
    color: '#DC2626',
    icon: '🏬'
  },
  {
    id: 'pnb',
    name: 'Punjab National Bank (PNB)',
    shortName: 'PNB',
    color: '#1D4ED8',
    icon: '🏛️'
  },
  {
    id: 'bob',
    name: 'Bank of Baroda (BOB)',
    shortName: 'BOB',
    color: '#EA580C',
    icon: '🏦'
  },
  {
    id: 'canara',
    name: 'Canara Bank',
    shortName: 'Canara',
    color: '#059669',
    icon: '🏪'
  },
  {
    id: 'union',
    name: 'Union Bank of India',
    shortName: 'Union',
    color: '#7C2D12',
    icon: '🏢'
  },
  {
    id: 'idfc',
    name: 'IDFC FIRST Bank',
    shortName: 'IDFC',
    color: '#7C3AED',
    icon: '🏬'
  },
  {
    id: 'cash',
    name: 'Cash in Hand',
    shortName: 'Cash',
    color: '#059669',
    icon: '💵'
  },
  {
    id: 'other',
    name: 'Other',
    shortName: 'Other',
    color: '#6B7280',
    icon: '🏦'
  }
];

export const getBankById = (bankId: string): Bank | undefined => {
  return predefinedBanks.find(bank => bank.id === bankId);
};

export const getBankColor = (bankId: string): string => {
  const bank = getBankById(bankId);
  return bank?.color || '#6B7280';
};

export const getBankIcon = (bankId: string): string => {
  const bank = getBankById(bankId);
  return bank?.icon || '🏦';
};