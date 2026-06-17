"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WhatsAppOrderPanel } from "@/components/whatsapp-order-panel";
import { categoryLabels, type Product } from "@/data/products";
import { PANEL_PRODUCTS_STORAGE_KEY, PRODUCTS_UPDATED_EVENT, readStoredProducts } from "@/lib/browser-storage";
import { formatMeticais, isValidMozambiqueWhatsApp, normalizeMozambiqueWhatsApp } from "@/lib/whatsapp";

type Props = {
  id: string;
  initialProducts: Product[];
  sellerQuery: {
    sellerName?: string;
    sellerPhone?: string;
    sellerLocation?: string;
  };
};

export function ProductDetailsView({ id, initialProducts, sellerQuery }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    const syncProducts = () => {
      setProducts(readStoredProducts(initialProducts));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PANEL_PRODUCTS_STORAGE_KEY) {
        syncProducts();
      }
    };

    syncProducts();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, syncProducts);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, syncProducts);
      window.removeEventListener("storage", handleStorage);
    };
  }, [initialProducts]);

  const product = useMemo(
    () =>
      products.find(
        (currentProduct) => currentProduct.id === id && currentProduct.status === "publicado",
      ),
    [id, products],
  );

  if (!product) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 pb-10 pt-4 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
        >
          ← Voltar para a vitrine
        </Link>

        <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 text-center shadow-sm shadow-zinc-200/70">
          <h1 className="text-2xl font-bold text-zinc-950">Produto não encontrado</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Este item pode ter sido removido ou ainda não foi carregado no armazenamento local.
          </p>
        </section>
      </main>
    );
  }

  const hasCustomSeller =
    typeof sellerQuery.sellerName === "string" &&
    typeof sellerQuery.sellerPhone === "string" &&
    sellerQuery.sellerName.trim().length > 0 &&
    isValidMozambiqueWhatsApp(sellerQuery.sellerPhone);

  const sellerInfo = hasCustomSeller
    ? {
        nome: sellerQuery.sellerName!.trim(),
        whatsapp: normalizeMozambiqueWhatsApp(sellerQuery.sellerPhone!),
        localizacao: sellerQuery.sellerLocation?.trim() || "Gaza, Moçambique",
      }
    : product.vendedor;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <Link
        href="/"
        className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
      >
        ← Voltar para a vitrine
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm shadow-zinc-200/70">
          <div className="relative aspect-[4/3] bg-zinc-100">
            <Image
              src={product.imagem}
              alt={product.titulo}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
              unoptimized
            />
          </div>

          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                {categoryLabels[product.categoria]}
              </span>
              <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                {product.codigo}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-bold leading-tight text-zinc-950">{product.titulo}</h1>
              <p className="mt-3 text-base leading-7 text-zinc-600">{product.descricao}</p>
            </div>

            <div className="grid gap-3 rounded-3xl bg-zinc-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Preço</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">
                  {formatMeticais(product.preco)} MT
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Código</p>
                <p className="mt-1 font-semibold text-zinc-900">{product.codigo}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Vendedor</p>
                <p className="mt-1 font-semibold text-zinc-900">{sellerInfo.nome}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Personalização</p>
                <p className="mt-1 font-semibold text-zinc-900">
                  {product.permitePersonalizacao ? "Disponível" : "Indisponível"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <WhatsAppOrderPanel product={product} seller={sellerInfo} />
      </div>
    </main>
  );
}
