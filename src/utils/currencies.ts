export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const worldCurrencies: Currency[] = [
  // Major Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2 },
  
  // Asian Currencies
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 0 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimals: 2 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimals: 0 },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', decimals: 2 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', decimals: 2 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', decimals: 2 },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', decimals: 2 },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs', decimals: 2 },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', decimals: 2 },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', decimals: 2 },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', decimals: 2 },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', decimals: 2 },
  { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$', decimals: 2 },
  
  // Middle Eastern Currencies
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimals: 2 },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', decimals: 2 },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', decimals: 3 },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', decimals: 3 },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼', decimals: 3 },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', decimals: 3 },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', decimals: 2 },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', decimals: 2 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimals: 2 },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', decimals: 2 },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', decimals: 3 },
  { code: 'SYP', name: 'Syrian Pound', symbol: '£', decimals: 2 },
  { code: 'YER', name: 'Yemeni Rial', symbol: '﷼', decimals: 2 },
  
  // African Currencies
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 2 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', decimals: 2 },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', decimals: 2 },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', decimals: 3 },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', decimals: 2 },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', decimals: 3 },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', decimals: 2 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', decimals: 0 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', decimals: 2 },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', decimals: 0 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', decimals: 2 },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', decimals: 0 },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', decimals: 0 },
  { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar', decimals: 2 },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', decimals: 2 },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨', decimals: 2 },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', decimals: 2 },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', decimals: 2 },
  { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'L', decimals: 2 },
  { code: 'LSL', name: 'Lesotho Loti', symbol: 'L', decimals: 2 },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', decimals: 2 },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'Z$', decimals: 2 },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', decimals: 2 },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', decimals: 2 },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', decimals: 2 },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'FC', decimals: 2 },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', decimals: 2 },
  { code: 'GNF', name: 'Guinean Franc', symbol: 'FG', decimals: 0 },
  { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$', decimals: 2 },
  { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le', decimals: 2 },
  { code: 'CVE', name: 'Cape Verdean Escudo', symbol: '$', decimals: 2 },
  { code: 'STN', name: 'São Tomé and Príncipe Dobra', symbol: 'Db', decimals: 2 },
  { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj', decimals: 0 },
  { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk', decimals: 2 },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'S', decimals: 2 },
  { code: 'SDP', name: 'Sudanese Pound', symbol: 'ج.س.', decimals: 2 },
  { code: 'SSP', name: 'South Sudanese Pound', symbol: '£', decimals: 2 },
  { code: 'CFA', name: 'Comorian Franc', symbol: 'CF', decimals: 0 },
  
  // European Currencies
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimals: 2 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimals: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimals: 2 },
  { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr', decimals: 0 },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', decimals: 2 },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimals: 2 },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimals: 0 },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', decimals: 2 },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', decimals: 2 },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', decimals: 2 },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин.', decimals: 2 },
  { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark', symbol: 'KM', decimals: 2 },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', decimals: 2 },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', decimals: 2 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimals: 2 },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', decimals: 2 },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', decimals: 2 },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', decimals: 2 },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', decimals: 2 },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', decimals: 2 },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', decimals: 2 },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', decimals: 2 },
  { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'лв', decimals: 2 },
  { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM', decimals: 2 },
  { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'T', decimals: 2 },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'лв', decimals: 2 },
  
  // North American Currencies
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimals: 2 },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', decimals: 2 },
  { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$', decimals: 2 },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', decimals: 2 },
  { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', decimals: 2 },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', decimals: 2 },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', decimals: 2 },
  { code: 'CUP', name: 'Cuban Peso', symbol: '₱', decimals: 2 },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$', decimals: 2 },
  { code: 'HTG', name: 'Haitian Gourde', symbol: 'G', decimals: 2 },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', decimals: 2 },
  { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: 'TT$', decimals: 2 },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$', decimals: 2 },
  { code: 'XCD', name: 'East Caribbean Dollar', symbol: 'EC$', decimals: 2 },
  { code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$', decimals: 2 },
  { code: 'BMD', name: 'Bermudian Dollar', symbol: '$', decimals: 2 },
  { code: 'KYD', name: 'Cayman Islands Dollar', symbol: '$', decimals: 2 },
  { code: 'AWG', name: 'Aruban Florin', symbol: 'ƒ', decimals: 2 },
  { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: 'ƒ', decimals: 2 },
  
  // South American Currencies
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimals: 2 },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', decimals: 0 },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', decimals: 2 },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', decimals: 2 },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', decimals: 2 },
  { code: 'PYG', name: 'Paraguayan Guaraní', symbol: 'Gs', decimals: 0 },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: '$b', decimals: 2 },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs', decimals: 2 },
  { code: 'GYD', name: 'Guyanese Dollar', symbol: 'G$', decimals: 2 },
  { code: 'SRD', name: 'Surinamese Dollar', symbol: '$', decimals: 2 },
  { code: 'FKP', name: 'Falkland Islands Pound', symbol: '£', decimals: 2 },
  
  // Oceania Currencies
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', decimals: 2 },
  { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K', decimals: 2 },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$', decimals: 2 },
  { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT', decimals: 0 },
  { code: 'NCF', name: 'CFP Franc', symbol: '₣', decimals: 0 },
  { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', decimals: 2 },
  { code: 'WST', name: 'Samoan Tālā', symbol: 'WS$', decimals: 2 },
  { code: 'TVD', name: 'Tuvaluan Dollar', symbol: '$', decimals: 2 },
  { code: 'KID', name: 'Kiribati Dollar', symbol: '$', decimals: 2 },
  { code: 'NRD', name: 'Nauruan Dollar', symbol: '$', decimals: 2 },
  { code: 'MHD', name: 'Marshallese Dollar', symbol: '$', decimals: 2 },
  { code: 'FMD', name: 'Micronesian Dollar', symbol: '$', decimals: 2 },
  { code: 'PWD', name: 'Palauan Dollar', symbol: '$', decimals: 2 },
  
  // Special Currencies
  { code: 'XDR', name: 'Special Drawing Rights', symbol: 'SDR', decimals: 2 },
  { code: 'XAU', name: 'Gold (troy ounce)', symbol: 'oz t', decimals: 4 },
  { code: 'XAG', name: 'Silver (troy ounce)', symbol: 'oz t', decimals: 4 },
  { code: 'XPT', name: 'Platinum (troy ounce)', symbol: 'oz t', decimals: 4 },
  { code: 'XPD', name: 'Palladium (troy ounce)', symbol: 'oz t', decimals: 4 },
];

export function getCurrencyByCode(code: string): Currency | undefined {
  return worldCurrencies.find(currency => currency.code === code);
}

export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const formattedAmount = amount.toLocaleString(undefined, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals
  });

  return `${currency.symbol}${formattedAmount}`;
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  return currency?.symbol || '$';
}

export function getCurrencyDecimals(currencyCode: string): number {
  const currency = getCurrencyByCode(currencyCode);
  return currency?.decimals || 2;
}

// Group currencies by region for better UX
export const currencyRegions = {
  'Major Currencies': ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'],
  'Asia Pacific': ['CNY', 'INR', 'KRW', 'SGD', 'HKD', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'TWD', 'PKR', 'BDT', 'LKR', 'NPR', 'MMK', 'KHR', 'LAK', 'BND', 'MOP'],
  'Middle East': ['AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'ILS', 'TRY', 'IRR', 'IQD', 'SYP', 'YER'],
  'Africa': ['ZAR', 'NGN', 'EGP', 'MAD', 'TND', 'DZD', 'LYD', 'ETB', 'KES', 'UGX', 'TZS', 'RWF', 'GHS', 'XOF', 'XAF', 'MGA', 'MUR', 'SCR', 'BWP', 'NAD', 'SZL', 'LSL', 'ZMW', 'ZWL', 'MWK', 'MZN', 'AOA', 'CDF', 'GMD', 'GNF', 'LRD', 'SLL', 'CVE', 'STN', 'DJF', 'ERN', 'SOS', 'SDP', 'SSP', 'CFA'],
  'Europe': ['NOK', 'SEK', 'DKK', 'ISK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RSD', 'BAM', 'MKD', 'ALL', 'RUB', 'UAH', 'BYN', 'MDL', 'GEL', 'AMD', 'AZN', 'KZT', 'KGS', 'TJS', 'TMT', 'UZS'],
  'North America': ['MXN', 'GTQ', 'BZD', 'HNL', 'NIO', 'CRC', 'PAB', 'CUP', 'DOP', 'HTG', 'JMD', 'TTD', 'BBD', 'XCD', 'BSD', 'BMD', 'KYD', 'AWG', 'ANG'],
  'South America': ['BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'PYG', 'BOB', 'VES', 'GYD', 'SRD', 'FKP'],
  'Oceania': ['FJD', 'PGK', 'SBD', 'VUV', 'NCF', 'TOP', 'WST', 'TVD', 'KID', 'NRD', 'MHD', 'FMD', 'PWD'],
  'Special': ['XDR', 'XAU', 'XAG', 'XPT', 'XPD']
};