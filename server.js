/**
 * Servidor Express local para desenvolvimento
 * Este arquivo usa o formato ESM
 */
// Servidor Express para desenvolvimento local
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Client, Databases } from 'node-appwrite';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import http from 'http';

// Carregar variáveis de ambiente do .env
dotenv.config();

const app = express();
const defaultPort = 3000;
let port = process.env.PORT || defaultPort;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rota principal para verificar se o servidor está rodando
app.get('/', (req, res) => {
  res.send('API local rodando! Use /api/create-checkout-session para criar sessões de checkout do Stripe.');
});

// Endpoint para criar sessão de checkout do Stripe
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Buscar chave secreta do Stripe no Appwrite
    let stripeSecretKey = '';
    
    // Inicializar cliente Appwrite
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
      
    const databases = new Databases(client);
    
    try {
      // Buscar configurações do site no Appwrite
      console.log('Buscando configurações no Appwrite...');
      console.log('Database ID:', process.env.APPWRITE_DATABASE_ID);
      console.log('Collection ID:', process.env.APPWRITE_SITE_CONFIG_COLLECTION_ID);
      
      const response = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_SITE_CONFIG_COLLECTION_ID
      );
      
      if (response.documents.length > 0) {
        const config = response.documents[0];
        stripeSecretKey = config.stripe_secret_key;
        console.log('Chave secreta do Stripe obtida com sucesso do Appwrite');
      } else {
        console.log('Nenhum documento de configuração encontrado no Appwrite');
      }
    } catch (appwriteError) {
      console.error('Erro ao buscar chave do Stripe no Appwrite:', appwriteError);
      return res.status(500).json({ 
        error: 'Erro ao buscar configurações do Stripe',
        details: appwriteError.message
      });
    }
    
    if (!stripeSecretKey) {
      console.error('Chave secreta do Stripe não encontrada');
      return res.status(500).json({ error: 'Chave secreta do Stripe não encontrada' });
    }
    
    const { amount, currency = 'usd', name, success_url, cancel_url } = req.body;
    console.log('Dados recebidos:', { amount, currency, success_url, cancel_url });
    
    if (!amount || !success_url || !cancel_url) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes' });
    }
    
    // Inicializar o Stripe com a chave obtida
    const stripe = new Stripe(stripeSecretKey);

    // Lista de nomes de produtos genéricos
    const productNames = [
      "Personal Development Ebook",
      "Financial Freedom Ebook",
      "Digital Marketing Guide",
      "Health & Wellness Ebook",
      "Productivity Masterclass",
      "Mindfulness & Meditation Guide",
      "Entrepreneurship Blueprint",
      "Wellness Program",
      "Success Coaching",
      "Executive Mentoring",
      "Learning Resources",
      "Online Course Access",
      "Premium Content Subscription",
      "Digital Asset Package"
    ];
    
    // Selecionar um nome aleatório
    const randomProductName = productNames[Math.floor(Math.random() * productNames.length)];
    
    console.log('Criando sessão de checkout para:', {
      amount: amount,
      currency: currency,
      product: randomProductName,
    });
    
    // Criar a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: randomProductName,
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url,
      cancel_url,
    });
    
    console.log('Sessão criada com sucesso:', session.id);
    res.status(200).json({ sessionId: session.id });
    
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Função para verificar se uma porta está em uso
function isPortInUse(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer()
      .once('error', err => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        server.once('close', () => resolve(false));
        server.close();
      })
      .listen(port);
  });
}

// Tentar iniciar o servidor na porta padrão ou em uma porta alternativa
async function startServer() {
  // Checar se a porta padrão está em uso
  if (port === defaultPort) {
    const portInUse = await isPortInUse(port);
    if (portInUse) {
      // Tentar portas alternativas
      for (let alternativePort = 3001; alternativePort < 3010; alternativePort++) {
        const alternativePortInUse = await isPortInUse(alternativePort);
        if (!alternativePortInUse) {
          port = alternativePort;
          console.log(`Porta ${defaultPort} está em uso, usando porta alternativa ${port}`);
          break;
        }
      }
    }
  }

  // Iniciar servidor
  app.listen(port, () => {
    console.log(`Servidor API local rodando na porta ${port}`);
    console.log(`Acesse http://localhost:${port}/ para verificar`);
    
    // Se estamos usando uma porta diferente da 3000, mostrar uma mensagem especial
    if (port !== 3000) {
      console.log(`ATENÇÃO: A API está rodando na porta ${port} em vez da porta padrão 3000.`);
      console.log(`Se você configurou sua aplicação para usar http://localhost:3000, atualize para http://localhost:${port}`);
    }
  });
}

// Iniciar o servidor
startServer().catch(err => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
}); 