package com.musicstore.bluevelvet.api.controller;

import com.musicstore.bluevelvet.infrastructure.entity.Role;
import com.musicstore.bluevelvet.infrastructure.entity.User;
import com.musicstore.bluevelvet.infrastructure.repository.RoleRepository;
import com.musicstore.bluevelvet.infrastructure.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
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
    public ResponseEntity<?> login(@RequestBody LoginDTO data) {
        if (data == null || !StringUtils.hasText(data.email()) || !StringUtils.hasText(data.password())) {
            return ResponseEntity.badRequest().body("E-mail e senha são obrigatórios.");
        }

        if (data.password().length() < 8) {
            return ResponseEntity.status(401).body("E-mail ou senha incorretos. Tente novamente.");
        }

        // 1. Procurar utilizador pelo email
        User user = this.userRepository.findByEmail(data.email());

        // 2. Se o utilizador não existir, erro 401 (Unauthorized)
        if (user == null) {
            return ResponseEntity.status(401).body("E-mail ou senha incorretos. Tente novamente.");
        }

        // 3. Verificar a senha (Senha crua vs Hash no Banco)
        // O método matches faz a magia de verificar se "12345" bate com "$2a$10$..."
        boolean passwordValid = passwordEncoder.matches(data.password(), user.getPassword());

        if (!passwordValid) {
            return ResponseEntity.status(401).body("E-mail ou senha incorretos. Tente novamente.");
        }

        // 4. Se tudo estiver OK, retornamos os dados do utilizador (sem a senha!)
        String userRole = null;
        if (user.getAuthorities() != null && !user.getAuthorities().isEmpty()) {
            String authority = user.getAuthorities().iterator().next().getAuthority();
            userRole = authority.replaceFirst("^ROLE_", "");
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
    public ResponseEntity<?> register(@RequestBody RegisterDTO data) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            return ResponseEntity.status(403).body("Somente administradores podem cadastrar novos usuários.");
        }

        if (data == null || !StringUtils.hasText(data.email()) || !StringUtils.hasText(data.password())) {
            return ResponseEntity.badRequest().body("O e-mail e a senha são obrigatórios.");
        }

        if (data.password().length() < 8) {
            return ResponseEntity.badRequest().body("A senha deve ter pelo menos 8 caracteres.");
        }

        if (!StringUtils.hasText(data.role())) {
            return ResponseEntity.badRequest().body("O usuário deve possuir uma função.");
        }

        if (this.userRepository.findByEmail(data.email()) != null) {
            return ResponseEntity.badRequest().body("Este email já está em uso.");
        }

        String roleKey = data.role().toUpperCase(Locale.ROOT);

        // 1. Criptografa a senha
        String encryptedPassword = passwordEncoder.encode(data.password());

        // 2. Busca a Entidade Role pelo nome (ex: "ROLE_CLIENTE")
        Optional<Role> roleOptional = this.roleRepository.findByAuthority(roleKey);

        // 3. Se a Role não existir no DB, retorna erro ou usa uma Role padrão
        if (roleOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("Role informada é inválida: " + data.role());
        }

        // 4. Cria e salva o novo usuário
        Role userRole = roleOptional.get();
        User newUser = new User(data.name(), data.email(), encryptedPassword, userRole);

        this.userRepository.save(newUser);

        return ResponseEntity.ok(new UserResponseDTO(
                newUser.getId(),
                newUser.getName(),
                newUser.getEmail(),
                userRole.getAuthority()
        ));
    }
}

// --- DTOs (Data Transfer Objects) ---

// Usamos para receber os dados do login
record LoginDTO(String email, String password) {}

// Usamos para receber os dados do registro
record RegisterDTO(String name, String email, String password, String role) {}

// Usamos para devolver a resposta segura (sem a senha)
record UserResponseDTO(Long id, String name, String email, String role) {}
