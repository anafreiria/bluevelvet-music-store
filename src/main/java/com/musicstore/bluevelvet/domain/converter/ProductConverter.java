package com.musicstore.bluevelvet.domain.converter;

import com.musicstore.bluevelvet.api.request.ProductDetailRequest;
import com.musicstore.bluevelvet.api.request.ProductDimensionRequest;
import com.musicstore.bluevelvet.api.request.ProductRequest;
import com.musicstore.bluevelvet.api.response.ProductResponse;
import com.musicstore.bluevelvet.infrastructure.entity.BoxDimension;
import com.musicstore.bluevelvet.infrastructure.entity.Product;
import com.musicstore.bluevelvet.infrastructure.entity.ProductDetail;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class ProductConverter {

    public static Product convertToProduct(ProductRequest request) {
        Product product = new Product();

        product.setName(request.getName());
        product.setShortDescription(request.getShortDescription());
        product.setFullDescription(request.getFullDescription());
        product.setBrand(request.getBrand());

        // ⚠️ NOTA IMPORTANTE:
        // Não definimos a categoria aqui (product.setCategory).
        // O request tem uma String/ID, e o Product espera um Objeto Category.
        // Isso agora é feito manualmente lá no ProductService.java.

        product.setListPrice(request.getListPrice());
        product.setDiscount(request.getDiscount());
        product.setCost(request.getCost());

        product.setEnabled(request.getIsEnabled());
        product.setInStock(request.getInStock());

        // Tratamento de datas (caso venham nulas, usa o momento atual)
        if (request.getCreationTime() != null) {
            product.setCreationTime(request.getCreationTime());
        } else {
            product.setCreationTime(java.time.LocalDateTime.now());
        }

        if (request.getUpdateTime() != null) {
            product.setUpdateTime(request.getUpdateTime());
        } else {
            product.setUpdateTime(java.time.LocalDateTime.now());
        }

        return product;
    }

    public static ProductResponse convertToProductResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .shortDescription(product.getShortDescription())
                .fullDescription(product.getFullDescription())
                .brand(product.getBrand())

                // --- CORREÇÃO: Envia o objeto Categoria (ou null se não tiver) ---
                .category(product.getCategory())
                // ----------------------------------------------------------------

                .listPrice(product.getListPrice())
                .discount(product.getDiscount())
                .isEnabled(product.getEnabled())
                .inStock(product.getInStock())
                .creationTime(product.getCreationTime())
                .updateTime(product.getUpdateTime())
                .cost(product.getCost())
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
        return ProductDimensionRequest.builder()
                .height(product.getBoxDimension().getHeight())
                .length(product.getBoxDimension().getLength())
                .width(product.getBoxDimension().getWidth())
                .weight(product.getBoxDimension().getWeight())
                .build();
    }

    public static BoxDimension convertBoxDimension(ProductRequest product) {
        return BoxDimension.builder()
                .height(product.getDimension().getHeight())
                .length(product.getDimension().getLength())
                .width(product.getDimension().getWidth())
                .weight(product.getDimension().getWeight())
                .build();
    }

}
