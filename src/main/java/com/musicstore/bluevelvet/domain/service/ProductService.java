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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList; // Importante para a correção
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Log4j2
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository repository;
    private final CategoryRepository categoryRepository;

    private final BoxDimensionRepository boxDimensionRepository;

    private final ProductDetailRepository productDetailRepository;

    // Caminho absoluto para evitar erros de pasta não encontrada
    private final Path rootLocation = Paths.get(System.getProperty("user.dir") + "/src/main/resources/static/user-images");

    {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

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
        Product productCreated = ProductConverter.convertToProduct(request);

        String categoryInput = request.getCategory();
        if (categoryInput != null) {
            if (categoryInput.matches("\\d+")) {
                Long categoryId = Long.parseLong(categoryInput);
                Category category = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada com ID: " + categoryId));
                productCreated.setCategory(category.getName());
            } else {
                productCreated.setCategory(categoryInput);
            }
        }

        Product product = repository.save(productCreated);

        BoxDimension boxDimension = ProductConverter.convertBoxDimension(request);
        boxDimension.setProduct(product);
        product.setBoxDimension(boxDimension);

        List<ProductDetail> productDetails = ProductConverter.convertProductDetail(request);
        productDetails.forEach(productDetail -> productDetail.setProduct(product));
        product.setProductDetails(productDetails);

        boxDimensionRepository.save(product.getBoxDimension());
        productDetailRepository.saveAll(product.getProductDetails());

        return ProductConverter.convertToProductResponse(product);
    }

    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.debug("Trying to find a product with id {}", id);
        Product product = repository.findById(id).orElseThrow(() ->
                new ProductNotFoundException("Unable to find a product with id %d".formatted(id))
        );

        // Atualização dos campos básicos
        product.setName(request.getName());
        product.setShortDescription(request.getShortDescription());
        product.setFullDescription(request.getFullDescription());
        product.setBrand(request.getBrand());

        String categoryInput = request.getCategory();
        if (categoryInput != null) {
            if (categoryInput.matches("\\d+")) {
                Long categoryId = Long.parseLong(categoryInput);
                Category category = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada com ID: " + categoryId));
                product.setCategory(category.getName());
            } else {
                product.setCategory(categoryInput);
            }
        }

        product.setListPrice(request.getListPrice());
        product.setDiscount(request.getDiscount());
        product.setEnabled(request.getIsEnabled());
        product.setInStock(request.getInStock());
        if (request.getCreationTime() != null) {
            product.setCreationTime(request.getCreationTime());
        }
        product.setUpdateTime(LocalDateTime.now());
        product.setCost(request.getCost());

        if (product.getBoxDimension() != null && request.getDimension() != null) {
            product.getBoxDimension().setWidth(request.getDimension().getWidth());
            product.getBoxDimension().setHeight(request.getDimension().getHeight());
            product.getBoxDimension().setLength(request.getDimension().getLength());
            product.getBoxDimension().setWeight(request.getDimension().getWeight());
        }

        // --- CORREÇÃO HIBERNATE ---
        // Limpa e adiciona novos detalhes na mesma coleção gerenciada pelo JPA.
        List<ProductDetail> newDetails = ProductConverter.convertProductDetail(request);

        if (product.getProductDetails() == null) {
            product.setProductDetails(new ArrayList<>());
        }

        product.getProductDetails().clear(); // Remove os antigos

        if (newDetails != null) {
            newDetails.forEach(d -> d.setProduct(product)); // Define o pai
            product.getProductDetails().addAll(newDetails); // Adiciona os novos
        }
        // --------------------------

        // Basta salvar o produto, o Cascade cuidará dos detalhes
        Product updatedProduct = repository.save(product);

        return ProductConverter.convertToProductResponse(updatedProduct);
    }

    public ProductResponse updateProductImage(Long id, MultipartFile file) {

        // CORREÇÃO: Acha o produto primeiro.
        Product product = repository.findById(id).orElseThrow(() ->
                new ProductNotFoundException("Unable to find a product with id %d".formatted(id))
        );

        // CORREÇÃO FINAL: Se o arquivo for nulo ou vazio, retorna o produto sem erro. (Upload opcional)
        if (file == null || file.isEmpty()) {
            log.warn("Image update skipped for product {} because file was empty.", id);
            return ProductConverter.convertToProductResponse(product);
        }

        // O restante da lógica de armazenamento só roda se houver arquivo
        try {
            if (product.getMainImage() != null) {
                // Tenta deletar a imagem antiga
                Files.deleteIfExists(this.rootLocation.resolve(product.getMainImage()));
            }
            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            // Salva a nova imagem no caminho estático
            Files.copy(file.getInputStream(), this.rootLocation.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

            product.setMainImage(filename);
            Product saved = repository.save(product);
            return ProductConverter.convertToProductResponse(saved);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }
}