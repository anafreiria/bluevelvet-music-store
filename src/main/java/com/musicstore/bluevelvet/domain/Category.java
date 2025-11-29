package com.musicstore.bluevelvet.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // CORRIGIDO: Mapeia para a coluna "name" que existe no seu banco de dados
    @Column(name = "name", nullable = false)
    private String name;

    // CORRIGIDO: Mapeia para a coluna "description" que existe no seu banco de dados
    @Column(name = "description")
    private String description;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Category parentCategory;

    @Transient
    private List<Category> children = new ArrayList<>();

    public Category() {}

    // getters / setters
    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Category getParentCategory() { return parentCategory; }
    public void setParentCategory(Category parentCategory) { this.parentCategory = parentCategory; }

    public List<Category> getChildren() { return children; }
    public void setChildren(List<Category> children) { this.children = children; }
}