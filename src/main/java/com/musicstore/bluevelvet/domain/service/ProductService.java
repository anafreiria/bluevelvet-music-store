package com.musicstore.bluevelvet.domain.service;

import com.musicstore.bluevelvet.api.request.ProductRequest;
import com.musicstore.bluevelvet.api.response.ProductResponse;
import com.musicstore.bluevelvet.domain.converter.ProductConverter;
import com.musicstore.bluevelvet.domain.exception.ProductNotFoundException;
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
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Log4j2
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository repository;

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
        Product productCreated = ProductConverter.convertToProduct(request);

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

        product.setName(request.getName());
        product.setShortDescription(request.getShortDescription());
        product.setFullDescription(request.getFullDescription());
        product.setBrand(request.getBrand());
        product.setCategory(request.getCategory());
        product.setListPrice(request.getListPrice());
        product.setDiscount(request.getDiscount());
        product.setEnabled(request.getIsEnabled());
        product.setInStock(request.getInStock());
        product.setCreationTime(request.getCreationTime());
        product.setUpdateTime(request.getUpdateTime());
        product.setCost(request.getCost());
        product.getBoxDimension().setWidth(request.getDimension().getWidth());
        product.getBoxDimension().setHeight(request.getDimension().getHeight());
        product.getBoxDimension().setLength(request.getDimension().getLength());
        product.getBoxDimension().setWeight(request.getDimension().getWeight());

        productDetailRepository.deleteAll(product.getProductDetails());

        Product updatedProduct = repository.save(product);

        List<ProductDetail> productDetails = ProductConverter.convertProductDetail(request);
        productDetails.forEach(productDetail -> productDetail.setProduct(updatedProduct));
        updatedProduct.setProductDetails(productDetails);
        productDetailRepository.saveAll(productDetails);

        return ProductConverter.convertToProductResponse(updatedProduct);
    }

}
