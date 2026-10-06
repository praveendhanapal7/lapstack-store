// Shared validation for saved addresses. Returns { value } or { error }.
export function readAddress(b) {
  const t = (k, n) => String(b?.[k] || '').trim().slice(0, n);
  const v = { name: t('name', 80), phone: String(b?.phone || '').replace(/\D/g, '').slice(-10), address: t('address', 300), city: t('city', 80), pincode: t('pincode', 6) };
  if (v.name.length < 2) return { error: 'Please enter the name.' };
  if (v.phone.length !== 10) return { error: 'Please enter a 10 digit phone number.' };
  if (v.address.length < 5) return { error: 'Please enter the full address.' };
  if (!v.city) return { error: 'Please enter the city.' };
  if (!/^\d{6}$/.test(v.pincode)) return { error: 'Please enter a 6 digit pincode.' };
  return { value: v };
}
