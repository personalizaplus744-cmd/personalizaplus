"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { formatMeticais } from "@/lib/whatsapp";

type Props = {
  product: Product;
  seller: {
    nome: string;
    whatsapp: string;
    localizacao: string;
  };
};

function normalizeColorName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getColorSwatch(value: string) {
  const color = normalizeColorName(value);

  if (color.includes("preto")) return "#18181b";
  if (color.includes("branco")) return "#f8fafc";
  if (color.includes("vermelho")) return "#dc2626";
  if (color.includes("azul")) return "#2563eb";
  if (color.includes("verde")) return "#059669";
  if (color.includes("mostarda")) return "#d97706";
  if (color.includes("madeira")) return "#a16207";
  if (color.includes("natural")) return "#d6d3d1";
  if (color.includes("dourado")) return "#ca8a04";
  if (color.includes("cinza")) return "#71717a";
  if (color.includes("bege")) return "#d6b78a";
  if (color.includes("rosa")) return "#ec4899";
  if (color.includes("lilas")) return "#8b5cf6";
  if (color.includes("transparente")) return "#cbd5e1";
  if (color.includes("prata")) return "#94a3b8";
  if (color.includes("castanho")) return "#92400e";

  return "#10b981";
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number,
) {
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function drawChip(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  background: string,
  color: string,
) {
  ctx.font = "600 28px Arial";
  const width = Math.max(150, ctx.measureText(label).width + 44);

  ctx.fillStyle = background;
  drawRoundedRect(ctx, x, y, width, 54, 27);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + 22, y + 29);

  return width;
}

async function loadPosterImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export function PosterGenerator({ product, seller }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const imageSource = useMemo(() => {
    if (typeof window === "undefined") {
      return product.imagem;
    }

    if (product.imagem.startsWith("/")) {
      return `${window.location.origin}${product.imagem}`;
    }

    return product.imagem;
  }, [product.imagem]);

  const personalizationLabel = product.permitePersonalizacao ? "Personalizável" : "Modelo fechado";

  const handleDownloadPoster = async () => {
    setIsDownloading(true);
    setFeedback("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Não foi possível preparar o poster.");
      }

      const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
      gradient.addColorStop(0, "#020617");
      gradient.addColorStop(0.55, "#111827");
      gradient.addColorStop(1, "#052e2b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.beginPath();
      ctx.arc(915, 285, 180, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(52, 211, 153, 0.12)";
      ctx.beginPath();
      ctx.arc(205, 1550, 230, 0, Math.PI * 2);
      ctx.fill();

      drawRoundedRect(ctx, 72, 72, 936, 1776, 56);
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#6ee7b7";
      ctx.font = "600 34px Arial";
      ctx.fillText("POSTER PRONTO PARA STATUS", 124, 150);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "700 64px Arial";
      ctx.fillText("Personalizaplus", 124, 226);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "30px Arial";
      ctx.fillText(`Conta: ${seller.nome}`, 124, 284);
      ctx.fillText(`WhatsApp: ${seller.whatsapp}`, 124, 326);

      drawRoundedRect(ctx, 124, 390, 832, 650, 42);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();

      const loadedImage = await loadPosterImage(imageSource);

      if (loadedImage) {
        ctx.save();
        drawRoundedRect(ctx, 148, 414, 784, 602, 34);
        ctx.clip();
        drawCoverImage(ctx, loadedImage, 148, 414, 784, 602, loadedImage.width, loadedImage.height);
        ctx.restore();
      } else {
        const fallbackGradient = ctx.createLinearGradient(148, 414, 932, 1016);
        fallbackGradient.addColorStop(0, "#0f172a");
        fallbackGradient.addColorStop(1, "#1f2937");
        ctx.fillStyle = fallbackGradient;
        drawRoundedRect(ctx, 148, 414, 784, 602, 34);
        ctx.fill();

        ctx.fillStyle = "#6ee7b7";
        ctx.font = "600 30px Arial";
        ctx.fillText("Imagem pronta no browser", 208, 688);

        ctx.fillStyle = "#f8fafc";
        ctx.font = "700 50px Arial";
        ctx.fillText(product.codigo, 208, 752);
      }

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 30px Arial";
      ctx.fillText("PRODUTO", 124, 1128);

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 58px Arial";
      const titleLines = [product.titulo.slice(0, 28), product.titulo.slice(28)].filter(Boolean);
      titleLines.forEach((line, index) => {
        ctx.fillText(line.trim(), 124, 1192 + index * 66);
      });

      drawRoundedRect(ctx, 124, 1325, 832, 150, 34);
      ctx.fillStyle = "#ecfdf5";
      ctx.fill();
      ctx.fillStyle = "#047857";
      ctx.font = "600 30px Arial";
      ctx.fillText("PREÇO", 160, 1384);
      ctx.fillStyle = "#064e3b";
      ctx.font = "700 72px Arial";
      ctx.fillText(`${formatMeticais(product.preco)} MT`, 160, 1452);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 30px Arial";
      ctx.fillText("CORES", 124, 1545);

      product.cores.slice(0, 4).forEach((color, index) => {
        const circleX = 160 + index * 170;
        ctx.beginPath();
        ctx.arc(circleX, 1615, 26, 0, Math.PI * 2);
        ctx.fillStyle = getColorSwatch(color);
        ctx.fill();
        ctx.strokeStyle = color.toLowerCase().includes("branco") ? "#94a3b8" : "rgba(255,255,255,0.16)";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "26px Arial";
        ctx.fillText(color, circleX - 36, 1670);
      });

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 30px Arial";
      ctx.fillText("TAMANHOS", 124, 1750);

      let currentX = 124;
      product.tamanhos.forEach((size) => {
        const chipWidth = drawChip(ctx, size, currentX, 1775, "#1f2937", "#f8fafc");
        currentX += chipWidth + 18;
      });

      drawChip(
        ctx,
        personalizationLabel,
        124,
        167,
        product.permitePersonalizacao ? "#064e3b" : "#3f3f46",
        "#f8fafc",
      );

      ctx.fillStyle = "#94a3b8";
      ctx.font = "28px Arial";
      ctx.fillText("Gerado localmente para partilha no Status do WhatsApp", 124, 1832);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));

      if (!blob) {
        throw new Error("Não foi possível converter o poster para PNG.");
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${product.codigo.toLowerCase()}-status.png`;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      setFeedback("Poster descarregado em PNG.");
    } catch {
      setFeedback("Não foi possível gerar o poster neste momento.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-200/70">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Poster automático</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-950">Pronto para Status</h3>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          100% local
        </span>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="w-full max-w-[280px] rounded-[2.5rem] bg-zinc-950 p-3 shadow-2xl shadow-zinc-950/20">
          <div className="aspect-[9/16] overflow-hidden rounded-[2rem] bg-gradient-to-b from-zinc-950 via-zinc-900 to-emerald-950 p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-300">
                  Personalizaplus
                </p>
                <p className="mt-2 text-sm font-semibold">{seller.nome}</p>
                <p className="text-[11px] text-zinc-300">{seller.whatsapp}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  product.permitePersonalizacao ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-zinc-100"
                }`}
              >
                {personalizationLabel}
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white/95">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imagem} alt={product.titulo} className="aspect-[4/4.7] w-full object-cover" />
            </div>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-300">Produto</p>
              <h4 className="mt-1 text-lg font-bold leading-6">{product.titulo}</h4>
            </div>

            <div className="mt-4 rounded-[1.5rem] bg-emerald-50 px-4 py-3 text-emerald-950">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">Preço</p>
              <p className="mt-1 text-2xl font-bold">{formatMeticais(product.preco)} MT</p>
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-300">Cores</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.cores.map((color) => (
                    <div
                      key={color}
                      className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-[11px] text-zinc-100"
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: getColorSwatch(color) }}
                      />
                      {color}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-300">Tamanhos</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.tamanhos.map((size) => (
                    <span
                      key={size}
                      className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-semibold text-zinc-50"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownloadPoster}
        disabled={isDownloading}
        className="mt-4 w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isDownloading ? "A gerar poster..." : "Descarregar poster PNG"}
      </button>

      {feedback ? <p className="mt-3 text-sm text-zinc-600">{feedback}</p> : null}
    </div>
  );
}
