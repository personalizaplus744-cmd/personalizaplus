import type { UserRole } from "@/data/users";

export type ProductSize = "S" | "M" | "L" | "XL" | "Único";
export type ProductCategory =
  | "camisetas"
  | "quadros"
  | "bones"
  | "chavenas"
  | "chaveiros"
  | "agendas";

export const categoryLabels: Record<ProductCategory, string> = {
  camisetas: "Camisetas",
  quadros: "Quadros",
  bones: "Bonés",
  chavenas: "Chávenas",
  chaveiros: "Chaveiros",
  agendas: "Agendas",
};

export const storefrontCategoryFilters: Array<"todos" | ProductCategory> = [
  "todos",
  "camisetas",
  "quadros",
  "bones",
  "chavenas",
  "chaveiros",
  "agendas",
];

export const categoryCodePrefixes: Record<ProductCategory, string> = {
  camisetas: "CM",
  quadros: "QD",
  bones: "BN",
  chavenas: "CH",
  chaveiros: "CV",
  agendas: "AG",
};

export type ProductStatus = "publicado" | "oculto";

export type Product = {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  preco: number;
  imagem: string;
  categoria: ProductCategory;
  cores: string[];
  tamanhos: ProductSize[];
  permitePersonalizacao: boolean;
  status: ProductStatus;
  owner: {
    id: string;
    nome: string;
    role: UserRole;
  };
  vendedor: {
    nome: string;
    whatsapp: string;
    localizacao: string;
  };
};

function createSeedProduct(
  owner: Product["owner"],
  seller: Product["vendedor"],
  product: Omit<Product, "owner" | "vendedor" | "status">,
): Product {
  return {
    ...product,
    owner,
    vendedor: seller,
    status: "publicado",
  };
}

const nickiOwner: Product["owner"] = {
  id: "master-nicki",
  nome: "Nicki saiete",
  role: "master",
};

const miltonOwner: Product["owner"] = {
  id: "master-milton",
  nome: "Milton Sika",
  role: "master",
};

const nickiSeller: Product["vendedor"] = {
  nome: "Nicki saiete",
  whatsapp: "258841234567",
  localizacao: "Gaza, Moçambique",
};

const miltonSeller: Product["vendedor"] = {
  nome: "Milton Sika",
  whatsapp: "258852223344",
  localizacao: "Gaza, Moçambique",
};

export const products: Product[] = [
  createSeedProduct(nickiOwner, nickiSeller, {
    id: "camiseta-gaza-preta",
    codigo: "PP-001",
    titulo: "Camiseta Personalizaplus Gaza Preta",
    descricao:
      "Camiseta casual com estampa frontal Personalizaplus, ideal para vendas rápidas via WhatsApp e entregas locais em Gaza.",
    preco: 950,
    imagem: "/products/camiseta-gaza-preta.svg",
    categoria: "camisetas",
    cores: ["Preto", "Branco", "Vermelho"],
    tamanhos: ["S", "M", "L", "XL"],
    permitePersonalizacao: true,
  }),
  createSeedProduct(nickiOwner, nickiSeller, {
    id: "camiseta-premium-branca",
    codigo: "PP-002",
    titulo: "Camiseta Premium Branca",
    descricao:
      "Modelo premium em algodão leve com acabamento limpo, pensado para personalizações e encomendas por mensagem.",
    preco: 1100,
    imagem: "/products/camiseta-premium-branca.svg",
    categoria: "camisetas",
    cores: ["Branco", "Azul", "Preto"],
    tamanhos: ["S", "M", "L", "XL"],
    permitePersonalizacao: true,
  }),
  createSeedProduct(
    nickiOwner,
    { ...nickiSeller, localizacao: "Xai-Xai, Gaza" },
    {
      id: "camiseta-arte-urbana",
      codigo: "PP-003",
      titulo: "Camiseta Arte Urbana",
      descricao:
        "Peça jovem com grafismo moderno e foco em clientes que compram diretamente pelo WhatsApp sem cadastro.",
      preco: 1200,
      imagem: "/products/camiseta-arte-urbana.svg",
      categoria: "camisetas",
      cores: ["Azul", "Preto", "Mostarda"],
      tamanhos: ["S", "M", "L", "XL"],
      permitePersonalizacao: true,
    },
  ),
  createSeedProduct(miltonOwner, miltonSeller, {
    id: "quadro-motivacional-savana",
    codigo: "PP-004",
    titulo: "Quadro Motivacional Savana",
    descricao:
      "Quadro decorativo com visual clean e mensagem positiva, ótimo para presentes e decoração de escritório.",
    preco: 1800,
    imagem: "/products/quadro-motivacional-savana.svg",
    categoria: "quadros",
    cores: ["Madeira Clara", "Preto", "Branco"],
    tamanhos: ["S", "M", "L", "XL"],
    permitePersonalizacao: false,
  }),
  createSeedProduct(
    miltonOwner,
    { ...miltonSeller, localizacao: "Chókwè, Gaza" },
    {
      id: "quadro-familia-color",
      codigo: "PP-005",
      titulo: "Quadro Família Color",
      descricao:
        "Quadro em estilo moderno com composição colorida, perfeito para salas e espaços de convivência.",
      preco: 2200,
      imagem: "/products/quadro-familia-color.svg",
      categoria: "quadros",
      cores: ["Natural", "Branco", "Preto"],
      tamanhos: ["S", "M", "L", "XL"],
      permitePersonalizacao: false,
    },
  ),
  createSeedProduct(miltonOwner, miltonSeller, {
    id: "quadro-love-home",
    codigo: "PP-006",
    titulo: "Quadro Love Home",
    descricao:
      "Peça decorativa elegante com layout minimalista para ambientes domésticos e encomendas personalizadas.",
    preco: 2400,
    imagem: "/products/quadro-love-home.svg",
    categoria: "quadros",
    cores: ["Preto", "Dourado", "Branco"],
    tamanhos: ["S", "M", "L", "XL"],
    permitePersonalizacao: false,
  }),
  createSeedProduct(nickiOwner, nickiSeller, {
    id: "bone-signature-black",
    codigo: "BN-001",
    titulo: "Boné Signature Preto",
    descricao:
      "Boné casual com frente estruturada e área ideal para bordado ou estampa personalizada para marcas e eventos.",
    preco: 850,
    imagem: "/products/bone-signature-black.svg",
    categoria: "bones",
    cores: ["Preto", "Branco", "Cinza"],
    tamanhos: ["Único"],
    permitePersonalizacao: true,
  }),
  createSeedProduct(
    miltonOwner,
    { ...miltonSeller, localizacao: "Chókwè, Gaza" },
    {
      id: "bone-sport-emerald",
      codigo: "BN-002",
      titulo: "Boné Sport Emerald",
      descricao:
        "Modelo leve para equipas, campanhas promocionais e encomendas com personalização total da frente.",
      preco: 900,
      imagem: "/products/bone-sport-emerald.svg",
      categoria: "bones",
      cores: ["Verde", "Preto", "Bege"],
      tamanhos: ["Único"],
      permitePersonalizacao: true,
    },
  ),
  createSeedProduct(nickiOwner, nickiSeller, {
    id: "chavena-classic-white",
    codigo: "CH-001",
    titulo: "Chávena Classic Branca",
    descricao:
      "Chávena em cerâmica pronta para sublimação com nomes, frases ou artes de marcas e presentes personalizados.",
    preco: 700,
    imagem: "/products/chavena-classic-white.svg",
    categoria: "chavenas",
    cores: ["Branco", "Preto"],
    tamanhos: ["Único"],
    permitePersonalizacao: true,
  }),
  createSeedProduct(
    miltonOwner,
    { ...miltonSeller, localizacao: "Xai-Xai, Gaza" },
    {
      id: "chavena-love-print",
      codigo: "CH-002",
      titulo: "Chávena Love Print",
      descricao:
        "Modelo perfeito para presentes românticos, brindes corporativos e pedidos personalizados em pequenas quantidades.",
      preco: 780,
      imagem: "/products/chavena-love-print.svg",
      categoria: "chavenas",
      cores: ["Branco", "Rosa", "Vermelho"],
      tamanhos: ["Único"],
      permitePersonalizacao: true,
    },
  ),
  createSeedProduct(nickiOwner, nickiSeller, {
    id: "chaveiro-acrilico-brand",
    codigo: "CV-001",
    titulo: "Chaveiro Acrílico Brand",
    descricao:
      "Chaveiro leve e resistente para nomes, logótipos e pequenas artes promocionais personalizadas.",
    preco: 250,
    imagem: "/products/chaveiro-acrilico-brand.svg",
    categoria: "chaveiros",
    cores: ["Transparente", "Azul", "Preto"],
    tamanhos: ["Único"],
    permitePersonalizacao: true,
  }),
  createSeedProduct(miltonOwner, miltonSeller, {
    id: "chaveiro-heart-metal",
    codigo: "CV-002",
    titulo: "Chaveiro Heart Metal",
    descricao:
      "Peça metálica elegante para lembranças especiais, brindes e personalização com iniciais ou frases curtas.",
    preco: 320,
    imagem: "/products/chaveiro-heart-metal.svg",
    categoria: "chaveiros",
    cores: ["Prata", "Dourado", "Preto"],
    tamanhos: ["Único"],
    permitePersonalizacao: true,
  }),
  createSeedProduct(nickiOwner, nickiSeller, {
    id: "agenda-business-2026",
    codigo: "AG-001",
    titulo: "Agenda Business 2026",
    descricao:
      "Agenda premium com capa personalizável para empresas, escolas e empreendedores que querem uma identidade própria.",
    preco: 1350,
    imagem: "/products/agenda-business-2026.svg",
    categoria: "agendas",
    cores: ["Preto", "Azul", "Castanho"],
    tamanhos: ["Único"],
    permitePersonalizacao: false,
  }),
  createSeedProduct(
    miltonOwner,
    { ...miltonSeller, localizacao: "Bilene, Gaza" },
    {
      id: "agenda-floral-creative",
      codigo: "AG-002",
      titulo: "Agenda Floral Creative",
      descricao:
        "Agenda criativa para presentes, recordações e capas com arte personalizada para clientes individuais.",
      preco: 1280,
      imagem: "/products/agenda-floral-creative.svg",
      categoria: "agendas",
      cores: ["Rosa", "Lilás", "Branco"],
      tamanhos: ["Único"],
      permitePersonalizacao: false,
    },
  ),
];

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function generateNextProductCode(productList: Product[], category: ProductCategory) {
  const prefix = categoryCodePrefixes[category];
  const lastNumber = productList
    .filter((product) => product.categoria === category)
    .map((product) => {
      const match = product.codigo.match(/(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .reduce((max, current) => Math.max(max, current), 0);

  return `${prefix}-${String(lastNumber + 1).padStart(3, "0")}`;
}
