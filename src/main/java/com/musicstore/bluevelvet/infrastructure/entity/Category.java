package com.musicstore.bluevelvet.infrastructure.entity;


import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "image")
    private String image;

    @Column(name = "enabled")
    private Boolean enabled = true;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Category parentCategory;
    @OneToMany(mappedBy = "parentCategory", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Category> children = new ArrayList<>();

    public Category(Object o, String jazz) {

    }

    public List<Category> getChildren() {
        return children;
    }

    public void setChildren(List<Category> children) {
        this.children = children;
    }

    public Category() {}

    public Category(String name, String description, Category parentCategory) {
        this(name, description, parentCategory, null, true);
    }

    public Category(String name, String description, Category parentCategory, String image, Boolean enabled) {
        this.name = name;
        this.description = description;
        this.parentCategory = parentCategory;
        this.image = image;
        this.enabled = enabled;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    // *** MÉTODO CORRIGIDO: DE isEnabled() para getEnabled() ***
    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Category getParentCategory() {
        return parentCategory;
    }

    public void setParentCategory(Category parentCategory) {
        this.parentCategory = parentCategory;
    }
}