package com.musicstore.bluevelvet.domain.converter;

import com.musicstore.bluevelvet.api.request.ProductDetailRequest;
import com.musicstore.bluevelvet.api.request.ProductDimensionRequest;
import com.musicstore.bluevelvet.api.request.ProductRequest;
import com.musicstore.bluevelvet.api.response.ProductResponse;
import com.musicstore.bluevelvet.infrastructure.entity.BoxDimension;
import com.musicstore.bluevelvet.infrastructure.entity.Product;
import com.musicstore.bluevelvet.infrastructure.entity.ProductDetail;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class ProductConverter {

    public static Product convertToProduct(ProductRequest request){
        Product product = new Product();
        product.setName(request.getName());
        product.setShortDescription(request.getShortDescription());
        product.setFullDescription(request.getFullDescription());
        product.setBrand(request.getBrand());
        product.setCategory(request.getCategory());
        product.setMainImage(request.getMainImage());
        product.setCost(request.getCost());
        product.setEnabled(request.getIsEnabled());
        product.setInStock(request.getInStock());
        product.setListPrice(request.getListPrice());
        product.setDiscount(request.getDiscount());
        product.setCreationTime(request.getCreationTime() != null ? request.getCreationTime() : LocalDateTime.now());
        product.setUpdateTime(request.getUpdateTime() != null ? request.getUpdateTime() : LocalDateTime.now());
        return product;
    }

    public static ProductResponse convertToProductResponse(Product product) {
        String imagePath = product.getMainImage() != null ? "/user-images/" + product.getMainImage() : null;
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .shortDescription(product.getShortDescription())
                .fullDescription(product.getFullDescription())
                .brand(product.getBrand())
                .category(product.getCategory())
                .mainImage(imagePath)
                .cost(product.getCost())
                .creationTime(product.getCreationTime())
                .updateTime(product.getUpdateTime())
                .isEnabled(product.getEnabled())
                .inStock(product.getInStock())
                .listPrice(product.getListPrice())
                .discount(product.getDiscount())
                .dimension(convertBoxDimensionRequest(product))
                .details(convertProductDetailsRequest(product))
                .build();
    }

    private static List<ProductDetailRequest> convertProductDetailsRequest(Product product) {
        return Objects.nonNull(product.getProductDetails()) ?
                product.getProductDetails().stream().map(productDetail -> ProductDetailRequest.builder()
                .name(productDetail.getName())
                .value(productDetail.getValue())
                .build()).toList()
                : new ArrayList<>();
    }

    public static List<ProductDetail> convertProductDetail(ProductRequest product) {
        return Objects.nonNull(product.getDetails()) ? product.getDetails().stream().map(productDetail -> ProductDetail.builder()
                .name(productDetail.getName())
                .value(productDetail.getValue())
                .build()).toList()
                : new ArrayList<>();
    }

    private static ProductDimensionRequest convertBoxDimensionRequest(Product product) {
        if (product.getBoxDimension() == null) {
            return null;
        }
        return ProductDimensionRequest.builder()
                .height(product.getBoxDimension().getHeight())
                .length(product.getBoxDimension().getLength())
                .width(product.getBoxDimension().getWidth())
                .weight(product.getBoxDimension().getWeight())
                .build();
    }

    public static BoxDimension convertBoxDimension(ProductRequest product) {
        if (product.getDimension() == null) {
            return BoxDimension.builder().build();
        }
        return BoxDimension.builder()
                .height(product.getDimension().getHeight())
                .length(product.getDimension().getLength())
                .width(product.getDimension().getWidth())
                .weight(product.getDimension().getWeight())
                .build();
    }

}
