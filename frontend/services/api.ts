import axios from 'axios';

// Configuração básica do Axios apontando para o seu Django
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // O endereço que você vê no terminal do Python
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;