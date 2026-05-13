import type { Item, Source } from "./types";

export function neededFromSource(items: Item[], source: Source): Item[] {
  return items.filter(i => i.source === source && i.current < i.par);
}

function pluralize(name: string, qty: number): string {
  if (qty <= 1 || name.endsWith("s")) return name;
  if (/[aeiouáéíóú]$/i.test(name)) return name + "s";
  return name + "es";
}

export function buildMotoMessage(items: Item[]): string {
  const needed = neededFromSource(items, "moto");
  if (needed.length === 0) return "hola! todo bien por ahora, gracias 🙏";

  const lines = needed.map(i => {
    const qty = i.par - i.current;
    const emoji = i.emoji ? `${i.emoji} ` : "";
    // For unit-less ("u") items, drop the "u de" and pluralize the noun.
    if (!i.unit || i.unit === "u") {
      return `• ${qty} ${emoji}${pluralize(i.name_es, qty)}`;
    }
    return `• ${qty} ${i.unit} de ${emoji}${i.name_es}`;
  });
  return ["hola! pedido por favor:", "", ...lines, "", "gracias!"].join("\n");
}

export function buildWhatsAppHref(phone: string, message: string): string | null {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 7) return null;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}
