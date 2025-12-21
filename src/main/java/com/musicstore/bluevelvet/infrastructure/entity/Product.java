package com.musicstore.bluevelvet.infrastructure.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "product") // Removi schema="db" para evitar erros em alguns MySQLs
public class Product implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(name = "full_description", columnDefinition = "TEXT")
    private String fullDescription;

    private String brand;
    private String category;

    @Column(name = "main_image")
    private String mainImage;

    // --- NOVO: Lista de Imagens Extras ---
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductImage> additionalImages = new ArrayList<>();

    // --- CORREÇÃO: BigDecimal para preços ---
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

    @OneToOne(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private BoxDimension boxDimension;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductDetail> productDetails;
}