# Personalizaplus

Este projeto é um aplicativo Next.js para um marketplace via WhatsApp, pronto para ser hospedado no Netlify.

## Como usar localmente

1. Instale o Node.js (recomendo versão LTS mais recente, pelo menos 20).
2. Abra um terminal na pasta do projeto.
3. Execute:

```bash
npm install
```

4. Depois que as dependências forem instaladas, rode:

```bash
npm run dev
```

5. Abra no navegador:

```text
http://localhost:3000
```

6. Edite arquivos em `src/app`, `src/components` ou `src/data` e a página recarrega automaticamente.

## Passo a passo para publicar no Netlify

### 1. Tenha o projeto no GitHub

1. Crie um repositório no GitHub.
2. No seu computador, dentro da pasta do projeto, inicialize o Git se ainda não tiver feito:

```bash
git init
```

3. Adicione todos os arquivos:

```bash
git add .
```

4. Faça o commit:

```bash
git commit -m "Primeiro commit - Personalizaplus"
```

5. Conecte ao repositório remoto do GitHub e envie:

```bash
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
 git branch -M main
 git push -u origin main
```

> Substitua `SEU-USUARIO` e `SEU-REPOSITORIO` pelos dados do seu GitHub.

### 2. Configure o Netlify

1. Acesse https://app.netlify.com/ e faça login.
2. Clique em **"New site from Git"**.
3. Escolha **GitHub** e autorize o Netlify a acessar o seu repositório.
4. Selecione o repositório `personalizaplus`.
5. Nas configurações de build, preencha:
   - Build command: `npm run build`
   - Publish directory: `.netlify/output/public`

6. Clique em **Deploy site**.

### 3. O que já está pronto no projeto

- O arquivo `netlify.toml` já foi criado.
- O plugin `@netlify/plugin-nextjs` já foi adicionado em `package.json`.
- A pasta `.gitignore` já ignora `node_modules`, `.next`, `.env*` e outros arquivos que não devem subir.

**Observação:** Para facilitar o deploy no Vercel removi temporariamente o `@netlify/plugin-nextjs` de `devDependencies`. O projeto continua compatível com Netlify (o `netlify.toml` permanece), mas a dependência foi retirada para evitar falhas de instalação em ambientes que não disponibilizam a versão específica do plugin. Se preferir usar Netlify com o plugin, podemos re-adicionar uma versão compatível.

### 4. Como testar o deploy localmente (opcional)

Se quiser, instale o CLI do Netlify:

```bash
npm install -g netlify-cli
```

E rode:

```bash
netlify dev
```

Isso abre o projeto localmente como se estivesse no Netlify.

## Verificação final

Depois do deploy, o Netlify mostrará a URL do site. Se você quiser, pode vincular um domínio próprio nas configurações do Netlify.

## Observação importante

Se o `npm install` não funcionar, instale o Node.js em https://nodejs.org/ e tente novamente.
