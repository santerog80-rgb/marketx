// Configuração do Supabase
// INSTRUÇÕES: 
// 1. Crie uma conta em https://supabase.com
// 2. Crie um novo projeto
// 3. Vá em Project Settings > API
// 4. Copie a URL do projeto e a chave anon/public
// 5. Substitua os valores abaixo

const SUPABASE_CONFIG = {
    url: 'SUA_SUPABASE_URL_AQUI', // Ex: https://xxxxxxxxxxxxx.supabase.co
    anonKey: 'SUA_SUPABASE_ANON_KEY_AQUI' // Ex: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
};

// Estrutura das tabelas no Supabase:

/*
TABELA: users
Colunas:
- id: uuid (primary key, default: uuid_generate_v4())
- email: text (unique, not null)
- name: text (not null)
- phone: text
- created_at: timestamp (default: now())

SQL para criar:
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


TABELA: products
Colunas:
- id: uuid (primary key, default: uuid_generate_v4())
- user_id: uuid (foreign key -> users.id)
- title: text (not null)
- description: text
- price: numeric (not null)
- currency: text (not null)
- category: text (not null)
- condition: text
- location: text
- images: text[] (array de URLs)
- created_at: timestamp (default: now())

SQL para criar:
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    category TEXT NOT NULL,
    condition TEXT,
    location TEXT,
    images TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);


TABELA: reviews
Colunas:
- id: uuid (primary key, default: uuid_generate_v4())
- product_id: uuid (foreign key -> products.id)
- user_id: uuid (foreign key -> users.id)
- rating: integer (not null, check: rating >= 1 AND rating <= 5)
- comment: text
- created_at: timestamp (default: now())

SQL para criar:
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


TABELA: favorites
Colunas:
- id: uuid (primary key, default: uuid_generate_v4())
- user_id: uuid (foreign key -> users.id)
- product_id: uuid (foreign key -> products.id)
- created_at: timestamp (default: now())

SQL para criar:
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);


STORAGE BUCKET: product-images
Configuração:
- Public: true
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
- Max file size: 5MB

Para criar o bucket:
1. Vá em Storage no Supabase
2. Clique em "New Bucket"
3. Nome: "product-images"
4. Marque "Public bucket"
5. Crie

Políticas de Storage (RLS):
-- Permitir upload para usuários autenticados
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Permitir acesso público para leitura
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');


CONFIGURAÇÃO DE AUTENTICAÇÃO:
1. Vá em Authentication > Providers
2. Habilite "Email"
3. Configure as configurações de email conforme necessário
*/

// Taxas de conversão de moedas (atualize regularmente ou use uma API de câmbio)
const EXCHANGE_RATES = {
    MZN: 1,        // Metical (base)
    USD: 0.016,    // Dólar
    EUR: 0.015,    // Euro
    ZAR: 0.29,     // Rand Sul-Africano
    GBP: 0.013     // Libra Esterlina
};

// Símbolos de moeda
const CURRENCY_SYMBOLS = {
    MZN: 'MT',
    USD: '$',
    EUR: '€',
    ZAR: 'R',
    GBP: '£'
};

// Categorias com ícones
const CATEGORIES = {
    all: { icon: '🏪', name: 'Todos' },
    electronics: { icon: '📱', name: 'Eletrônicos' },
    vehicles: { icon: '🚗', name: 'Veículos' },
    property: { icon: '🏠', name: 'Imóveis' },
    fashion: { icon: '👗', name: 'Moda e Beleza' },
    home: { icon: '🛋️', name: 'Casa e Jardim' },
    sports: { icon: '⚽', name: 'Esportes e Lazer' },
    books: { icon: '📚', name: 'Livros e Educação' },
    toys: { icon: '🎮', name: 'Brinquedos e Jogos' },
    services: { icon: '🔧', name: 'Serviços' },
    other: { icon: '📦', name: 'Outros' }
};
