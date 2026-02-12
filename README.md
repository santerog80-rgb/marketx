# MarketX - Marketplace Moçambicano 🇲🇿

## 🚀 Descrição

MarketX é um marketplace completo desenvolvido para Moçambique, similar ao Facebook Marketplace, com sistema de autenticação, múltiplas moedas, integração WhatsApp, avaliações de produtos e muito mais.

## ✨ Funcionalidades

### 🔐 Autenticação
- Sistema completo de login e cadastro
- Integração com Supabase Auth
- Sessão persistente
- Painel de usuário personalizado

### 💰 Múltiplas Moedas
- MZN (Metical Moçambicano)
- USD (Dólar Americano)
- EUR (Euro)
- ZAR (Rand Sul-Africano)
- GBP (Libra Esterlina)
- Conversão automática de preços

### 📱 Produtos
- Upload de até 5 fotos por produto
- Múltiplas categorias (Eletrônicos, Veículos, Imóveis, etc)
- Descrição detalhada
- Localização
- Condição (Novo, Usado, Recondicionado)
- Sistema de busca em tempo real
- Filtros e ordenação

### ⭐ Avaliações
- Sistema de avaliação com 1-5 estrelas
- Comentários dos compradores
- Média de avaliações por produto
- Histórico de avaliações

### 💬 Integração WhatsApp
- Botão de contato direto via WhatsApp
- Mensagem pré-formatada com detalhes do produto

## 🛠️ Configuração

### Passo 1: Adicionar Biblioteca Supabase

No `index.html`, adicione antes do `app.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Passo 2: Configurar Supabase

1. Crie uma conta em [https://supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Project Settings** > **API**
4. Copie a **URL** e a **anon/public key**
5. Abra `config.js` e substitua os valores

### Passo 3: Criar Tabelas

Execute no **SQL Editor** do Supabase (os comandos estão comentados em `config.js`)

### Passo 4: Configurar Storage

1. Crie bucket `product-images` (público)
2. Configure políticas RLS

## 📂 Arquivos

- `index.html` - Página principal
- `styles.css` - Design e animações
- `config.js` - Configurações Supabase
- `app.js` - Lógica da aplicação

## 💡 Modo Demo

Funciona sem Supabase configurado para testes!

## 🎨 Design

- Gradientes modernos
- Animações suaves
- 100% Responsivo
- Fontes: Sora + Plus Jakarta Sans

---

Desenvolvido com ❤️ para Moçambique
