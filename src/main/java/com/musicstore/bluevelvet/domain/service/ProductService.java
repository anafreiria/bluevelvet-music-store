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
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    // CORREÇÃO: Usar o caminho relativo da raiz, igual ao CategoryService e WebConfig
    private final Path rootLocation = Paths.get("user-images");

    // Bloco de inicialização para garantir que a pasta exista
    {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage location", e);
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
        return repository.findAll(pageable).map(ProductConverter::convertToProductResponse);
    }

    public void deleteById(Long id) {
        Product product = repository.findById(id).orElseThrow(() ->
                new ProductNotFoundException("Unable to find a product with id %d".formatted(id))
        );

        // Tenta deletar a imagem do disco ao deletar o produto
        if (product.getMainImage() != null) {
            try {
                Files.deleteIfExists(this.rootLocation.resolve(product.getMainImage()));
            } catch (IOException e) {
                log.warn("Failed to delete image file for product {}", id);
            }
        }

        repository.deleteById(id);
    }

    public ProductResponse createProduct(ProductRequest request) {
        Product productCreated = ProductConverter.convertToProduct(request);
        resolveCategory(request, productCreated);

        Product product = repository.save(productCreated);

        BoxDimension boxDimension = ProductConverter.convertBoxDimension(request);
        if(boxDimension != null) {
            boxDimension.setProduct(product);
            product.setBoxDimension(boxDimension);
            boxDimensionRepository.save(product.getBoxDimension());
        }

        List<ProductDetail> productDetails = ProductConverter.convertProductDetail(request);
        if(productDetails != null) {
            productDetails.forEach(productDetail -> productDetail.setProduct(product));
            product.setProductDetails(productDetails);
            productDetailRepository.saveAll(product.getProductDetails());
        }

        return ProductConverter.convertToProductResponse(product);
    }

    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = repository.findById(id).orElseThrow(() ->
                new ProductNotFoundException("Unable to find a product with id %d".formatted(id))
        );

        product.setName(request.getName());
        product.setShortDescription(request.getShortDescription());
        product.setFullDescription(request.getFullDescription());
        product.setBrand(request.getBrand());

        resolveCategory(request, product);

        product.setListPrice(request.getListPrice());
        product.setDiscount(request.getDiscount());
        product.setEnabled(request.getIsEnabled());
        product.setInStock(request.getInStock());
        product.setCost(request.getCost());
        product.setUpdateTime(LocalDateTime.now());

        if (product.getBoxDimension() == null && request.getDimension() != null) {
            BoxDimension newDim = ProductConverter.convertBoxDimension(request);
            newDim.setProduct(product);
            product.setBoxDimension(newDim);
        } else if (product.getBoxDimension() != null && request.getDimension() != null) {
            product.getBoxDimension().setWidth(request.getDimension().getWidth());
            product.getBoxDimension().setHeight(request.getDimension().getHeight());
            product.getBoxDimension().setLength(request.getDimension().getLength());
            product.getBoxDimension().setWeight(request.getDimension().getWeight());
        }

        List<ProductDetail> newDetails = ProductConverter.convertProductDetail(request);
        if (product.getProductDetails() == null) {
            product.setProductDetails(new ArrayList<>());
        }
        product.getProductDetails().clear();
        if (newDetails != null) {
            newDetails.forEach(d -> d.setProduct(product));
            product.getProductDetails().addAll(newDetails);
        }

        Product updatedProduct = repository.save(product);
        return ProductConverter.convertToProductResponse(updatedProduct);
    }

    public ProductResponse updateProductImage(Long id, MultipartFile file) {
        Product product = repository.findById(id).orElseThrow(() ->
                new ProductNotFoundException("Unable to find a product with id %d".formatted(id))
        );

        if (file == null || file.isEmpty()) {
            return ProductConverter.convertToProductResponse(product);
        }

        try {
            // Deleta imagem antiga se existir
            if (product.getMainImage() != null) {
                Files.deleteIfExists(this.rootLocation.resolve(product.getMainImage()));
            }

            // Salva nova imagem na pasta RAIZ (user-images)
            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), this.rootLocation.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

            product.setMainImage(filename);
            return ProductConverter.convertToProductResponse(repository.save(product));
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    private void resolveCategory(ProductRequest request, Product product) {
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
    }
}