"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { buildWhatsAppLink, formatMeticais } from "@/lib/whatsapp";

type Props = {
  product: Product;
  seller?: {
    nome: string;
    whatsapp: string;
    localizacao: string;
  };
};

export function WhatsAppOrderPanel({ product, seller }: Props) {
  const [selectedColor, setSelectedColor] = useState(product.cores[0] ?? "");
  const [selectedSize, setSelectedSize] = useState(product.tamanhos[0] ?? "M");
  const [customStyle, setCustomStyle] = useState(false);
  const sellerInfo = seller ?? product.vendedor;
  const allowCustomStyle = product.permitePersonalizacao;

  const whatsappLink = useMemo(
    () =>
      buildWhatsAppLink({
        phone: sellerInfo.whatsapp,
        codigo: product.codigo,
        titulo: product.titulo,
        cor: selectedColor,
        tamanho: selectedSize,
        preco: product.preco,
        customStyle: allowCustomStyle && customStyle,
      }),
    [allowCustomStyle, customStyle, product, selectedColor, selectedSize, sellerInfo.whatsapp],
  );

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Personalize o pedido
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-950">
            Comprar via WhatsApp
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Escolha as opções normais ou ative a personalização total antes de enviar o pedido ao vendedor.
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm text-zinc-700">Código do Produto</p>
          <p className="mt-1 text-lg font-bold text-zinc-950">{product.codigo}</p>
          <p className="mt-2 text-sm text-zinc-600">
            Preço: <span className="font-semibold">{formatMeticais(product.preco)} MT</span>
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-zinc-900">Cor</p>
          <div className="flex flex-wrap gap-2">
            {product.cores.map((color) => {
              const active = selectedColor === color;

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-300"
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-zinc-900">Tamanho</p>
          <div className="grid grid-cols-4 gap-2">
            {product.tamanhos.map((size) => {
              const active = selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {allowCustomStyle ? (
          <button
            type="button"
            onClick={() => setCustomStyle((current) => !current)}
            className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
              customStyle
                ? "border-emerald-600 bg-emerald-50"
                : "border-zinc-300 bg-white hover:border-emerald-300"
            }`}
          >
            <span className="block text-sm font-semibold text-zinc-950">
              Personalizar do meu jeito
            </span>
            <span className="mt-1 block text-sm leading-6 text-zinc-600">
              {customStyle
                ? "Ativado. A mensagem vai indicar que a arte será totalmente customizada no chat."
                : "Ative esta opção se quiser combinar uma arte ou estamparia totalmente personalizada."}
            </span>
          </button>
        ) : (
          <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-left">
            <span className="block text-sm font-semibold text-zinc-950">
              Personalização indisponível
            </span>
            <span className="mt-1 block text-sm leading-6 text-zinc-600">
              Este produto é vendido no modelo apresentado, sem personalização total.
            </span>
          </div>
        )}

        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-14 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-center text-base font-semibold text-white transition hover:bg-emerald-700"
        >
          Comprar via WhatsApp
        </a>

        <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm leading-6 text-zinc-600">
          <p>
            Vendedor: <span className="font-medium text-zinc-900">{sellerInfo.nome}</span>
          </p>
          <p>
            Localização:{" "}
            <span className="font-medium text-zinc-900">{sellerInfo.localizacao}</span>
          </p>
          <p>
            Mensagem pronta com:{" "}
            <span className="font-medium text-zinc-900">
              {selectedColor} / {selectedSize}
            </span>
          </p>
          {allowCustomStyle && customStyle ? (
            <p>
              Estilo:{" "}
              <span className="font-medium text-zinc-900">Personalizar do meu jeito</span>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
