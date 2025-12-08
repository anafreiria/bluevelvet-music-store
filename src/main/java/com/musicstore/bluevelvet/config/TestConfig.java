package com.musicstore.bluevelvet.config;


import java.util.Arrays;

import com.musicstore.bluevelvet.infrastructure.entity.Role;
import com.musicstore.bluevelvet.infrastructure.entity.User;
import com.musicstore.bluevelvet.infrastructure.repository.RoleRepository;
import com.musicstore.bluevelvet.infrastructure.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;


@Configuration
@Profile("test")
public class TestConfig implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {

        // 1. Criar os Perfis (Roles) conforme US-1603
        Role r1 = new Role(null, "ROLE_ADMIN");
        Role r2 = new Role(null, "ROLE_SALES_MANAGER");
        Role r3 = new Role(null, "ROLE_EDITOR");
        Role r4 = new Role(null, "ROLE_ASSISTANT");
        Role r5 = new Role(null, "ROLE_SHIPPING_MANAGER");

        roleRepository.saveAll(Arrays.asList(r1, r2, r3, r4, r5));

        // 2. Criar Utilizadores
        User u1 = new User(null, "Maico", "maic@g.com", "988888888", "123456");
        User u2 = new User(null, "Jaqueson", "jac@g.com", "977777777", "123456");

        // Salvamos os usuários primeiro para gerar o ID
        userRepository.saveAll(Arrays.asList(u1, u2));

        // 3. Associar Perfis aos Utilizadores
        // Maria será ADMIN (para testar US-1232 e US-2032)
        u1.getRoles().add(r1);
        // Maria também pode ser Editora, por exemplo
        u1.getRoles().add(r3);

        // Alex será apenas Sales Manager (para testar permissões diferentes)
        u2.getRoles().add(r2);

        // Atualizamos os utilizadores com as novas associações
        userRepository.saveAll(Arrays.asList(u1, u2));

    }
}