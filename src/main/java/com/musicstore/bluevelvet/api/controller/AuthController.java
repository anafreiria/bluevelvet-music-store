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
    private PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO data) {
        if (data == null || !StringUtils.hasText(data.email()) || !StringUtils.hasText(data.password())) {
            return ResponseEntity.badRequest().body("E-mail e senha são obrigatórios.");
        }
        User user = this.userRepository.findByEmail(data.email());
        if (user == null || !passwordEncoder.matches(data.password(), user.getPassword())) {
            return ResponseEntity.status(401).body("E-mail ou senha incorretos.");
        }
        String userRole = null;
        if (user.getAuthorities() != null && !user.getAuthorities().isEmpty()) {
            userRole = user.getAuthorities().iterator().next().getAuthority().replaceFirst("^ROLE_", "");
        }
        return ResponseEntity.ok(new UserResponseDTO(user.getId(), user.getName(), user.getEmail(), userRole));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterDTO data) {
        // --- LOGICA DE PROTEÇÃO ---
        boolean isCreatingClient = "CLIENTE".equalsIgnoreCase(data.role());

        // Verifica se quem está chamando é Admin
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isCallerAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        // Regra: Se não for criação de cliente, E quem chama não é admin => BLOQUEIA
        if (!isCreatingClient && !isCallerAdmin) {
            return ResponseEntity.status(403).body("Apenas Administradores podem criar usuários com privilégios elevados (Admin, Editor, etc).");
        }
        // ---------------------------

        if (data == null || !StringUtils.hasText(data.email()) || !StringUtils.hasText(data.password())) {
            return ResponseEntity.badRequest().body("Dados incompletos.");
        }
        if (this.userRepository.findByEmail(data.email()) != null) {
            return ResponseEntity.badRequest().body("Este email já está em uso.");
        }

        String roleKey = data.role().toUpperCase(Locale.ROOT);
        Optional<Role> roleOptional = this.roleRepository.findByAuthority(roleKey);
        if (roleOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("Role inválida: " + data.role());
        }

        User newUser = new User(data.name(), data.email(), passwordEncoder.encode(data.password()), roleOptional.get());
        this.userRepository.save(newUser);

        return ResponseEntity.ok(new UserResponseDTO(newUser.getId(), newUser.getName(), newUser.getEmail(), roleKey));
    }
}

// DTOs
record LoginDTO(String email, String password) {}
record RegisterDTO(String name, String email, String password, String role) {}
record UserResponseDTO(Long id, String name, String email, String role) {}