package com.musicstore.bluevelvet.infrastructure.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tb_role")
public class Role implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String authority; // Ex: "ROLE_ADMIN", "ROLE_SALES"

    public Role() {
    }

    public Role(Long id, String authority) {
        this.id = id;
        this.authority = authority;
    }

    public Role(String authority) {
        this.authority = authority; // <--- AGORA ESTÁ ATRIBUINDO O VALOR
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAuthority() {
        // Se você tiver um campo chamado 'authority' no Role:
        return this.authority;

        // Ou se você tiver um campo chamado 'name' (que armazena a role):
        // return this.name;
    }

    public void setAuthority(String authority) {
        this.authority = authority;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Role other = (Role) obj;
        return Objects.equals(id, other.id);
    }
}