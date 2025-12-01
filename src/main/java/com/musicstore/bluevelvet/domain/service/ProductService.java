package com.musicstore.bluevelvet.domain.service;

import com.musicstore.bluevelvet.api.request.ProductRequest;
import com.musicstore.bluevelvet.api.response.ProductResponse;
import com.musicstore.bluevelvet.domain.Category;
import com.musicstore.bluevelvet.domain.converter.ProductConverter;
import com.musicstore.bluevelvet.domain.exception.ProductNotFoundException;
import com.musicstore.bluevelvet.infrastructure.CategoryRepository;
import com.musicstore.bluevelvet.infrastructure.entity.BoxDimension;
import com.musicstore.bluevelvet.infrastructure.entity.Product;
import com.musicstore.bluevelvet.infrastructure.entity.ProductDetail;
import com.musicstore.bluevelvet.infrastructure.repository.BoxDimensionRepository;
import com.musicstore.bluevelvet.infrastructure.repository.ProductDetailRepository;
import com.musicstore.bluevelvet.infrastructure.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Log4j2
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository repository;
    private final CategoryRepository categoryRepository;
    private final BoxDimensionRepository boxDimensionRepository;

    private final ProductDetailRepository productDetailRepository;



    public ProductResponse findById(Long id) {
        log.debug("Trying to find a product with id {}", id);
        Optional<Product> productOptional = repository.findById(id);

        if (productOptional.isEmpty()) {
            log.error("Unable to find a product with id {}", id);
            throw new ProductNotFoundException("Unable to find a product with id %d".formatted(id));
        }

        return ProductConverter.convertToProductResponse(productOptional.get());
    }

    public Page<ProductResponse> findAll(Pageable pageable) {
        log.debug("Trying to find all products with pageable {}", pageable);

        return repository.findAll(pageable).map(ProductConverter::convertToProductResponse);
    }

    public void deleteById(Long id) {
        log.debug("Trying to find a product with id {}", id);
        repository.findById(id).orElseThrow(() ->
                new ProductNotFoundException("Unable to find a product with id %d".formatted(id))
        );

        repository.deleteById(id);
    }

    public ProductResponse createProduct(ProductRequest request) {
        // 1. Converte os dados básicos (Nome, Preço, Descrição, etc)
        Product productCreated = ProductConverter.convertToProduct(request);

        // --- NOVA LÓGICA DE CATEGORIA (HÍBRIDA) ---
        // O request.getCategory() pode vir como "10" (ID) ou "CD" (Nome - legado)
        String categoryInput = request.getCategory();

        if (categoryInput != null) {
            // Verifica se é um número (ID) usando Regex
            if (categoryInput.matches("\\d+")) {
                // CASO 1: É um ID (Vindo do seu novo formulário)
                Long categoryId = Long.parseLong(categoryInput);

                Category category = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada com ID: " + categoryId));

                // AQUI ESTÁ A CORREÇÃO: Pegamos o NOME do objeto e salvamos na String
                productCreated.setCategory(category.getName());
            } else {
                // CASO 2: Já é um Nome (Compatibilidade com outros devs/scripts)
                productCreated.setCategory(categoryInput);
            }
        }
        // -------------------------------------------

        // 2. Salva o produto (Agora o campo category é uma String válida, ex: "CD")
        Product product = repository.save(productCreated);

        // 3. Configura e salva as Dimensões (Mantido igual)
        BoxDimension boxDimension = ProductConverter.convertBoxDimension(request);
        boxDimension.setProduct(product);
        product.setBoxDimension(boxDimension);

        // 4. Configura e salva os Detalhes (Mantido igual)
        List<ProductDetail> productDetails = ProductConverter.convertProductDetail(request);
        productDetails.forEach(productDetail -> productDetail.setProduct(product));
        product.setProductDetails(productDetails);

        // Salva as entidades filhas
        boxDimensionRepository.save(product.getBoxDimension());
        productDetailRepository.saveAll(product.getProductDetails());

        return ProductConverter.convertToProductResponse(product);
    }

    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.debug("Trying to find a product with id {}", id);

        // 1. Busca o produto existente
        Product product = repository.findById(id).orElseThrow(() ->
                new ProductNotFoundException("Unable to find a product with id %d".formatted(id))
        );

        // 2. Atualiza campos simples
        product.setName(request.getName());
        product.setShortDescription(request.getShortDescription());
        product.setFullDescription(request.getFullDescription());
        product.setBrand(request.getBrand());

        // --- CORREÇÃO DA CATEGORIA (LÓGICA HÍBRIDA) ---
        // Verifica o que veio do request: ID ("5") ou Nome ("Livros")
        String categoryInput = request.getCategory();

        if (categoryInput != null) {
            // Se for apenas números (Regex \\d+), tratamos como ID
            if (categoryInput.matches("\\d+")) {
                Long categoryId = Long.parseLong(categoryInput);

                // Busca a categoria no banco para descobrir o NOME dela
                Category category = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada com ID: " + categoryId));

                // Salva o NOME no produto (String)
                product.setCategory(category.getName());
            } else {
                // Se já for texto, salva direto (compatibilidade com dados antigos)
                product.setCategory(categoryInput);
            }
        }
        // ----------------------------------------------

        product.setListPrice(request.getListPrice());
        product.setDiscount(request.getDiscount());
        product.setEnabled(request.getIsEnabled());
        product.setInStock(request.getInStock());

        // Em update, geralmente NÃO alteramos a data de criação, apenas a de update
        // product.setCreationTime(request.getCreationTime());
        product.setUpdateTime(java.time.LocalDateTime.now());

        product.setCost(request.getCost());

        // Atualiza dimensões
        if (product.getBoxDimension() != null && request.getDimension() != null) {
            product.getBoxDimension().setWidth(request.getDimension().getWidth());
            product.getBoxDimension().setHeight(request.getDimension().getHeight());
            product.getBoxDimension().setLength(request.getDimension().getLength());
            product.getBoxDimension().setWeight(request.getDimension().getWeight());
        }

        // Atualiza detalhes (Remove os antigos e cria novos)
        if (product.getProductDetails() != null) {
            productDetailRepository.deleteAll(product.getProductDetails());
        }

        // Salva o produto base primeiro
        Product updatedProduct = repository.save(product);

        // Recria e salva os detalhes
        List<ProductDetail> productDetails = ProductConverter.convertProductDetail(request);
        productDetails.forEach(productDetail -> productDetail.setProduct(updatedProduct));
        updatedProduct.setProductDetails(productDetails);
        productDetailRepository.saveAll(productDetails);

        return ProductConverter.convertToProductResponse(updatedProduct);
    }

}
