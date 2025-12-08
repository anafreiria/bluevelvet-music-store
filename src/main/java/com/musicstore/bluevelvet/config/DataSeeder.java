package com.musicstore.bluevelvet.config;


import com.musicstore.bluevelvet.infrastructure.entity.Category;
import com.musicstore.bluevelvet.infrastructure.entity.Role;
import com.musicstore.bluevelvet.infrastructure.entity.User;
import com.musicstore.bluevelvet.infrastructure.repository.CategoryRepository;
import com.musicstore.bluevelvet.infrastructure.repository.ProductRepository;
import com.musicstore.bluevelvet.infrastructure.repository.RoleRepository;
import com.musicstore.bluevelvet.infrastructure.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // --- 1. SEEDING ROLES (ADMIN, CLIENTE e perfis administrativos) ---
        Role roleAdmin = seedRole("ADMIN");
        Role roleSalesManager = seedRole("GERENTE_VENDAS");
        Role roleEditor = seedRole("EDITOR");
        Role roleAssistant = seedRole("ASSISTENTE");
        Role roleShippingManager = seedRole("GERENTE_ENVIO");
        Role roleClient = seedRole("CLIENTE");

        // --- 2. SEEDING USERS ---
        seedUser("Admin Master", "admin@bluevelvet.com", "admin1234", roleAdmin);
        seedUser("Client John Doe", "cliente@bluevelvet.com", "cliente1234", roleClient);

        // --- 3. SEEDING CATEGORIES ---


        System.out.println("✅ Data Seeder executado com sucesso! Roles, Usuários, Categorias e Produtos iniciais criados.");
    }



    // --- MÉTODOS AUXILIARES ---

    /** Garante que a Role exista, criando-a se necessário. */
    private Role seedRole(String authority) {
        return roleRepository.findByAuthority(authority)
                .orElseGet(() -> {
                    Role newRole = new Role(null, authority); // Assumindo construtor (id, authority)
                    return roleRepository.save(newRole);
                });
    }

    /** Garante que o Usuário exista, criando-o se o email não estiver cadastrado. */
    private void seedUser(String name, String email, String password, Role role) {
        if (userRepository.findByEmail(email) == null) {
            User newUser = new User(
                    name,
                    email,
                    passwordEncoder.encode(password),
                    role
            );
            userRepository.save(newUser);
        }
    }

    /** Garante que a Categoria exista, criando-a se necessário. */


    /** Cria um Produto se ele ainda não existir pelo nome. */

}
