package com.musicstore.bluevelvet.domain.service;

import com.musicstore.bluevelvet.api.request.ProductRequest;
import com.musicstore.bluevelvet.api.response.ProductResponse;
import com.musicstore.bluevelvet.domain.converter.ProductConverter;
import com.musicstore.bluevelvet.domain.exception.ProductNotFoundException;
import com.musicstore.bluevelvet.infrastructure.entity.*;
import com.musicstore.bluevelvet.infrastructure.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private final ProductImageRepository productImageRepository;

    private final Path rootLocation = Paths.get("user-images");

    {
        try { Files.createDirectories(rootLocation); } catch (IOException e) { throw new RuntimeException(e); }
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        return repository.findById(id)
                .map(ProductConverter::convertToProductResponse)
                .orElseThrow(() -> new ProductNotFoundException("Produto não encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(ProductConverter::convertToProductResponse);
    }

    @Transactional
    public void deleteById(Long id) {
        Product product = repository.findById(id).orElseThrow(() -> new ProductNotFoundException("ID: " + id));
        try {
            if (product.getMainImage() != null) Files.deleteIfExists(rootLocation.resolve(product.getMainImage()));
            if (product.getAdditionalImages() != null) {
                for (ProductImage img : product.getAdditionalImages()) {
                    Files.deleteIfExists(rootLocation.resolve(img.getFileName()));
                }
            }
        } catch (IOException e) { log.warn("Erro ao deletar arquivos"); }
        repository.deleteById(id);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product productCreated = ProductConverter.convertToProduct(request);
        resolveCategory(request, productCreated);

        productCreated.setProductDetails(new ArrayList<>());
        productCreated.setAdditionalImages(new ArrayList<>());

        Product product = repository.save(productCreated);

        BoxDimension boxDimension = ProductConverter.convertBoxDimension(request);
        if (boxDimension != null) {
            boxDimension.setProduct(product);
            product.setBoxDimension(boxDimension);
            boxDimensionRepository.save(product.getBoxDimension());
        }

        List<ProductDetail> productDetails = ProductConverter.convertProductDetail(request);
        if (productDetails != null) {
            productDetails.forEach(d -> d.setProduct(product));
            product.getProductDetails().addAll(productDetails);
            productDetailRepository.saveAll(product.getProductDetails());
        }

        return ProductConverter.convertToProductResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = repository.findById(id).orElseThrow(() -> new ProductNotFoundException("ID: " + id));

        product.setName(request.getName());
        product.setShortDescription(request.getShortDescription());
        product.setFullDescription(request.getFullDescription());
        product.setBrand(request.getBrand());
        resolveCategory(request, product);

        // CORREÇÃO: BigDecimal direto (sem conversão)
        product.setListPrice(request.getListPrice());
        product.setDiscount(request.getDiscount());
        product.setCost(request.getCost());

        product.setEnabled(request.getIsEnabled());
        product.setInStock(request.getInStock());
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
        if (product.getProductDetails() == null) product.setProductDetails(new ArrayList<>());
        product.getProductDetails().clear();
        if (newDetails != null) {
            newDetails.forEach(d -> d.setProduct(product));
            product.getProductDetails().addAll(newDetails);
        }

        return ProductConverter.convertToProductResponse(repository.save(product));
    }

    public ProductResponse updateProductImage(Long id, MultipartFile file) {
        Product product = repository.findById(id).orElseThrow(() -> new ProductNotFoundException("ID: " + id));
        if (file == null || file.isEmpty()) return ProductConverter.convertToProductResponse(product);

        try {
            if (product.getMainImage() != null) Files.deleteIfExists(rootLocation.resolve(product.getMainImage()));
            String filename = System.currentTimeMillis() + "_MAIN_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), rootLocation.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            product.setMainImage(filename);
            return ProductConverter.convertToProductResponse(repository.save(product));
        } catch (IOException e) { throw new RuntimeException("Erro upload", e); }
    }

    @Transactional
    public ProductResponse addAdditionalImages(Long id, List<MultipartFile> files) {
        Product product = repository.findById(id).orElseThrow(() -> new ProductNotFoundException("ID: " + id));
        if (files == null || files.isEmpty()) return ProductConverter.convertToProductResponse(product);

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                try {
                    String filename = System.currentTimeMillis() + "_EXTRA_" + file.getOriginalFilename();
                    Files.copy(file.getInputStream(), rootLocation.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

                    ProductImage img = ProductImage.builder().fileName(filename).product(product).build();

                    if(product.getAdditionalImages() == null) product.setAdditionalImages(new ArrayList<>());
                    product.getAdditionalImages().add(img);

                } catch (IOException e) { log.error("Erro upload extra", e); }
            }
        }
        return ProductConverter.convertToProductResponse(repository.save(product));
    }

    private void resolveCategory(ProductRequest request, Product product) {
        String categoryInput = request.getCategory();
        if (categoryInput != null) {
            if (categoryInput.matches("\\d+")) {
                Long categoryId = Long.parseLong(categoryInput);
                Category category = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));
                product.setCategory(category.getName());
            } else {
                product.setCategory(categoryInput);
            }
        }
    }
}