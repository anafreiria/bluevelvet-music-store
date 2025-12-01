package com.musicstore.bluevelvet.domain;

import jakarta.persistence.*;

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

    // NOVO CAMPO: Para salvar o nome do arquivo da imagem
    @Column(name = "image")
    private String image;

    // NOVO CAMPO: Para ativar/desativar categoria
    @Column(name = "enabled")
    private boolean enabled = true;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Category parentCategory;

    public Category() {}

    // Construtor atualizado
    public Category(String name, String description, Category parentCategory, String image) {
        this.name = name;
        this.description = description;
        this.parentCategory = parentCategory;
        this.image = image;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; } // Importante para o update

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Category getParentCategory() { return parentCategory; }
    public void setParentCategory(Category parentCategory) { this.parentCategory = parentCategory; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}