"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PosterGenerator } from "@/components/poster-generator";
import {
  categoryLabels,
  generateNextProductCode,
  storefrontCategoryFilters,
  type Product,
  type ProductCategory,
} from "@/data/products";
import type { SellerUser } from "@/data/users";
import { isActiveUser, isMasterUser } from "@/data/users";
import {
  PANEL_PRODUCTS_STORAGE_KEY,
  PANEL_SESSION_USER_KEY,
  PANEL_USERS_STORAGE_KEY,
  PRODUCTS_UPDATED_EVENT,
  USERS_UPDATED_EVENT,
  clearStoredSessionUserId,
  readStoredProducts,
  readStoredSessionUserId,
  readStoredUsers,
  writeStoredProducts,
  writeStoredSessionUserId,
  writeStoredUsers,
} from "@/lib/browser-storage";
import {
  formatMeticais,
  isValidMozambiqueWhatsApp,
  normalizeMozambiqueWhatsApp,
} from "@/lib/whatsapp";

type Props = {
  initialUsers: SellerUser[];
  products: Product[];
};

type AccessMode = "cliente" | "admin";
type CustomerAuthMode = "entrar" | "criar";
type PanelSection = "resumo" | "produtos" | "equipa" | "links" | "perfil";
type Feedback = {
  tone: "success" | "error";
  message: string;
};

type ClonedLink = {
  productId: string;
  product: Product;
  seller: {
    nome: string;
    whatsapp: string;
    localizacao: string;
  };
  path: string;
  url: string;
};

function slugifyProductId(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitVariants(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createProductPlaceholder(title: string, codigo: string) {
  const svg = `
    <svg width="1200" height="900" viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="900" fill="#0F172A"/>
      <rect x="130" y="120" width="940" height="660" rx="42" fill="#111827"/>
      <rect x="180" y="170" width="840" height="560" rx="26" fill="#ECFDF5"/>
      <circle cx="920" cy="280" r="110" fill="#10B981" fill-opacity="0.22"/>
      <circle cx="332" cy="596" r="160" fill="#34D399" fill-opacity="0.16"/>
      <text x="600" y="380" text-anchor="middle" fill="#065F46" font-size="42" font-family="Arial, Helvetica, sans-serif" font-weight="700">${codigo}</text>
      <text x="600" y="468" text-anchor="middle" fill="#111827" font-size="56" font-family="Arial, Helvetica, sans-serif" font-weight="700">${title}</text>
      <text x="600" y="550" text-anchor="middle" fill="#4B5563" font-size="28" font-family="Arial, Helvetica, sans-serif">Imagem simulada do produto</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function sectionLabel(section: PanelSection) {
  switch (section) {
    case "resumo":
      return "Resumo";
    case "produtos":
      return "Produtos";
    case "equipa":
      return "Equipa";
    case "links":
      return "Links e posters";
    case "perfil":
      return "Perfil";
    default:
      return section;
  }
}

function roleLabel(role: SellerUser["role"]) {
  return role === "master" ? "Admin" : "Cliente";
}

function phoneLabel(phone: string) {
  return isValidMozambiqueWhatsApp(phone)
    ? normalizeMozambiqueWhatsApp(phone)
    : "Ainda não definido";
}

function emailLabel(email: string) {
  return email.trim() || "Ainda não definido";
}

function textLabel(value: string, fallback = "Ainda não definido") {
  return value.trim() || fallback;
}

function buildCommercialLocation(user: Pick<SellerUser, "role" | "nome" | "localizacao" | "morada">) {
  const locationParts = [user.localizacao?.trim(), user.morada?.trim()].filter(Boolean);

  if (locationParts.length > 0) {
    return locationParts.join(" · ");
  }

  return user.role === "master" ? `Operação Admin - ${user.nome}` : `Cliente Personalizaplus - ${user.nome}`;
}

function createEmptyProductForm() {
  return {
    titulo: "",
    codigo: "",
    preco: "",
    descricao: "",
    categoria: "camisetas" as Product["categoria"],
    cores: "",
    tamanhos: "",
    permitePersonalizacao: true,
    imageUrl: "",
    uploadedImageData: "",
    uploadedImageName: "",
  };
}

export function SellerPanel({ initialUsers, products }: Props) {
  const [users, setUsers] = useState<SellerUser[]>(initialUsers);
  const [panelProducts, setPanelProducts] = useState<Product[]>(products);
  const [sessionUserId, setSessionUserId] = useState("");
  const [accessMode, setAccessMode] = useState<AccessMode>("cliente");
  const [customerAuthMode, setCustomerAuthMode] = useState<CustomerAuthMode>("entrar");
  const [loginFormData, setLoginFormData] = useState({ nome: "", senha: "" });
  const [loginError, setLoginError] = useState("");
  const [registerFormData, setRegisterFormData] = useState({
    nome: "",
    senha: "",
    whatsapp: "",
    localizacao: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [activeSection, setActiveSection] = useState<PanelSection>("resumo");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [clonedLinks, setClonedLinks] = useState<ClonedLink[]>([]);
  const [teamFilter, setTeamFilter] = useState<"todos" | "ativos" | "desligados">("todos");
  const [productFilters, setProductFilters] = useState({
    owner: "meus" as "meus" | "todos",
    category: "todos" as "todos" | ProductCategory,
    status: "todos" as "todos" | Product["status"],
  });
  const [linkCategoryFilter, setLinkCategoryFilter] = useState<"todos" | ProductCategory>("todos");
  const [resellerFormData, setResellerFormData] = useState({
    nome: "",
    senha: "",
    whatsapp: "",
    localizacao: "",
  });
  const [resellerFormError, setResellerFormError] = useState("");
  const [profileFormData, setProfileFormData] = useState({
    whatsapp: "",
    localizacao: "",
    morada: "",
    email: "",
    descricaoPerfil: "",
  });
  const [profileFormError, setProfileFormError] = useState("");
  const [productFormError, setProductFormError] = useState("");
  const [productFormData, setProductFormData] = useState(createEmptyProductForm());

  useEffect(() => {
    const syncUsers = () => {
      const nextUsers = readStoredUsers(initialUsers);
      const storedSessionUserId = readStoredSessionUserId();
      const storedSessionUser =
        nextUsers.find((user) => user.id === storedSessionUserId) ?? null;
      setUsers(nextUsers);

      if (storedSessionUserId && !storedSessionUser) {
        clearStoredSessionUserId();
        setSessionUserId("");
        setClonedLinks([]);
        setProfileFormData({
          whatsapp: "",
          localizacao: "",
          morada: "",
          email: "",
          descricaoPerfil: "",
        });
      } else {
        setProfileFormData({
          whatsapp: storedSessionUser ? normalizeMozambiqueWhatsApp(storedSessionUser.whatsapp) : "",
          localizacao: storedSessionUser?.localizacao ?? "",
          morada: storedSessionUser?.morada ?? "",
          email: storedSessionUser?.email ?? "",
          descricaoPerfil: storedSessionUser?.descricaoPerfil ?? "",
        });
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === PANEL_USERS_STORAGE_KEY) {
        syncUsers();
      }

      if (event.key === null || event.key === PANEL_SESSION_USER_KEY) {
        setSessionUserId(readStoredSessionUserId());
      }
    };

    const timeoutId = window.setTimeout(() => {
      syncUsers();
      setSessionUserId(readStoredSessionUserId());
    }, 0);
    window.addEventListener(USERS_UPDATED_EVENT, syncUsers);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(USERS_UPDATED_EVENT, syncUsers);
      window.removeEventListener("storage", handleStorage);
    };
  }, [initialUsers]);

  useEffect(() => {
    const syncProducts = () => {
      setPanelProducts(readStoredProducts(products));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === PANEL_PRODUCTS_STORAGE_KEY) {
        syncProducts();
      }
    };

    const timeoutId = window.setTimeout(syncProducts, 0);
    window.addEventListener(PRODUCTS_UPDATED_EVENT, syncProducts);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, syncProducts);
      window.removeEventListener("storage", handleStorage);
    };
  }, [products]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === sessionUserId) ?? null,
    [sessionUserId, users],
  );

  const isMaster = isMasterUser(selectedUser);
  const isCurrentUserActive = isActiveUser(selectedUser);
  const hasValidWhatsApp = selectedUser ? isValidMozambiqueWhatsApp(selectedUser.whatsapp) : false;
  const canManageTeam = isMaster && isCurrentUserActive;
  const canPublishProducts = Boolean(selectedUser) && isCurrentUserActive;
  const canGenerateSalesAssets = Boolean(selectedUser) && isCurrentUserActive && hasValidWhatsApp;

  const visibleSections = useMemo<PanelSection[]>(
    () =>
      !selectedUser
        ? []
        : canManageTeam
          ? ["resumo", "produtos", "equipa", "links", "perfil"]
          : ["resumo", "produtos", "links", "perfil"],
    [canManageTeam, selectedUser],
  );
  const currentSection = visibleSections.includes(activeSection) ? activeSection : "resumo";

  const myProducts = useMemo(
    () => panelProducts.filter((product) => product.owner.id === selectedUser?.id),
    [panelProducts, selectedUser],
  );

  const availableProducts = useMemo(
    () => panelProducts.filter((product) => product.status === "publicado"),
    [panelProducts],
  );

  const filteredProducts = useMemo(() => {
    return panelProducts.filter((product) => {
      if (productFilters.owner === "meus" && product.owner.id !== selectedUser?.id) {
        return false;
      }

      if (productFilters.category !== "todos" && product.categoria !== productFilters.category) {
        return false;
      }

      if (productFilters.status !== "todos" && product.status !== productFilters.status) {
        return false;
      }

      return true;
    });
  }, [panelProducts, productFilters, selectedUser]);

  const filteredTeamMembers = useMemo(() => {
    return users.filter((user) => {
      if (user.role !== "revendedor") {
        return false;
      }

      if (teamFilter === "ativos") {
        return user.estado === "ativo";
      }

      if (teamFilter === "desligados") {
        return user.estado === "desligado";
      }

      return true;
    });
  }, [teamFilter, users]);

  const filteredLinkProducts = useMemo(() => {
    return availableProducts.filter((product) => {
      if (linkCategoryFilter === "todos") {
        return true;
      }

      return product.categoria === linkCategoryFilter;
    });
  }, [availableProducts, linkCategoryFilter]);

  const totalPublished = useMemo(
    () => panelProducts.filter((product) => product.status === "publicado").length,
    [panelProducts],
  );
  const totalHidden = panelProducts.length - totalPublished;
  const activeResellers = users.filter((user) => user.role === "revendedor" && user.estado === "ativo").length;
  const nextProductCode = useMemo(
    () => generateNextProductCode(panelProducts, productFormData.categoria),
    [panelProducts, productFormData.categoria],
  );

  const buildSharePath = (product: Product, seller: SellerUser) => {
    const params = new URLSearchParams({
      sellerName: seller.nome,
      sellerPhone: normalizeMozambiqueWhatsApp(seller.whatsapp),
      sellerLocation: buildCommercialLocation(seller),
    });

    return `/produto/${product.id}?${params.toString()}`;
  };

  const buildShareUrl = (path: string) => {
    if (typeof window === "undefined") {
      return path;
    }

    return `${window.location.origin}${path}`;
  };

  const canManageProduct = (product: Product) => {
    if (!selectedUser || !isCurrentUserActive) {
      return false;
    }

    return isMaster || product.owner.id === selectedUser.id;
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    setRegisterError("");
    setFeedback(null);

    const nome = loginFormData.nome.trim().toLowerCase();
    const senha = loginFormData.senha.trim();
    const role = accessMode === "admin" ? "master" : "revendedor";

    if (!senha) {
      setLoginError("Preencha a senha para entrar.");
      return;
    }

    let matchedUser: SellerUser | undefined;
    if (nome) {
      matchedUser = users.find(
        (user) =>
          user.nome.trim().toLowerCase() === nome && user.senha === senha && user.role === role,
      );
    } else if (role === "revendedor") {
      const candidates = users.filter((user) => user.senha === senha && user.role === role);
      if (candidates.length === 1) {
        matchedUser = candidates[0];
      }
    }

    if (!matchedUser) {
      setLoginError(
        nome
          ? "Nome, senha ou tipo de acesso inválido."
          : "Senha inválida ou número de clientes com essa senha insuficiente. Informe também o nome se necessário.",
      );
      return;
    }

    setSessionUserId(matchedUser.id);
    writeStoredSessionUserId(matchedUser.id);
    setLoginFormData({ nome: "", senha: "" });
    setProfileFormData({
      whatsapp: normalizeMozambiqueWhatsApp(matchedUser.whatsapp),
      localizacao: matchedUser.localizacao,
      morada: matchedUser.morada,
      email: matchedUser.email,
      descricaoPerfil: matchedUser.descricaoPerfil,
    });
    setActiveSection("resumo");
    setFeedback({
      tone: "success",
      message: `${matchedUser.nome} entrou com sucesso como ${roleLabel(matchedUser.role)}.`,
    });
  };

  const handleSelfRegister = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError("");
    setLoginError("");
    setFeedback(null);

    const nome = registerFormData.nome.trim();
    const senha = registerFormData.senha.trim();
    const whatsapp = registerFormData.whatsapp.trim();
    const localizacao = registerFormData.localizacao.trim();

    if (!nome) {
      setRegisterError("O nome do cliente é obrigatório.");
      return;
    }

    if (!senha) {
      setRegisterError("A senha é obrigatória.");
      return;
    }

    if (users.some((user) => user.nome.trim().toLowerCase() === nome.toLowerCase())) {
      setRegisterError("Já existe uma conta com este nome.");
      return;
    }

    if (whatsapp && !isValidMozambiqueWhatsApp(whatsapp)) {
      setRegisterError("Se preencher WhatsApp, use o formato +258XXXXXXXXX.");
      return;
    }

    const newUser: SellerUser = {
      id: `revendedor-${slugifyProductId(nome)}-${Date.now()}`,
      nome,
      senha,
      whatsapp: whatsapp ? normalizeMozambiqueWhatsApp(whatsapp) : "",
      localizacao: localizacao || "Gaza, Moçambique",
      morada: "",
      email: "",
      descricaoPerfil: "",
      role: "revendedor",
      estado: "ativo",
      criadoPor: "Auto-cadastro",
    };

    writeStoredUsers([...users, newUser]);
    writeStoredSessionUserId(newUser.id);
    setSessionUserId(newUser.id);
    setRegisterFormData({
      nome: "",
      senha: "",
      whatsapp: "",
      localizacao: "",
    });
    setProfileFormData({
      whatsapp: newUser.whatsapp,
      localizacao: newUser.localizacao,
      morada: "",
      email: "",
      descricaoPerfil: "",
    });
    setActiveSection("perfil");
    setFeedback({
      tone: "success",
      message: `Conta criada com sucesso para ${newUser.nome}. Agora pode completar o perfil.`,
    });
  };

  const handleLogout = () => {
    const name = selectedUser?.nome;
    setSessionUserId("");
    setClonedLinks([]);
    setProfileFormData({
      whatsapp: "",
      localizacao: "",
      morada: "",
      email: "",
      descricaoPerfil: "",
    });
    clearStoredSessionUserId();
    setFeedback(name ? { tone: "success", message: `${name} terminou a sessão.` } : null);
  };

  const handleCreateReseller = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResellerFormError("");
    setFeedback(null);

    if (!selectedUser || !canManageTeam) {
      setResellerFormError("Apenas admins ativos podem registar clientes.");
      return;
    }

    const nome = resellerFormData.nome.trim();
    const senha = resellerFormData.senha.trim();
    const whatsapp = resellerFormData.whatsapp.trim();
    const localizacao = resellerFormData.localizacao.trim();

    if (!nome) {
      setResellerFormError("O nome do cliente é obrigatório.");
      return;
    }

    if (!senha) {
      setResellerFormError("A senha inicial do cliente é obrigatória.");
      return;
    }

    if (users.some((user) => user.nome.trim().toLowerCase() === nome.toLowerCase())) {
      setResellerFormError("Já existe uma conta com este nome.");
      return;
    }

    if (whatsapp && !isValidMozambiqueWhatsApp(whatsapp)) {
      setResellerFormError("Se preencher WhatsApp, use o formato +258XXXXXXXXX.");
      return;
    }

    const newReseller: SellerUser = {
      id: `revendedor-${slugifyProductId(nome)}-${Date.now()}`,
      nome,
      senha,
      whatsapp: whatsapp ? normalizeMozambiqueWhatsApp(whatsapp) : "",
      localizacao: localizacao || "Gaza, Moçambique",
      morada: "",
      email: "",
      descricaoPerfil: "",
      role: "revendedor",
      estado: "ativo",
      criadoPor: selectedUser.nome,
    };

    writeStoredUsers([...users, newReseller]);
    setResellerFormData({
      nome: "",
      senha: "",
      whatsapp: "",
      localizacao: "",
    });
    setFeedback({
      tone: "success",
      message: `Cliente ${newReseller.nome} criado com sucesso. Senha inicial: ${newReseller.senha}.`,
    });
  };

  const handleUpdateResellerStatus = (userId: string, estado: SellerUser["estado"]) => {
    if (!canManageTeam) {
      return;
    }

    const target = users.find((user) => user.id === userId);

    if (!target || target.role !== "revendedor") {
      return;
    }

    writeStoredUsers(users.map((user) => (user.id === userId ? { ...user, estado } : user)));
    setFeedback({
      tone: "success",
      message: estado === "ativo" ? `${target.nome} voltou a ficar ativo.` : `${target.nome} foi desligado.`,
    });
  };

  const handleRemoveReseller = (userId: string) => {
    if (!canManageTeam) {
      return;
    }

    const target = users.find((user) => user.id === userId);

    if (!target || target.role !== "revendedor") {
      return;
    }

    writeStoredUsers(users.filter((user) => user.id !== userId));
    setFeedback({
      tone: "success",
      message: `${target.nome} foi removido da equipa.`,
    });
  };

  const handleSaveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileFormError("");
    setFeedback(null);

    if (!selectedUser) {
      return;
    }

    if (!isValidMozambiqueWhatsApp(profileFormData.whatsapp)) {
      setProfileFormError("Use um número válido no formato +258XXXXXXXXX.");
      return;
    }

    if (
      profileFormData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileFormData.email.trim())
    ) {
      setProfileFormError("Use um email válido.");
      return;
    }

    const normalizedPhone = normalizeMozambiqueWhatsApp(profileFormData.whatsapp);
    writeStoredUsers(
      users.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              whatsapp: normalizedPhone,
              localizacao: profileFormData.localizacao.trim(),
              morada: profileFormData.morada.trim(),
              email: profileFormData.email.trim(),
              descricaoPerfil: profileFormData.descricaoPerfil.trim(),
            }
          : user,
      ),
    );
    setProfileFormData({
      whatsapp: normalizedPhone,
      localizacao: profileFormData.localizacao.trim(),
      morada: profileFormData.morada.trim(),
      email: profileFormData.email.trim(),
      descricaoPerfil: profileFormData.descricaoPerfil.trim(),
    });
    setFeedback({
      tone: "success",
      message: "Os dados do perfil foram atualizados com sucesso.",
    });
  };

  const handleUploadedImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = () => {
      const result = typeof fileReader.result === "string" ? fileReader.result : "";

      setProductFormData((current) => ({
        ...current,
        uploadedImageData: result,
        uploadedImageName: file.name,
      }));
    };

    fileReader.readAsDataURL(file);
  };

  const handleCreateProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProductFormError("");
    setFeedback(null);

    if (!selectedUser || !canPublishProducts) {
      setProductFormError("Esta conta não pode publicar produtos neste momento.");
      return;
    }

    const title = productFormData.titulo.trim();
    const code = nextProductCode;
    const description = productFormData.descricao.trim();
    const colors = splitVariants(productFormData.cores);
    const sizes = splitVariants(productFormData.tamanhos);
    const price = Number(productFormData.preco);

    if (!title || !description) {
      setProductFormError("Preencha o título e a descrição do produto.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setProductFormError("Informe um preço válido em Meticais.");
      return;
    }

    if (colors.length === 0 || sizes.length === 0) {
      setProductFormError("Informe pelo menos uma cor e um tamanho.");
      return;
    }

    const imageSource =
      productFormData.imageUrl.trim() ||
      productFormData.uploadedImageData ||
      createProductPlaceholder(title, code);

    const newProduct: Product = {
      id: `${slugifyProductId(code)}-${slugifyProductId(title) || Date.now().toString()}`,
      codigo: code,
      titulo: title,
      descricao: description,
      preco: price,
      imagem: imageSource,
      categoria: productFormData.categoria,
      cores: colors,
      tamanhos: sizes as Product["tamanhos"],
      permitePersonalizacao: productFormData.permitePersonalizacao,
      status: "publicado",
      owner: {
        id: selectedUser.id,
        nome: selectedUser.nome,
        role: selectedUser.role,
      },
      vendedor: {
        nome: selectedUser.nome,
        whatsapp: hasValidWhatsApp ? normalizeMozambiqueWhatsApp(selectedUser.whatsapp) : "",
        localizacao: buildCommercialLocation(selectedUser),
      },
    };

    writeStoredProducts([newProduct, ...panelProducts]);
    setProductFormData(createEmptyProductForm());
    setFeedback({
      tone: "success",
      message: `Produto ${newProduct.codigo} publicado com sucesso por ${selectedUser.nome}.`,
    });
  };

  const handleToggleProductStatus = (productId: string) => {
    const target = panelProducts.find((product) => product.id === productId);

    if (!target || !canManageProduct(target)) {
      return;
    }

    const nextStatus = target.status === "publicado" ? "oculto" : "publicado";

    writeStoredProducts(
      panelProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              status: nextStatus,
            }
          : product,
      ),
    );
    setFeedback({
      tone: "success",
      message:
        nextStatus === "publicado"
          ? `${target.titulo} voltou para a vitrine.`
          : `${target.titulo} foi ocultado da vitrine pública.`,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    const target = panelProducts.find((product) => product.id === productId);

    if (!target || !canManageProduct(target)) {
      return;
    }

    writeStoredProducts(panelProducts.filter((product) => product.id !== productId));
    setFeedback({
      tone: "success",
      message: `Produto ${target.codigo} removido com sucesso.`,
    });
  };

  const handleCloneProduct = async (product: Product) => {
    if (!selectedUser || !isCurrentUserActive) {
      setFeedback({
        tone: "error",
        message: "Só contas ativas podem gerar links e posters.",
      });
      return;
    }

    if (!hasValidWhatsApp) {
      setFeedback({
        tone: "error",
        message: "Atualize o WhatsApp no perfil antes de gerar links e posters.",
      });
      setActiveSection("perfil");
      return;
    }

    const path = buildSharePath(product, selectedUser);
    const sellerInfo = {
      nome: selectedUser.nome,
      whatsapp: normalizeMozambiqueWhatsApp(selectedUser.whatsapp),
      localizacao: buildCommercialLocation(selectedUser),
    };
    const url = buildShareUrl(path);
    const linkEntry: ClonedLink = {
      productId: product.id,
      product,
      seller: sellerInfo,
      path,
      url,
    };

    setClonedLinks((current) => {
      const filtered = current.filter(
        (item) => !(item.productId === product.id && item.seller.whatsapp === linkEntry.seller.whatsapp),
      );

      return [linkEntry, ...filtered];
    });

    try {
      await navigator.clipboard.writeText(url);
      setFeedback({
        tone: "success",
        message: `Link do produto "${product.titulo}" copiado para ${selectedUser.nome}.`,
      });
    } catch {
      setFeedback({
        tone: "success",
        message: `Link gerado para ${selectedUser.nome}. Pode abrir ou copiar manualmente abaixo.`,
      });
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Painel comercial
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-950">Produtos, clientes e posters</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            O acesso agora é feito por login com nome e senha. Admins gerem a equipa, e clientes
            publicam, gerem os próprios produtos e atualizam o WhatsApp no perfil.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
          >
            Voltar para a vitrine
          </Link>
        </div>
      </div>

      <section className="mt-6 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
        {!selectedUser ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Entrar</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAccessMode("cliente");
                    setCustomerAuthMode("entrar");
                    setLoginError("");
                    setRegisterError("");
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    accessMode === "cliente"
                      ? "bg-zinc-950 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700"
                  }`}
                >
                  Entrar como cliente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccessMode("admin");
                    setLoginError("");
                    setRegisterError("");
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    accessMode === "admin"
                      ? "bg-zinc-950 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700"
                  }`}
                >
                  Entrar como Admin
                </button>
              </div>
              {accessMode === "cliente" ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerAuthMode("entrar");
                        setLoginError("");
                        setRegisterError("");
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        customerAuthMode === "entrar"
                          ? "bg-emerald-600 text-white"
                          : "border border-zinc-300 bg-white text-zinc-700"
                      }`}
                    >
                      Já tenho conta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerAuthMode("criar");
                        setLoginError("");
                        setRegisterError("");
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        customerAuthMode === "criar"
                          ? "bg-emerald-600 text-white"
                          : "border border-zinc-300 bg-white text-zinc-700"
                      }`}
                    >
                      Criar conta
                    </button>
                  </div>

                  {customerAuthMode === "entrar" ? (
                    <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleLogin}>
                      <input
                        value={loginFormData.nome}
                        onChange={(event) =>
                          setLoginFormData((current) => ({ ...current, nome: event.target.value }))
                        }
                        placeholder="Nome do cliente (opcional)"
                        className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                      />
                      <input
                        type="password"
                        value={loginFormData.senha}
                        onChange={(event) =>
                          setLoginFormData((current) => ({ ...current, senha: event.target.value }))
                        }
                        placeholder="Senha"
                        className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                      />
                      <div className="md:col-span-2">
                        {loginError ? (
                          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {loginError}
                          </div>
                        ) : null}
                        <button
                          type="submit"
                          className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Entrar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSelfRegister}>
                      <input
                        value={registerFormData.nome}
                        onChange={(event) =>
                          setRegisterFormData((current) => ({ ...current, nome: event.target.value }))
                        }
                        placeholder="Escolha o seu nome"
                        className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                      />
                      <input
                        type="password"
                        value={registerFormData.senha}
                        onChange={(event) =>
                          setRegisterFormData((current) => ({ ...current, senha: event.target.value }))
                        }
                        placeholder="Crie uma senha"
                        className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                      />
                      <input
                        value={registerFormData.whatsapp}
                        onChange={(event) =>
                          setRegisterFormData((current) => ({ ...current, whatsapp: event.target.value }))
                        }
                        placeholder="WhatsApp (opcional)"
                        className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                      />
                      <input
                        value={registerFormData.localizacao}
                        onChange={(event) =>
                          setRegisterFormData((current) => ({ ...current, localizacao: event.target.value }))
                        }
                        placeholder="Localização (opcional)"
                        className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                      />
                      <div className="md:col-span-2">
                        {registerError ? (
                          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {registerError}
                          </div>
                        ) : null}
                        <button
                          type="submit"
                          className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Criar conta
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleLogin}>
                  <input
                    value={loginFormData.nome}
                    onChange={(event) =>
                      setLoginFormData((current) => ({ ...current, nome: event.target.value }))
                    }
                    placeholder="Nome do Admin"
                    className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                  />
                  <input
                    type="password"
                    value={loginFormData.senha}
                    onChange={(event) =>
                      setLoginFormData((current) => ({ ...current, senha: event.target.value }))
                    }
                    placeholder="Senha"
                    className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                  />
                  <div className="md:col-span-2">
                    {loginError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {loginError}
                      </div>
                    ) : null}
                    <button
                      type="submit"
                      className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Entrar
                    </button>
                  </div>
                </form>
              )}
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
              O cliente agora pode criar a própria conta no login ou entrar com uma conta já
              existente. O Admin continua com o acesso separado.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Sessão ativa</p>
              <p className="mt-3 text-lg font-semibold text-zinc-950">{selectedUser.nome}</p>
              <p className="mt-2 text-sm text-zinc-600">
                Entrou como {roleLabel(selectedUser.role)}.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400"
              >
                Terminar sessão
              </button>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
              <p>Conta: <span className="font-semibold text-zinc-950">{selectedUser.nome}</span></p>
              <p>Perfil: <span className="font-semibold text-zinc-950">{roleLabel(selectedUser.role)}</span></p>
              <p>Estado: <span className="font-semibold text-zinc-950">{selectedUser.estado}</span></p>
              <p>WhatsApp: <span className="font-semibold text-zinc-950">{phoneLabel(selectedUser.whatsapp)}</span></p>
              <p>Localização: <span className="font-semibold text-zinc-950">{textLabel(selectedUser.localizacao)}</span></p>
              <p>Morada: <span className="font-semibold text-zinc-950">{textLabel(selectedUser.morada)}</span></p>
            </div>
          </div>
        )}

        {!isCurrentUserActive && selectedUser ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Esta conta está desligada. Pode consultar o painel, mas não publica, não gere produtos e
            não gera links.
          </div>
        ) : null}

        {selectedUser && !hasValidWhatsApp ? (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Falta definir um WhatsApp válido no `Perfil` para gerar links próprios de venda.
          </div>
        ) : null}

        {feedback ? (
          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
              feedback.tone === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
      </section>

      {selectedUser ? (
        <section className="mt-5 flex flex-wrap gap-2">
          {visibleSections.map((section) => {
            const active = currentSection === section;

            return (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                {sectionLabel(section)}
              </button>
            );
          })}
        </section>
      ) : null}

      {selectedUser && currentSection === "resumo" ? (
        <section className="mt-6 grid gap-5 lg:grid-cols-4">
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Publicados</p>
            <p className="mt-3 text-3xl font-bold text-zinc-950">{totalPublished}</p>
            <p className="mt-2 text-sm text-zinc-600">Produtos visíveis na vitrine pública.</p>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Ocultos</p>
            <p className="mt-3 text-3xl font-bold text-zinc-950">{totalHidden}</p>
            <p className="mt-2 text-sm text-zinc-600">Itens guardados fora da vitrine.</p>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Meus produtos</p>
            <p className="mt-3 text-3xl font-bold text-zinc-950">{myProducts.length}</p>
            <p className="mt-2 text-sm text-zinc-600">Produtos publicados por esta conta.</p>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Revendedores ativos</p>
            <p className="mt-3 text-3xl font-bold text-zinc-950">{activeResellers}</p>
            <p className="mt-2 text-sm text-zinc-600">Equipa disponível para vender agora.</p>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Permissões da conta</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
              <li>`Publicar produtos`: {canPublishProducts ? "Sim" : "Não"}</li>
              <li>`Gerir os próprios produtos`: {isCurrentUserActive ? "Sim" : "Não"}</li>
              <li>`Gerir equipa`: {canManageTeam ? "Sim" : "Não"}</li>
              <li>`Gerar links e posters`: {canGenerateSalesAssets ? "Sim" : "Não"}</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Leitura rápida</p>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              O código do produto é gerado automaticamente pela categoria. Em `Equipa`, o Admin
              cria clientes com nome e senha. Em `Perfil`, cada cliente pode atualizar o próprio
              WhatsApp, morada, localização, email e descrição.
            </p>
          </div>
        </section>
      ) : null}

      {selectedUser && currentSection === "produtos" ? (
        <section className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Publicação
                </p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-950">
                  Criar novo produto
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  canPublishProducts ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {canPublishProducts ? "Conta ativa" : "Conta bloqueada"}
              </span>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleCreateProduct}>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Título do produto</label>
                <input
                  value={productFormData.titulo}
                  onChange={(event) =>
                    setProductFormData((current) => ({
                      ...current,
                      titulo: event.target.value,
                    }))
                  }
                  placeholder="Ex: Camiseta Edição Gaza"
                  disabled={!canPublishProducts}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 disabled:bg-zinc-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">Código</label>
                  <input
                    value={nextProductCode}
                    readOnly
                    disabled
                    className="w-full rounded-2xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none"
                  />
                  <p className="mt-2 text-xs text-zinc-500">O código muda automaticamente com a categoria.</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">Preço (MT)</label>
                  <input
                    type="number"
                    min="1"
                    value={productFormData.preco}
                    onChange={(event) =>
                      setProductFormData((current) => ({
                        ...current,
                        preco: event.target.value,
                      }))
                    }
                    placeholder="1500"
                    disabled={!canPublishProducts}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 disabled:bg-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Descrição</label>
                <textarea
                  value={productFormData.descricao}
                  onChange={(event) =>
                    setProductFormData((current) => ({
                      ...current,
                      descricao: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Descreva o produto, o estilo e o contexto de venda."
                  disabled={!canPublishProducts}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 disabled:bg-zinc-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">Categoria</label>
                  <select
                    value={productFormData.categoria}
                    onChange={(event) =>
                      setProductFormData((current) => ({
                        ...current,
                        categoria: event.target.value as Product["categoria"],
                      }))
                    }
                    disabled={!canPublishProducts}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 disabled:bg-zinc-100"
                  >
                    <option value="camisetas">Camisetas</option>
                    <option value="quadros">Quadros</option>
                    <option value="bones">Bonés</option>
                    <option value="chavenas">Chávenas</option>
                    <option value="chaveiros">Chaveiros</option>
                    <option value="agendas">Agendas</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">Cores</label>
                  <input
                    value={productFormData.cores}
                    onChange={(event) =>
                      setProductFormData((current) => ({
                        ...current,
                        cores: event.target.value,
                      }))
                    }
                    placeholder="Preto, Branco, Azul"
                    disabled={!canPublishProducts}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 disabled:bg-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">Tamanhos</label>
                  <input
                    value={productFormData.tamanhos}
                    onChange={(event) =>
                      setProductFormData((current) => ({
                        ...current,
                        tamanhos: event.target.value,
                      }))
                    }
                    placeholder="S, M, L, XL ou Único"
                    disabled={!canPublishProducts}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 disabled:bg-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Permite personalização
                  </label>
                  <select
                    value={productFormData.permitePersonalizacao ? "sim" : "nao"}
                    onChange={(event) =>
                      setProductFormData((current) => ({
                        ...current,
                        permitePersonalizacao: event.target.value === "sim",
                      }))
                    }
                    disabled={!canPublishProducts}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 disabled:bg-zinc-100"
                  >
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Link da imagem</label>
                <input
                  value={productFormData.imageUrl}
                  onChange={(event) =>
                    setProductFormData((current) => ({
                      ...current,
                      imageUrl: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                  disabled={!canPublishProducts}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 disabled:bg-zinc-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Ou carregar foto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadedImage}
                  disabled={!canPublishProducts}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:bg-zinc-100"
                />
                {productFormData.uploadedImageName ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Foto selecionada: {productFormData.uploadedImageName}
                  </p>
                ) : null}
              </div>

              {productFormData.imageUrl || productFormData.uploadedImageData ? (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={productFormData.imageUrl || productFormData.uploadedImageData}
                      alt={productFormData.titulo || "Pré-visualização"}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              ) : null}

              {productFormError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {productFormError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canPublishProducts}
                className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                Publicar produto
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Gestão</p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-950">Lista de produtos</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {isMaster ? (
                  <select
                    value={productFilters.owner}
                    onChange={(event) =>
                      setProductFilters((current) => ({
                        ...current,
                        owner: event.target.value as "meus" | "todos",
                      }))
                    }
                    className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700"
                  >
                    <option value="meus">Meus</option>
                    <option value="todos">Todos</option>
                  </select>
                ) : null}

                <select
                  value={productFilters.status}
                  onChange={(event) =>
                    setProductFilters((current) => ({
                      ...current,
                      status: event.target.value as "todos" | Product["status"],
                    }))
                  }
                  className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700"
                >
                  <option value="todos">Todos os estados</option>
                  <option value="publicado">Publicados</option>
                  <option value="oculto">Ocultos</option>
                </select>

                <select
                  value={productFilters.category}
                  onChange={(event) =>
                    setProductFilters((current) => ({
                      ...current,
                      category: event.target.value as "todos" | ProductCategory,
                    }))
                  }
                  className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700"
                >
                  <option value="todos">Todas as categorias</option>
                  {storefrontCategoryFilters
                    .filter((category): category is ProductCategory => category !== "todos")
                    .map((category) => (
                      <option key={category} value={category}>
                        {categoryLabels[category]}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-600">
                  Nenhum produto encontrado com estes filtros.
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const canManage = canManageProduct(product);

                  return (
                    <article
                      key={product.id}
                      className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
                          <Image
                            src={product.imagem}
                            alt={product.titulo}
                            fill
                            sizes="120px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                              {product.codigo}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                              {categoryLabels[product.categoria]}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                product.status === "publicado"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-zinc-200 text-zinc-700"
                              }`}
                            >
                              {product.status}
                            </span>
                            <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold text-white">
                              {product.owner.nome} · {roleLabel(product.owner.role)}
                            </span>
                          </div>

                          <h3 className="mt-3 text-lg font-semibold text-zinc-950">{product.titulo}</h3>
                          <p className="mt-1 text-sm text-zinc-600">
                            {formatMeticais(product.preco)} MT · {product.permitePersonalizacao ? "Personalizável" : "Modelo fechado"}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {canManage ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductStatus(product.id)}
                                  className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                                >
                                  {product.status === "publicado" ? "Ocultar" : "Publicar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50"
                                >
                                  Apagar
                                </button>
                              </>
                            ) : (
                              <span className="text-sm text-zinc-500">
                                Apenas o autor ou um Admin ativo pode gerir este produto.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      ) : null}

      {selectedUser && currentSection === "equipa" && canManageTeam ? (
        <section className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Equipa</p>
              <h2 className="mt-2 text-xl font-semibold text-zinc-950">Criar cliente</h2>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleCreateReseller}>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Nome</label>
                <input
                  value={resellerFormData.nome}
                  onChange={(event) =>
                    setResellerFormData((current) => ({
                      ...current,
                      nome: event.target.value,
                    }))
                  }
                  placeholder="Ex: Sara"
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Senha inicial</label>
                <input
                  value={resellerFormData.senha}
                  onChange={(event) =>
                    setResellerFormData((current) => ({
                      ...current,
                      senha: event.target.value,
                    }))
                  }
                  placeholder="Ex: sara13"
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">WhatsApp inicial</label>
                <input
                  value={resellerFormData.whatsapp}
                  onChange={(event) =>
                    setResellerFormData((current) => ({
                      ...current,
                      whatsapp: event.target.value,
                    }))
                  }
                  placeholder="+258841234567"
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                />
                <p className="mt-2 text-xs text-zinc-500">Opcional. O cliente pode definir isso depois no perfil.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Localização inicial</label>
                <input
                  value={resellerFormData.localizacao}
                  onChange={(event) =>
                    setResellerFormData((current) => ({
                      ...current,
                      localizacao: event.target.value,
                    }))
                  }
                  placeholder="Ex: Xai-Xai, Gaza"
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              {resellerFormError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {resellerFormError}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Guardar cliente
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Gestão humana</p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-950">Clientes registados</h2>
              </div>

              <select
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value as "todos" | "ativos" | "desligados")}
                className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700"
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="desligados">Desligados</option>
              </select>
            </div>

            <div className="mt-5 space-y-3">
              {filteredTeamMembers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-600">
                  Nenhum revendedor encontrado neste filtro.
                </div>
              ) : (
                filteredTeamMembers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-950">{user.nome}</p>
                        <p className="text-sm text-zinc-600">
                          {phoneLabel(user.whatsapp)} · {roleLabel(user.role)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {textLabel(user.localizacao)}{user.morada.trim() ? ` · ${user.morada}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{emailLabel(user.email)}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Login: `{user.nome}` · Senha: `{user.senha}`
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {user.criadoPor ? `Criado por ${user.criadoPor}` : "Conta sem registo de origem"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.estado === "ativo"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-200 text-zinc-700"
                          }`}
                        >
                          {user.estado}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleUpdateResellerStatus(user.id, user.estado === "ativo" ? "desligado" : "ativo")}
                          className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400"
                        >
                          {user.estado === "ativo" ? "Desligar" : "Ativar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveReseller(user.id)}
                          className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}

      {selectedUser && currentSection === "links" ? (
        <section className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Links</p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-950">Produtos disponíveis para venda</h2>
              </div>

              <select
                value={linkCategoryFilter}
                onChange={(event) =>
                  setLinkCategoryFilter(event.target.value as "todos" | ProductCategory)
                }
                className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700"
              >
                <option value="todos">Todas as categorias</option>
                {storefrontCategoryFilters
                  .filter((category): category is ProductCategory => category !== "todos")
                  .map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
              </select>
            </div>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Qualquer conta ativa com WhatsApp válido pode gerar o seu link próprio e criar o poster local.
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {filteredLinkProducts.map((product) => {
                const previewUrl =
                  selectedUser && canGenerateSalesAssets
                    ? buildShareUrl(buildSharePath(product, selectedUser))
                    : `/produto/${product.id}`;

                return (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-zinc-50"
                  >
                    <div className="relative aspect-[4/3] bg-white">
                      <Image
                        src={product.imagem}
                        alt={product.titulo}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                          {product.owner.nome} · {roleLabel(product.owner.role)}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                          {categoryLabels[product.categoria]}
                        </span>
                        <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold text-white">
                          {product.codigo}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-zinc-950">{product.titulo}</h3>
                        <p className="mt-1 text-sm text-zinc-600">{formatMeticais(product.preco)} MT</p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {product.permitePersonalizacao ? "Aceita personalização total" : "Venda com modelo fechado"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleCloneProduct(product)}
                          disabled={!canGenerateSalesAssets}
                          className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                        >
                          Clonar e gerar meu link
                        </button>

                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
                        >
                          Abrir página do produto
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Posters</p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-950">Meus links de venda</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                {clonedLinks.length} gerados
              </span>
            </div>

            {clonedLinks.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-sm leading-6 text-zinc-600">
                Ainda não gerou nenhum link. Use os produtos publicados ao lado para começar.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {clonedLinks.map((item) => (
                  <div
                    key={`${item.productId}-${item.seller.whatsapp}`}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div>
                        <p className="font-semibold text-zinc-950">{item.product.titulo}</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Link de {item.seller.nome} • {item.seller.whatsapp}
                        </p>
                        <a
                          href={item.path}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block break-all text-sm font-medium text-emerald-700 underline underline-offset-4"
                        >
                          {item.url}
                        </a>
                      </div>

                      <PosterGenerator product={item.product} seller={item.seller} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {selectedUser && currentSection === "perfil" ? (
        <section className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Perfil</p>
              <h2 className="mt-2 text-xl font-semibold text-zinc-950">Definições da conta</h2>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handleSaveProfile}>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Nome</label>
                <input
                  value={selectedUser.nome}
                  disabled
                  className="w-full rounded-2xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-900 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">WhatsApp</label>
                <input
                  value={profileFormData.whatsapp}
                  onChange={(event) =>
                    setProfileFormData((current) => ({ ...current, whatsapp: event.target.value }))
                  }
                  placeholder="+258841234567"
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                />
                <p className="mt-2 text-xs text-zinc-500">Este número será usado nos teus links próprios de venda.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Localização</label>
                <input
                  value={profileFormData.localizacao}
                  onChange={(event) =>
                    setProfileFormData((current) => ({ ...current, localizacao: event.target.value }))
                  }
                  placeholder="Ex: Xai-Xai, Gaza"
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Morada</label>
                <input
                  value={profileFormData.morada}
                  onChange={(event) =>
                    setProfileFormData((current) => ({ ...current, morada: event.target.value }))
                  }
                  placeholder="Ex: Bairro 3, casa 12"
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Email</label>
                <input
                  value={profileFormData.email}
                  onChange={(event) =>
                    setProfileFormData((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="nome@email.com"
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">Descrição</label>
                <textarea
                  value={profileFormData.descricaoPerfil}
                  onChange={(event) =>
                    setProfileFormData((current) => ({ ...current, descricaoPerfil: event.target.value }))
                  }
                  rows={4}
                  placeholder="Fala um pouco do teu atendimento, zona de entrega ou detalhes comerciais."
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                />
              </div>
              {profileFormError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {profileFormError}
                </div>
              ) : null}
              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Guardar perfil
              </button>
            </form>
          </div>
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Estado atual</p>
            <div className="mt-4 space-y-3 text-sm text-zinc-700">
              <p>Nome de acesso: <span className="font-semibold text-zinc-950">{selectedUser.nome}</span></p>
              <p>Tipo: <span className="font-semibold text-zinc-950">{roleLabel(selectedUser.role)}</span></p>
              <p>Estado: <span className="font-semibold text-zinc-950">{selectedUser.estado}</span></p>
              <p>WhatsApp guardado: <span className="font-semibold text-zinc-950">{phoneLabel(selectedUser.whatsapp)}</span></p>
              <p>Localização: <span className="font-semibold text-zinc-950">{textLabel(selectedUser.localizacao)}</span></p>
              <p>Morada: <span className="font-semibold text-zinc-950">{textLabel(selectedUser.morada)}</span></p>
              <p>Email: <span className="font-semibold text-zinc-950">{emailLabel(selectedUser.email)}</span></p>
              <p>Descrição: <span className="font-semibold text-zinc-950">{textLabel(selectedUser.descricaoPerfil)}</span></p>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
