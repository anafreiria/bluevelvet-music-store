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
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;

    private String name;

    private String shortDescription;

    private String fullDescription;

    private String brand;

    private String category;

    private BigDecimal listPrice;

    private BigDecimal discount;

    private Boolean isEnabled;

    private Boolean inStock;

    private LocalDateTime creationTime;

    private LocalDateTime updateTime;

    private ProductDimensionRequest dimension;

    private BigDecimal cost;

    private List<ProductDetailRequest> details;

}
