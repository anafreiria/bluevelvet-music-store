package com.musicstore.bluevelvet.infrastructure.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "categories") // Define o nome da tabela no BD
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-incremento
    private Integer id;

    // Regra de Negócio: Nome deve ser único e não nulo (min 3 chars valida no Service/DTO, mas aqui garantimos o banco)
    @Column(length = 128, nullable = false, unique = true)
    private String name;

    @Column(length = 64)
    private String alias;

    @Column(length = 128, nullable = false)
    private String image; // Caminho da imagem (ex: "default.png")

    private boolean enabled;

    // Construtor vazio (obrigatório para JPA)
    public Category() {
    }

    // Construtor para facilitar criação
    public Category(String name) {
        this.name = name;
        this.alias = name; // Default alias
        this.image = "default.png";
        this.enabled = true;
    }

    // --- Getters e Setters ---
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}