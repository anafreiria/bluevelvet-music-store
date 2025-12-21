package com.musicstore.bluevelvet.domain.converter;

import com.musicstore.bluevelvet.api.request.ProductDetailRequest;
import com.musicstore.bluevelvet.api.request.ProductDimensionRequest;
import com.musicstore.bluevelvet.api.request.ProductRequest;
import com.musicstore.bluevelvet.api.response.ProductResponse;
import com.musicstore.bluevelvet.infrastructure.entity.BoxDimension;
import com.musicstore.bluevelvet.infrastructure.entity.Product;
import com.musicstore.bluevelvet.infrastructure.entity.ProductDetail;
import com.musicstore.bluevelvet.infrastructure.entity.ProductImage;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class ProductConverter {

    public static Product convertToProduct(ProductRequest request){
        Product product = new Product();
        product.setName(request.getName());
        product.setShortDescription(request.getShortDescription());
        product.setFullDescription(request.getFullDescription());
        product.setBrand(request.getBrand());
        product.setCategory(request.getCategory());
        product.setMainImage(request.getMainImage());

        // Mapeamento direto BigDecimal -> BigDecimal
        product.setCost(request.getCost());
        product.setListPrice(request.getListPrice());
        product.setDiscount(request.getDiscount());

        product.setEnabled(request.getIsEnabled());
        product.setInStock(request.getInStock());
        product.setCreationTime(request.getCreationTime() != null ? request.getCreationTime() : LocalDateTime.now());
        product.setUpdateTime(request.getUpdateTime() != null ? request.getUpdateTime() : LocalDateTime.now());
        return product;
    }

    public static ProductResponse convertToProductResponse(Product product) {
        List<String> images = new ArrayList<>();
        if (product.getAdditionalImages() != null) {
            images = product.getAdditionalImages().stream()
                    .map(ProductImage::getFileName)
                    .collect(Collectors.toList());
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .shortDescription(product.getShortDescription())
                .fullDescription(product.getFullDescription())
                .brand(product.getBrand())
                .category(product.getCategory())
                .mainImage(product.getMainImage())
                .additionalImages(images)

                // Mapeamento direto BigDecimal -> BigDecimal
                .cost(product.getCost())
                .listPrice(product.getListPrice())
                .discount(product.getDiscount())

                .creationTime(product.getCreationTime())
                .updateTime(product.getUpdateTime())
                .isEnabled(product.getEnabled())
                .inStock(product.getInStock())
                .dimension(convertBoxDimensionRequest(product))
                .details(convertProductDetailsRequest(product))
                .build();
    }

    // ... (Helpers abaixo não mudam)
    private static List<ProductDetailRequest> convertProductDetailsRequest(Product product) {
        return Objects.nonNull(product.getProductDetails()) ?
                product.getProductDetails().stream().map(d -> ProductDetailRequest.builder()
                        .name(d.getName()).value(d.getValue()).build()).toList() : new ArrayList<>();
    }

    public static List<ProductDetail> convertProductDetail(ProductRequest product) {
        return Objects.nonNull(product.getDetails()) ? product.getDetails().stream().map(d -> ProductDetail.builder()
                .name(d.getName()).value(d.getValue()).build()).toList() : new ArrayList<>();
    }

    private static ProductDimensionRequest convertBoxDimensionRequest(Product product) {
        if (product.getBoxDimension() == null) return null;
        return ProductDimensionRequest.builder()
                .height(product.getBoxDimension().getHeight())
                .length(product.getBoxDimension().getLength())
                .width(product.getBoxDimension().getWidth())
                .weight(product.getBoxDimension().getWeight())
                .build();
    }

    public static BoxDimension convertBoxDimension(ProductRequest product) {
        if (product.getDimension() == null) return BoxDimension.builder().build();
        return BoxDimension.builder()
                .height(product.getDimension().getHeight())
                .length(product.getDimension().getLength())
                .width(product.getDimension().getWidth())
                .weight(product.getDimension().getWeight())
                .build();
    }
}