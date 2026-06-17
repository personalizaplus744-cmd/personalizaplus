type BuildWhatsAppLinkParams = {
  phone: string;
  codigo: string;
  titulo: string;
  cor: string;
  tamanho: string;
  preco: number;
  customStyle?: boolean;
};

export function formatMeticais(value: number) {
  return new Intl.NumberFormat("pt-MZ").format(value);
}

export function sanitizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function normalizeMozambiqueWhatsApp(phone: string) {
  const digits = sanitizePhone(phone);

  if (digits.startsWith("258")) {
    return `+${digits}`;
  }

  if (digits.length === 9) {
    return `+258${digits}`;
  }

  return phone;
}

export function isValidMozambiqueWhatsApp(phone: string) {
  return /^\+258\d{9}$/.test(normalizeMozambiqueWhatsApp(phone));
}

export function buildWhatsAppLink({
  phone,
  codigo,
  titulo,
  cor,
  tamanho,
  preco,
  customStyle = false,
}: BuildWhatsAppLinkParams) {
  const message =
    "🛒 *NOVO PEDIDO - PERSONALIZAPLUS*\n\n" +
    `🔹 *Código:* ${codigo}\n` +
    `🔹 *Item:* ${titulo}\n` +
    `🔹 *Especificações:* Cor: ${cor} / Tamanho: ${tamanho}\n` +
    `🔹 *Preço:* ${formatMeticais(preco)} MT` +
    (customStyle
      ? "\n🎨 *Estilo:* Quero personalizar este modelo do meu jeito! (Vamos combinar a arte no chat)."
      : "");

  return `https://wa.me/${sanitizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
