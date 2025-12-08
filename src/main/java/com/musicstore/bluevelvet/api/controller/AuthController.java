package com.musicstore.bluevelvet.api.controller;

import com.musicstore.bluevelvet.infrastructure.entity.Role;
import com.musicstore.bluevelvet.infrastructure.entity.User;
import com.musicstore.bluevelvet.infrastructure.repository.RoleRepository;
import com.musicstore.bluevelvet.infrastructure.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {


    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder; // Injetamos o codificador configurado no SecurityConfig
    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }


    // LOGIN EXPLÍCITO (POST)
    // É isto que o teu fetch() do Javascript vai chamar
    @PostMapping("/login")
    public ResponseEntity login(@RequestBody LoginDTO data) {
        // 1. Procurar utilizador pelo email
        User user = this.userRepository.findByEmail(data.email());

        // 2. Se o utilizador não existir, erro 401 (Unauthorized)
        if (user == null) {
            return ResponseEntity.status(401).body("Email ou senha incorretos");
        }

        // 3. Verificar a senha (Senha crua vs Hash no Banco)
        // O método matches faz a magia de verificar se "12345" bate com "$2a$10$..."
        boolean passwordValid = passwordEncoder.matches(data.password(), user.getPassword());

        if (!passwordValid) {
            return ResponseEntity.status(401).body("Email ou senha incorretos");
        }

        // 4. Se tudo estiver OK, retornamos os dados do utilizador (sem a senha!)
        String userRole = null;
        if (user.getAuthorities() != null && !user.getAuthorities().isEmpty()) {
            userRole = user.getAuthorities().iterator().next().getAuthority();
        }

        // 5. Retorna a resposta com a role preenchida
        return ResponseEntity.ok(new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                userRole // <-- Agora o campo 'role' será preenchido
        ));

    }

    // REGISTRO
    @PostMapping("/register")
    public ResponseEntity register(@RequestBody RegisterDTO data) {
        if (this.userRepository.findByEmail(data.email()) != null) {
            return ResponseEntity.badRequest().body("Este email já está em uso.");
        }

        // 1. Criptografa a senha
        String encryptedPassword = passwordEncoder.encode(data.password());

        // 2. Busca a Entidade Role pelo nome (ex: "ROLE_CLIENTE")
        Optional<Role> roleOptional = this.roleRepository.findByAuthority(data.role());

        // 3. Se a Role não existir no DB, retorna erro ou usa uma Role padrão
        if (roleOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("Role informada é inválida: " + data.role());
        }

        // 4. Cria e salva o novo usuário
        Role userRole = roleOptional.get();
        User newUser = new User(data.name(), data.email(), encryptedPassword, userRole);

        this.userRepository.save(newUser);

        return ResponseEntity.ok().build();
    }
}

// --- DTOs (Data Transfer Objects) ---

// Usamos para receber os dados do login
record LoginDTO(String email, String password) {}

// Usamos para receber os dados do registro
record RegisterDTO(String name, String email, String password, String role) {}

// Usamos para devolver a resposta segura (sem a senha)
record UserResponseDTO(Long id, String name, String email, String role) {}