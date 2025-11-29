package com.musicstore.bluevelvet.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nome da categoria
    @Column(name = "name")
    private String name;

    // Descrição opcional da categoria
    @Column(name = "description")
    private String description;

    // Relacionamento para categoria pai (auto-relacionamento)
    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Category parentCategory;

    public Category() {}

    public Category(String name, String description, Category parentCategory) {
        this.name = name;
        this.description = description;
        this.parentCategory = parentCategory;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Category getParentCategory() {
        return parentCategory;
    }

    public void setParentCategory(Category parentCategory) {
        this.parentCategory = parentCategory;
    }
}
