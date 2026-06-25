import axios from 'axios';

// Configuração básica do Axios apontando para o seu Django
const api = axios.create({
  baseURL: 'NEXT_PUBLIC_API_URL=https://tcc-sistema.onrender.com', // O endereço que você vê no terminal do Python
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;