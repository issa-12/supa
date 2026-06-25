export function detectLang(text: string): 'ar' | 'fr' | 'en' {
  if (/[؀-ۿ]/.test(text)) return 'ar';
  if (/\b(le|la|les|de|du|un|une|est|je|vous|nous|ils|elles|que|qui|pour|avec|sur|dans|par|au|aux)\b/i.test(text)) return 'fr';
  return 'en';
}
