import type { Product } from "@/data/products";
import type { SellerUser } from "@/data/users";

export const PANEL_USERS_STORAGE_KEY = "personalizaplus-panel-users";
export const PANEL_PRODUCTS_STORAGE_KEY = "personalizaplus-panel-products";
export const PANEL_SESSION_USER_KEY = "personalizaplus-session-user";
export const PRODUCTS_UPDATED_EVENT = "personalizaplus-products-updated";
export const USERS_UPDATED_EVENT = "personalizaplus-users-updated";

type StoredProduct = Product & {
  master?: string;
  permitePersonalizacao?: boolean;
  status?: Product["status"];
  owner?: Product["owner"];
};

type StoredUser = SellerUser & {
  estado?: SellerUser["estado"];
  senha?: string;
  localizacao?: string;
  morada?: string;
  email?: string;
  descricaoPerfil?: string;
};

const MASTER_USER_BY_ID: Record<string, Pick<SellerUser, "nome" | "senha" | "role">> = {
  "master-nicki": {
    nome: "Nicki saiete",
    senha: "Nikesaiete1",
    role: "master",
  },
  "master-milton": {
    nome: "Milton Sika",
    senha: "Miltonsika1",
    role: "master",
  },
};

function normalizeCreatorName(name?: string) {
  if (!name) {
    return name;
  }

  if (name === "Nicki") {
    return "Nicki saiete";
  }

  if (name === "Milton") {
    return "Milton Sika";
  }

  return name;
}

function normalizeStoredProduct(product: StoredProduct): Product {
  const fallbackOwnerName = product.owner?.nome ?? product.master ?? product.vendedor?.nome ?? "Nicki saiete";
  const ownerId =
    product.owner?.id ??
    (fallbackOwnerName === "Nicki" || fallbackOwnerName === "Nicki saiete"
      ? "master-nicki"
      : fallbackOwnerName === "Milton" || fallbackOwnerName === "Milton Sika"
        ? "master-milton"
        : `revendedor-${fallbackOwnerName.toLowerCase().replace(/\s+/g, "-")}`);
  const masterProfile = MASTER_USER_BY_ID[ownerId];
  const ownerName = masterProfile?.nome ?? normalizeCreatorName(fallbackOwnerName) ?? fallbackOwnerName;
  const ownerRole = masterProfile?.role ?? product.owner?.role ?? "revendedor";

  return {
    ...product,
    permitePersonalizacao: product.permitePersonalizacao ?? true,
    status: product.status ?? "publicado",
    owner: {
      id: ownerId,
      nome: ownerName,
      role: ownerRole,
    },
    vendedor: {
      ...product.vendedor,
      nome:
        product.vendedor.nome === "Nicki" || product.vendedor.nome === "Nicki saiete"
          ? "Nicki saiete"
          : product.vendedor.nome === "Milton" || product.vendedor.nome === "Milton Sika"
            ? "Milton Sika"
            : product.vendedor.nome,
    },
  };
}

function normalizeStoredUser(user: StoredUser): SellerUser {
  const masterProfile = MASTER_USER_BY_ID[user.id];

  return {
    ...user,
    nome: masterProfile?.nome ?? user.nome,
    estado: user.estado ?? "ativo",
    senha: masterProfile?.senha ?? user.senha ?? `${user.nome.toLowerCase()}13`,
    localizacao: user.localizacao ?? "Gaza, Moçambique",
    morada: user.morada ?? "",
    email: user.email ?? "",
    descricaoPerfil: user.descricaoPerfil ?? "",
    role: masterProfile?.role ?? user.role,
    criadoPor: normalizeCreatorName(user.criadoPor),
  };
}

export function readStoredUsers(fallback: SellerUser[]) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const savedUsers = window.localStorage.getItem(PANEL_USERS_STORAGE_KEY);

  if (!savedUsers) {
    return fallback;
  }

  try {
    const parsedUsers = JSON.parse(savedUsers) as StoredUser[];
    return Array.isArray(parsedUsers) && parsedUsers.length > 0
      ? parsedUsers.map(normalizeStoredUser)
      : fallback;
  } catch {
    window.localStorage.removeItem(PANEL_USERS_STORAGE_KEY);
    return fallback;
  }
}

export function writeStoredUsers(users: SellerUser[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PANEL_USERS_STORAGE_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event(USERS_UPDATED_EVENT));
}

export function readStoredProducts(fallback: Product[]) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const savedProducts = window.localStorage.getItem(PANEL_PRODUCTS_STORAGE_KEY);

  if (!savedProducts) {
    return fallback;
  }

  try {
    const parsedProducts = JSON.parse(savedProducts) as StoredProduct[];
    return Array.isArray(parsedProducts) && parsedProducts.length > 0
      ? parsedProducts.map(normalizeStoredProduct)
      : fallback;
  } catch {
    window.localStorage.removeItem(PANEL_PRODUCTS_STORAGE_KEY);
    return fallback;
  }
}

export function writeStoredProducts(products: Product[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PANEL_PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
}

export function readStoredSessionUserId() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(PANEL_SESSION_USER_KEY) ?? "";
}

export function writeStoredSessionUserId(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PANEL_SESSION_USER_KEY, userId);
}

export function clearStoredSessionUserId() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PANEL_SESSION_USER_KEY);
}
