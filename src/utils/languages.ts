export interface Language {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  rtl?: boolean;
}

export const worldLanguages: Language[] = [
  // Major Languages
  { code: 'en', name: 'English', nativeName: 'English', region: 'Major Languages' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', region: 'Major Languages' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', region: 'Major Languages' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'Major Languages' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'Major Languages' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'Major Languages', rtl: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'Major Languages' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'Major Languages' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'Major Languages' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'Major Languages' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'Major Languages' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'Major Languages' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa', region: 'Major Languages' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'Major Languages' },
  { code: 'fr', name: 'French', nativeName: 'Français', region: 'Major Languages' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'Major Languages' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'Major Languages' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', region: 'Major Languages' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'Major Languages' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Major Languages' },

  // European Languages
  { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'European Languages' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', region: 'European Languages' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', region: 'European Languages' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', region: 'European Languages' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', region: 'European Languages' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', region: 'European Languages' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', region: 'European Languages' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', region: 'European Languages' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', region: 'European Languages' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', region: 'European Languages' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', region: 'European Languages' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', region: 'European Languages' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', region: 'European Languages' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', region: 'European Languages' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', region: 'European Languages' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', region: 'European Languages' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', region: 'European Languages' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', region: 'European Languages' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', region: 'European Languages' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', region: 'European Languages' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', region: 'European Languages' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', region: 'European Languages' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', region: 'European Languages' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', region: 'European Languages' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', region: 'European Languages' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskera', region: 'European Languages' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', region: 'European Languages' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', region: 'European Languages' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', region: 'European Languages' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', region: 'European Languages' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', region: 'European Languages' },
  { code: 'me', name: 'Montenegrin', nativeName: 'Crnogorski', region: 'European Languages' },

  // Asian Languages
  { code: 'th', name: 'Thai', nativeName: 'ไทย', region: 'Asian Languages' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'Asian Languages', rtl: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'Asian Languages' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Asian Languages' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'Asian Languages' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'Asian Languages' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', region: 'Asian Languages' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', region: 'Asian Languages' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', region: 'Asian Languages' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', region: 'Asian Languages' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', region: 'Asian Languages' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', region: 'Asian Languages' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', region: 'Asian Languages' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', region: 'Asian Languages' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', region: 'Asian Languages' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', region: 'Asian Languages' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', region: 'Asian Languages' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', region: 'Asian Languages' },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmençe', region: 'Asian Languages' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', region: 'Asian Languages' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', region: 'Asian Languages' },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་ཡིག', region: 'Asian Languages' },
  { code: 'dz', name: 'Dzongkha', nativeName: 'རྫོང་ཁ', region: 'Asian Languages' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Asian Languages' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Asian Languages' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', region: 'Asian Languages' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Cebuano', region: 'Asian Languages' },

  // Middle Eastern Languages
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', region: 'Middle Eastern Languages', rtl: true },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', region: 'Middle Eastern Languages', rtl: true },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', region: 'Middle Eastern Languages' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', region: 'Middle Eastern Languages', rtl: true },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', region: 'Middle Eastern Languages', rtl: true },
  { code: 'ckb', name: 'Sorani Kurdish', nativeName: 'کوردیی ناوەندی', region: 'Middle Eastern Languages', rtl: true },

  // African Languages
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'African Languages' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', region: 'African Languages' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo', region: 'African Languages' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', region: 'African Languages' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', region: 'African Languages' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', region: 'African Languages' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', region: 'African Languages' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', region: 'African Languages' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', region: 'African Languages' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', region: 'African Languages' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', region: 'African Languages' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', region: 'African Languages' },
  { code: 'tn', name: 'Setswana', nativeName: 'Setswana', region: 'African Languages' },
  { code: 'ss', name: 'Siswati', nativeName: 'siSwati', region: 'African Languages' },
  { code: 've', name: 'Venda', nativeName: 'Tshivenḓa', region: 'African Languages' },
  { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga', region: 'African Languages' },
  { code: 'nr', name: 'Ndebele', nativeName: 'isiNdebele', region: 'African Languages' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', region: 'African Languages' },
  { code: 'rn', name: 'Kirundi', nativeName: 'Ikirundi', region: 'African Languages' },
  { code: 'lg', name: 'Luganda', nativeName: 'Luganda', region: 'African Languages' },
  { code: 'ak', name: 'Akan', nativeName: 'Akan', region: 'African Languages' },
  { code: 'tw', name: 'Twi', nativeName: 'Twi', region: 'African Languages' },
  { code: 'ee', name: 'Ewe', nativeName: 'Eʋegbe', region: 'African Languages' },
  { code: 'ff', name: 'Fulah', nativeName: 'Fulfulde', region: 'African Languages' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof', region: 'African Languages' },
  { code: 'bm', name: 'Bambara', nativeName: 'Bamanankan', region: 'African Languages' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', region: 'African Languages' },

  // American Languages
  { code: 'qu', name: 'Quechua', nativeName: 'Runa Simi', region: 'American Languages' },
  { code: 'gn', name: 'Guarani', nativeName: 'Avañe\'ẽ', region: 'American Languages' },
  { code: 'ay', name: 'Aymara', nativeName: 'Aymar aru', region: 'American Languages' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl ayisyen', region: 'American Languages' },
  { code: 'nv', name: 'Navajo', nativeName: 'Diné bizaad', region: 'American Languages' },
  { code: 'chr', name: 'Cherokee', nativeName: 'ᏣᎳᎩ ᎦᏬᏂᎯᏍᏗ', region: 'American Languages' },
  { code: 'iu', name: 'Inuktitut', nativeName: 'ᐃᓄᒃᑎᑐᑦ', region: 'American Languages' },

  // Oceanic Languages
  { code: 'mi', name: 'Māori', nativeName: 'Te Reo Māori', region: 'Oceanic Languages' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa', region: 'Oceanic Languages' },
  { code: 'to', name: 'Tongan', nativeName: 'Lea Fakatonga', region: 'Oceanic Languages' },
  { code: 'fj', name: 'Fijian', nativeName: 'Vosa Vakaviti', region: 'Oceanic Languages' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', region: 'Oceanic Languages' },
  { code: 'ty', name: 'Tahitian', nativeName: 'Reo Tahiti', region: 'Oceanic Languages' },

  // Constructed Languages
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', region: 'Constructed Languages' },
  { code: 'ia', name: 'Interlingua', nativeName: 'Interlingua', region: 'Constructed Languages' },
  { code: 'ie', name: 'Interlingue', nativeName: 'Interlingue', region: 'Constructed Languages' },
  { code: 'vo', name: 'Volapük', nativeName: 'Volapük', region: 'Constructed Languages' },

  // Sign Languages
  { code: 'ase', name: 'American Sign Language', nativeName: 'ASL', region: 'Sign Languages' },
  { code: 'bfi', name: 'British Sign Language', nativeName: 'BSL', region: 'Sign Languages' },
  { code: 'fsl', name: 'French Sign Language', nativeName: 'LSF', region: 'Sign Languages' },

  // Historical Languages
  { code: 'la', name: 'Latin', nativeName: 'Latina', region: 'Historical Languages' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', region: 'Historical Languages' },
  { code: 'grc', name: 'Ancient Greek', nativeName: 'Ἀρχαία ἑλληνικὴ', region: 'Historical Languages' },
  { code: 'got', name: 'Gothic', nativeName: '𐌲𐌿𐍄𐌹𐍃𐌺', region: 'Historical Languages' },
  { code: 'non', name: 'Old Norse', nativeName: 'Dǫnsk tunga', region: 'Historical Languages' },
  { code: 'ang', name: 'Old English', nativeName: 'Ænglisc', region: 'Historical Languages' },

  // Regional Variants
  { code: 'en-US', name: 'English (US)', nativeName: 'English (US)', region: 'Regional Variants' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)', region: 'Regional Variants' },
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English (Australia)', region: 'Regional Variants' },
  { code: 'en-CA', name: 'English (Canada)', nativeName: 'English (Canada)', region: 'Regional Variants' },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)', region: 'Regional Variants' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', region: 'Regional Variants' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', region: 'Regional Variants' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', region: 'Regional Variants' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', region: 'Regional Variants' },
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)', region: 'Regional Variants' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)', region: 'Regional Variants' },
  { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch (Deutschland)', region: 'Regional Variants' },
  { code: 'de-AT', name: 'German (Austria)', nativeName: 'Deutsch (Österreich)', region: 'Regional Variants' },
  { code: 'de-CH', name: 'German (Switzerland)', nativeName: 'Deutsch (Schweiz)', region: 'Regional Variants' },
];

export function getLanguageByCode(code: string): Language | undefined {
  return worldLanguages.find(language => language.code === code);
}

export function getLanguageName(code: string): string {
  const language = getLanguageByCode(code);
  return language?.name || 'English';
}

export function getLanguageNativeName(code: string): string {
  const language = getLanguageByCode(code);
  return language?.nativeName || 'English';
}

export function isRTLLanguage(code: string): boolean {
  const language = getLanguageByCode(code);
  return language?.rtl || false;
}

// Group languages by region for better UX
export const languageRegions = {
  'Major Languages': ['en', 'zh', 'zh-TW', 'es', 'hi', 'ar', 'pt', 'bn', 'ru', 'ja', 'pa', 'de', 'jv', 'ko', 'fr', 'te', 'mr', 'tr', 'ta', 'vi'],
  'European Languages': ['it', 'pl', 'uk', 'nl', 'ro', 'el', 'cs', 'hu', 'sv', 'be', 'da', 'fi', 'no', 'sk', 'bg', 'hr', 'lt', 'sl', 'lv', 'et', 'mk', 'mt', 'is', 'ga', 'cy', 'eu', 'ca', 'gl', 'sq', 'sr', 'bs', 'me'],
  'Asian Languages': ['th', 'ur', 'gu', 'kn', 'ml', 'or', 'as', 'ne', 'si', 'my', 'km', 'lo', 'ka', 'hy', 'az', 'kk', 'ky', 'tg', 'tk', 'uz', 'mn', 'bo', 'dz', 'ms', 'id', 'tl', 'ceb'],
  'Middle Eastern Languages': ['fa', 'he', 'ku', 'ps', 'sd', 'ckb'],
  'African Languages': ['sw', 'am', 'om', 'ti', 'so', 'ha', 'yo', 'ig', 'zu', 'xh', 'af', 'st', 'tn', 'ss', 've', 'ts', 'nr', 'rw', 'rn', 'lg', 'ak', 'tw', 'ee', 'ff', 'wo', 'bm', 'mg'],
  'American Languages': ['qu', 'gn', 'ay', 'ht', 'nv', 'chr', 'iu'],
  'Oceanic Languages': ['mi', 'sm', 'to', 'fj', 'haw', 'ty'],
  'Regional Variants': ['en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX', 'es-AR', 'pt-BR', 'pt-PT', 'fr-FR', 'fr-CA', 'de-DE', 'de-AT', 'de-CH'],
  'Constructed Languages': ['eo', 'ia', 'ie', 'vo'],
  'Sign Languages': ['ase', 'bfi', 'fsl'],
  'Historical Languages': ['la', 'sa', 'grc', 'got', 'non', 'ang']
};