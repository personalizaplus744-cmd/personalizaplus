export type UserRole = "master" | "revendedor";
export type UserStatus = "ativo" | "desligado";

export type SellerUser = {
  id: string;
  nome: string;
  senha: string;
  whatsapp: string;
  localizacao: string;
  morada: string;
  email: string;
  descricaoPerfil: string;
  role: UserRole;
  estado: UserStatus;
  criadoPor?: string;
};

export const masterUsers: SellerUser[] = [
  {
    id: "master-nicki",
    nome: "Nicki saiete",
    senha: "Nikesaiete1",
    whatsapp: "+258841234567",
    localizacao: "Gaza, Moçambique",
    morada: "Gaza, Moçambique",
    email: "nicki@personalizaplus.co.mz",
    descricaoPerfil: "Admin da operação comercial e coordenação de equipa.",
    role: "master",
    estado: "ativo",
  },
  {
    id: "master-milton",
    nome: "Milton Sika",
    senha: "Miltonsika1",
    whatsapp: "+258852223344",
    localizacao: "Gaza, Moçambique",
    morada: "Gaza, Moçambique",
    email: "milton@personalizaplus.co.mz",
    descricaoPerfil: "Admin focado na gestão comercial e publicação de produtos.",
    role: "master",
    estado: "ativo",
  },
];

export const resellerSeedUsers: SellerUser[] = [
  {
    id: "revendedor-salma",
    nome: "Salma",
    senha: "salma13",
    whatsapp: "+258870001111",
    localizacao: "Gaza, Moçambique",
    morada: "",
    email: "",
    descricaoPerfil: "",
    role: "revendedor",
    estado: "ativo",
    criadoPor: "Nicki saiete",
  },
  {
    id: "revendedor-celso",
    nome: "Celso",
    senha: "celso13",
    whatsapp: "+258870002222",
    localizacao: "Gaza, Moçambique",
    morada: "",
    email: "",
    descricaoPerfil: "",
    role: "revendedor",
    estado: "ativo",
    criadoPor: "Milton Sika",
  },
];

export const initialPanelUsers: SellerUser[] = [...masterUsers, ...resellerSeedUsers];

export function isMasterUser(user?: Pick<SellerUser, "nome" | "role"> | null) {
  if (!user) {
    return false;
  }

  return user.role === "master" && ["Nicki saiete", "Milton Sika"].includes(user.nome);
}

export function isActiveUser(user?: Pick<SellerUser, "estado"> | null) {
  return user?.estado === "ativo";
}
