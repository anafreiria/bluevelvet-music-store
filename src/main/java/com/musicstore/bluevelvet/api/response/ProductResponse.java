package com.musicstore.bluevelvet.api.response;

import com.musicstore.bluevelvet.api.request.ProductDetailRequest;
import com.musicstore.bluevelvet.api.request.ProductDimensionRequest;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String shortDescription;
    private String fullDescription;
    private String brand;
    private String category;
    private String mainImage;

    // Lista de nomes de arquivo das imagens extras
    private List<String> additionalImages;

    // --- CORREÇÃO: BigDecimal ---
    private BigDecimal cost;
    private BigDecimal listPrice;
    private BigDecimal discount;

    private LocalDateTime creationTime;
    private LocalDateTime updateTime;
    private Boolean isEnabled;
    private Boolean inStock;

    private ProductDimensionRequest dimension;
    private List<ProductDetailRequest> details;
}