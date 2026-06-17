"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  categoryLabels,
  storefrontCategoryFilters,
  type Product,
  type ProductCategory,
} from "@/data/products";
import { PANEL_PRODUCTS_STORAGE_KEY, PRODUCTS_UPDATED_EVENT, readStoredProducts } from "@/lib/browser-storage";
import { formatMeticais } from "@/lib/whatsapp";

type Props = {
  initialProducts: Product[];
};

export function PublicMarketplace({ initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState<"todos" | ProductCategory>("todos");

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

  const filteredProducts = useMemo(() => {
    const publishedProducts = products.filter((product) => product.status === "publicado");

    if (activeCategory === "todos") {
      return publishedProducts;
    }

    return publishedProducts.filter((product) => product.categoria === activeCategory);
  }, [activeCategory, products]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <section className="overflow-hidden rounded-[2rem] bg-zinc-950 px-5 py-6 text-white shadow-xl shadow-zinc-950/10">
        <div className="flex items-center justify-end">
          <Link
            href="/painel"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/10"
          >
            Entrar
          </Link>
        </div>

        <div className="mt-5 flex items-start justify-between gap-4">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Marketplace via WhatsApp
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Personalizaplus
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-300 sm:text-base">
              Camisetas e quadros com encomenda rápida, sem cadastro e com atendimento direto pelo
              WhatsApp em Gaza, Moçambique.
            </p>
          </div>

          <div className="hidden rounded-3xl bg-white/5 px-4 py-3 text-right sm:block">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Itens disponíveis</p>
            <p className="mt-2 text-2xl font-bold">
              {products.filter((product) => product.status === "publicado").length}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Vitrine pública
            </p>
            <h2 className="mt-1 text-2xl font-bold text-zinc-950">Escolha o seu produto</h2>
          </div>
            <p className="text-sm text-zinc-500">Sem cadastro para comprar</p>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {storefrontCategoryFilters.map((category) => {
              const isActive = activeCategory === category;
              const label = category === "todos" ? "Todos" : categoryLabels[category];

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {label}
                </button>
              );
            })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/produto/${product.id}`}
              className="group overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm shadow-zinc-200/70 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                <Image
                  src={product.imagem}
                  alt={product.titulo}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  priority={product.codigo === "PP-001"}
                  unoptimized
                />
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-900">
                  {product.codigo}
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {categoryLabels[product.categoria]}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold leading-6 text-zinc-950">
                    {product.titulo}
                  </h3>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Preço</p>
                    <p className="text-xl font-bold text-emerald-700">
                      {formatMeticais(product.preco)} MT
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">
                    Ver produto
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-5 rounded-[1.75rem] border border-dashed border-zinc-300 bg-white px-5 py-8 text-center text-sm leading-6 text-zinc-600">
            Ainda não existem produtos nesta categoria.
          </div>
        ) : null}
      </section>
    </main>
  );
}
