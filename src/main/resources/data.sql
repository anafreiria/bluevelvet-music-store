-- bluevelvet_init.sql
CREATE DATABASE IF NOT EXISTS bluevelvet;
USE bluevelvet;

-- Tabela de Usuários
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    papel VARCHAR(50) NOT NULL
);

INSERT INTO users (nome, email, password, papel)
VALUES ('Admin', 'admin@bluevelvet.com', '123456', 'ADMIN');

-- Tabela de Categorias
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    parent_id BIGINT DEFAULT NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Inserção das Categorias com descrição
INSERT INTO categories (name, description, parent_id) VALUES
('Instrumentos de Corda', 'Todos os instrumentos que utilizam cordas para produzir som, como violões e guitarras.', NULL),
('Guitarras', 'Modelos de guitarra Stratocaster, Telecaster e semi-acústicas.', 1),
('Violões', 'Violões clássicos, folk e de nylon para todos os níveis.', 1),
('Instrumentos de Tecla', 'Abrange pianos digitais, teclados controladores e sintetizadores.', NULL),
('Teclados', 'Teclados arranjadores e controladores MIDI para produção musical.', 4);

-- Tabela de Produtos
CREATE TABLE produtos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id BIGINT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Inserção dos Produtos
INSERT INTO produtos (name, description, price, category_id) VALUES
('Guitarra Stratocaster', 'Guitarra modelo Strat', 3500.00, 2),
('Violão Yamaha F310', 'Violão clássico', 900.00, 3),
('Teclado Casio CTK-3500', 'Teclado digital', 1200.00, 5);
