import axios from 'axios';

// Configuração básica do Axios apontando para o seu Django
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://tcc-sistema.onrender.com/api/',
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;