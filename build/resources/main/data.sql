CREATE DATABASE IF NOT EXISTS bluevelvet;
USE bluevelvet;

-- Reset existing data
DELETE FROM categories;
DELETE FROM product_detail;
DELETE FROM box_dimension;
DELETE FROM product;

-- Categories seed
INSERT INTO categories (id, name, description, parent_id) VALUES
(1, 'CD', 'Discos físicos', NULL),
(2, 'MP3', 'Downloads digitais', NULL),
(3, 'T-Shirt', 'Camisetas e merch', NULL),
(4, 'Book', 'Livros e guiass', NULL),
(5, 'Poster', 'Posters e arte', NULL),
(6, 'Audio Equipment', 'Equipamentos de áudio', NULL),
(7, 'Musical Instruments', 'Instrumentos musicais', NULL),
(8, 'Vinyl Records', 'LPs e vinis', NULL),
(9, 'Digital Downloads', 'Músicas digitais', NULL),
(10, 'Apparel', 'Vestuário e merch', NULL);

-- Products seed
INSERT INTO product (id, name, short_description, full_description, brand, category, list_price, discount, enabled, in_stock, creation_time, update_time, cost) VALUES
(1, 'Guided by Voices - Bee Thousand', 'Indie rock classic on CD', 'Bee Thousand is the seventh album by American indie rock band Guided by Voices, released on June 21, 1994.', 'Matador Records', 'CD', 19.99, 0.00, 1, 1, '2024-11-29 12:00:00', '2024-11-29 12:00:00', 10.00),
(2, 'Pavement - Slanted and Enchanted', 'Iconic indie rock album in digital format', 'Slanted and Enchanted is the debut studio album by American indie rock band Pavement, released on April 20, 1992.', 'Domino Recording Co', 'MP3', 9.99, 0.00, 1, 1, '2024-11-29 12:00:00', '2024-11-29 12:00:00', 5.00),
(3, 'Neutral Milk Hotel T-Shirt', 'Comfortable band t-shirt', 'Neutral Milk Hotel T-Shirt featuring artwork from their iconic album In the Aeroplane Over the Sea.', 'Merge Records', 'T-Shirt', 19.99, 0.00, 1, 1, '2024-11-29 12:00:00', '2024-11-29 12:00:00', 8.00),
(4, 'Indie Rock 101', 'Comprehensive guide to the indie rock scene', 'Indie Rock 101 is an in-depth book covering the history, culture, and evolution of indie rock music.', 'Music Books', 'Book', 24.99, 0.00, 1, 1, '2024-11-29 12:00:00', '2024-11-29 12:00:00', 10.00),
(5, 'The Jesus and Mary Chain Poster', 'High-quality poster of The Jesus and Mary Chain', 'Iconic image of The Jesus and Mary Chain, printed on high-quality paper.', 'Art & Prints', 'Poster', 14.99, 0.00, 1, 1, '2024-11-29 12:00:00', '2024-11-29 12:00:00', 5.00),
(6, 'My Bloody Valentine - Loveless', 'Seminal shoegaze album on CD', 'Loveless is a groundbreaking shoegaze album released in 1991 by Creation Records.', 'Creation Records', 'CD', 19.99, 0.00, 1, 1, '2024-11-29 12:00:00', '2024-11-29 12:00:00', 10.00),
(7, 'Yo La Tengo - I Can Hear the Heart Beating as One', 'Classic indie rock album in MP3 format', 'Blends elements of rock, pop, and experimental music.', 'Matador Records', 'MP3', 9.99, 0.00, 1, 1, '2024-11-29 12:00:00', '2024-11-29 12:00:00', 5.00),
(8, 'Sonic Youth T-Shirt', 'Official Sonic Youth band T-shirt', 'Inspired by the album Washing Machine. 100% cotton.', 'Geffen Records', 'T-Shirt', 19.99, 0.00, 1, 1, '2024-11-29 12:00:00', '2024-11-29 12:00:00', 8.00),
(9, 'Our Band Could Be Your Life', 'Book on indie bands in the 80s', 'Scenes from the American Indie Underground 1981-1991 by Michael Azerrad.', 'Indie Publishing', 'Book', 24.99, 0.00, 1, 1, '2024-11-29 12:00:00', '2024-11-29 12:00:00', 10.00),
(10, 'The Velvet Underground Poster', 'Classic art print featuring The Velvet Underground', 'High-quality poster perfect for fans of the influential rock band.', 'Classic Prints', 'Poster', 19.99, 0.00, 1, 1, '2024-11-29 12:00:00', '2024-11-29 12:00:00', 8.00);

-- Box dimensions
INSERT INTO box_dimension (id, length, width, height, weight, product_id) VALUES
(1, 5.0, 5.0, 0.2, 0.3, 1),
(2, 0.0, 0.0, 0.0, 0.0, 2),
(3, 12.0, 10.0, 1.0, 0.3, 3),
(4, 9.0, 6.0, 1.0, 0.8, 4),
(5, 24.0, 18.0, 0.1, 0.3, 5),
(6, 5.5, 5.0, 0.4, 0.2, 6),
(7, 0.0, 0.0, 0.0, 0.0, 7),
(8, 12.0, 10.0, 1.0, 0.3, 8),
(9, 9.0, 6.0, 1.2, 1.1, 9),
(10, 24.0, 18.0, 0.1, 0.3, 10);

-- Product details
INSERT INTO product_detail (id, name, value, product_id) VALUES
-- Product 1
(1, 'Release Year', '1994', 1),
(2, 'Condition', 'New', 1),
(3, 'Format', 'CD', 1),
-- Product 2
(4, 'Release Year', '1992', 2),
(5, 'Condition', 'New', 2),
(6, 'Format', 'MP3', 2),
-- Product 3
(7, 'Size', 'M', 3),
(8, 'Material', '100% Cotton', 3),
(9, 'Color', 'Black', 3),
(10, 'Condition', 'New', 3),
-- Product 4
(11, 'Author', 'Richard Wright', 4),
(12, 'Publication Year', '2010', 4),
(13, 'Condition', 'New', 4),
(14, 'Pages', '320', 4),
-- Product 5
(15, 'Condition', 'New', 5),
(16, 'Material', 'High-quality paper', 5),
(17, 'Dimensions', '24 x 18 inches', 5),
-- Product 6
(18, 'Release Year', '1991', 6),
(19, 'Condition', 'New', 6),
(20, 'Format', 'CD', 6),
-- Product 7
(21, 'Release Year', '1997', 7),
(22, 'Condition', 'New', 7),
(23, 'Format', 'MP3', 7),
-- Product 8
(24, 'Material', '100% Cotton', 8),
(25, 'Size', 'Available in S, M, L, XL', 8),
(26, 'Condition', 'New', 8),
-- Product 9
(27, 'Author', 'Michael Azerrad', 9),
(28, 'Publisher', 'Indie Publishing', 9),
(29, 'Release Year', '2001', 9),
(30, 'Condition', 'New', 9),
(31, 'Pages', '528', 9),
-- Product 10
(32, 'Condition', 'New', 10),
(33, 'Material', 'Glossy Paper', 10),
(34, 'Dimensions', '24 x 18 inches', 10);
