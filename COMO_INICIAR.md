# 🚀 Como Iniciar o Jogo Canastra

## Script Automático (Recomendado)

Use o script `start-canastra.sh` para gerenciar facilmente o jogo:

```bash
# Ir para a pasta do projeto
cd /path/to/canastra

# Iniciar o jogo (backend + frontend)
./start-canastra.sh start

# Verificar se está rodando
./start-canastra.sh status

# Parar o jogo
./start-canastra.sh stop

# Reiniciar tudo
./start-canastra.sh restart

# Ver logs recentes (para debug)
./start-canastra.sh logs

# Ver ajuda
./start-canastra.sh help
```

## URLs de Acesso

Após iniciar, o jogo estará disponível em:
- **Local**: http://localhost:3004
- **Rede local**: http://YOUR_LOCAL_IP:3004 (substitua YOUR_LOCAL_IP pelo seu IP)

## Comandos Manuais (se necessário)

### Iniciar Backend (Servidor)
```bash
cd /path/to/canastra/server
ADMIN_PASSWORD=test_admin_123 PORT=3002 npm start
```

### Iniciar Frontend (Cliente)
```bash
cd /path/to/canastra/client
HOST=0.0.0.0 PORT=3004 npm start
```

### Parar Tudo
```bash
# Parar processos npm
pkill -f "npm start"

# Ou matar por porta específica
lsof -ti:3002 | xargs kill -9  # Backend
lsof -ti:3004 | xargs kill -9  # Frontend
```

## Verificação de Status

### Verificar se as portas estão em uso:
```bash
netstat -ln | grep :3002  # Backend
netstat -ln | grep :3004  # Frontend
```

### Verificar processos:
```bash
ps aux | grep npm
```

## Resolução de Problemas

### 1. Erro "Port already in use"
```bash
# Matar processo na porta
lsof -ti:3002 | xargs kill -9
lsof -ti:3004 | xargs kill -9

# Ou usar o script
./start-canastra.sh restart
```

### 2. Erro de permissão no banco
```bash
chmod 664 /path/to/canastra/server/database.db
```

### 3. Erro de dependências
```bash
# Backend
cd server && npm install

# Frontend
cd client && npm install
```

### 4. Ver logs de erro
```bash
# Com o script
./start-canastra.sh logs

# Ou manualmente
tail -f /tmp/canastra-backend.log
tail -f /tmp/canastra-frontend.log
```

## Usuários de Teste

- **Admin**: `admin` / `test_admin_123`
- **Usuários**: `marcos`, `michele`, `miriam`, `marcelo` (senha = nome)

## Dicas

1. **Use sempre o script** `start-canastra.sh` - é mais fácil
2. **Verificar status** antes de iniciar: `./start-canastra.sh status`
3. **Em caso de problemas**: `./start-canastra.sh restart`
4. **Para debug**: `./start-canastra.sh logs`
5. **Acesso externo**: Use o IP da rede local (192.168.1.23:3004)