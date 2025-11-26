package com.musicstore.bluevelvet.infrastructure.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(schema = "db", name = "product")
public class Product implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "short_description")
    private String shortDescription;

    @Column(name = "full_description")
    private String fullDescription;

    private String brand;

    private String category;

    @Column(name = "list_price")
    private BigDecimal listPrice;

    private BigDecimal discount;

    private BigDecimal cost;

    private Boolean enabled;

    @Column(name = "in_stock")
    private Boolean inStock;

    @Column(name = "creation_time")
    private LocalDateTime creationTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @OneToOne(mappedBy = "product")
    private BoxDimension boxDimension;

    @OneToMany(mappedBy = "product")
    private List<ProductDetail> productDetails;

}
