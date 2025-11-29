# 🎵 Blue Velvet Music Store API

## 🎯 Foco Deste Incremento (US-0907)

Este *commit* estabelece a infraestrutura básica de persistência de dados necessária para a implementação da História de Usuário:

### US-0907: Listar Categorias de Produtos

Como um desenvolvedor, o objetivo principal foi garantir que a aplicação Spring Boot consiga se conectar de forma **segura e estável** ao MySQL 8.0 para que os modelos de Categoria e Produto possam ser criados e manipulados.

---
## 💾 Base de Dados Inicial (SQL)

**A base de dados SQL está incluída!** O script **`data.sql`** (ou `bluevelvet_init.sql`), localizado em `src/main/resources`, contém os comandos para:
1.  **Criar as tabelas** (`users`, `categories`, `produtos`).
2.  **Popular o banco** com dados iniciais.

---

## 🛠️ Tecnologias e Configurações

| Categoria | Tecnologia | Observações |
| :--- | :--- | :--- |
| **Backend** | Spring Boot | Núcleo da API RESTful. |
| **Banco de Dados** | MySQL 8.0 | Necessário para persistência de Categorias e Produtos. |
| **Conexão** | Spring Data JPA / Hibernate | `ddl-auto: update` garantindo a criação automática de tabelas. |
| **Segurança** | Variáveis de Ambiente | Uso da variável `${DB_PASSWORD}` para proteger as credenciais. |

---

## ⚙️ Setup Local (Conexão e Segurança)

Para executar o projeto e avançar na implementação da US-0907, configure seu ambiente local:

### 1. Conexão com o MySQL

* **Porta:** A aplicação está configurada para se conectar ao servidor MySQL na porta **`3306`** (conforme `application.yml`).
* **Usuário:** O usuário definido é **`root`**.
* **Database:** A aplicação tentará criar o banco de dados **`bluevelvet`** se ele não existir (embora esta função esteja desabilitada para simplificação, a aplicação espera encontrar este schema).

### 2. Segurança de Credenciais (CRÍTICO)

A senha de conexão **não está no repositório**. Você deve defini-la localmente.

* **Variável Necessária:** **`DB_PASSWORD`**
* **Valor:** A senha real do seu usuário `root` do MySQL (Ex: `Test@1234`).

> **Instrução de Setup Local:** No IntelliJ, defina essa variável em **Run $\rightarrow$ Edit Configurations...** na seção **Environment Variables**.

---

## ▶️ Como Executar

1.  Garanta que o serviço **MySQL80** (ou sua versão) esteja **ativo** (Running) no seu sistema.
2.  Execute a classe principal: **`BluevelvetApplication.java`**.
3.  A aplicação deve inicializar completamente, pronta para criar as entidades de Categoria e Produto.
