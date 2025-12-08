package com.musicstore.bluevelvet.infrastructure.entity;

import java.io.Serializable;
import java.util.Collection;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails; // <--- Importante

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tb_user")
// 1. Implementar UserDetails
public class User implements Serializable, UserDetails {
    private static final long serialVersionUID = 1L;

    @Getter
    @Setter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Setter
    private String name;

    @Getter
    @Setter
    private String email; // Será usado como LOGIN

    @Getter
    @Setter
    private String phone;

    @Getter
    @Setter
    private String password;

    @Getter
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "tb_user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    public User() {
    }

    public User(Long id, String name, String email, String phone, String password) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.password = password;
    }

    public User(String name, String email, String encryptedPassword, String role) {

    }

    // Método auxiliar para adicionar roles facilmente
    public void addRole(Role role) {
        this.roles.add(role);
    }

    // =================================================================
    // MÉTODOS DO USER DETAILS (Obrigatórios para o Spring Security)
    // =================================================================

    // 2. Converter os teus 'Role' para 'GrantedAuthority' do Spring


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .filter(role -> role.getAuthority() != null && !role.getAuthority().isEmpty())
                // ️ CORREÇÃO NECESSÁRIA AQUI: Adicionar o prefixo "ROLE_"
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getAuthority()))
                .collect(Collectors.toList());
    }

    // 3. Definir qual campo é o "Username" (No teu caso, é o Email)
    @Override
    public String getUsername() {
        // Deve retornar o campo que você está usando para login, neste caso, o email
        return this.email;
    }

    // 4. Configurações de expiração (Retornar true para simplificar)
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    // =================================================================

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        User other = (User) obj;
        return Objects.equals(id, other.id);
    }

    public String getRole() {
        if (roles == null || roles.isEmpty()) {
            return "USER"; // Fallback padrão se não tiver role
        }
        // Retorna a Authority do primeiro Role na coleção
        return roles.iterator().next().getAuthority();
    }

    public User(String name, String email, String encryptedPassword, Role role) {
        this.name = name;
        this.email = email;
        this.password = encryptedPassword;
        this.addRole(role); // Adiciona a entidade Role completa
    }


    public void setRole(Role role) {
        this.roles.clear(); // Opcional: Remove outras roles se quiser que o user tenha APENAS essa
        this.roles.add(role);
    }


}