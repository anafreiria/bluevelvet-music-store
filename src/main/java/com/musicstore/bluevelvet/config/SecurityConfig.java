package com.musicstore.bluevelvet.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Desabilita CSRF (comum para APIs REST)
                .cors(Customizer.withDefaults()) // Ativa a configuração de CORS definida no final do arquivo
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)) // API sem estado (Stateless)
                .authorizeHttpRequests(auth -> auth
                        // 1. IMPORTANTE: Libera o "pre-flight" do CORS para todas as rotas
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 2. Documentação API (Swagger UI / OpenApi) - NOVO
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        // 3. Rotas Públicas (Qualquer pessoa pode acessar)
                        .requestMatchers("/auth/login").permitAll()           // Login público
                        .requestMatchers("/h2-console/**").permitAll()     // Banco de dados H2
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/products/**").permitAll()  // Ver lista de produtos
                        .requestMatchers(HttpMethod.GET, "/categories/**").permitAll() // Ver categorias

                        // 4. Rotas Administrativas (Apenas ADMIN)
                        .requestMatchers(HttpMethod.POST, "/auth/register").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/users/**").hasRole("ADMIN")

                        // 5. Rotas de Edição (ADMIN e EDITOR)
                        .requestMatchers("/categories/export/**").hasAnyRole("ADMIN", "EDITOR")
                        .requestMatchers(HttpMethod.POST, "/categories/**").hasAnyRole("ADMIN", "EDITOR")
                        .requestMatchers(HttpMethod.PUT, "/categories/**").hasAnyRole("ADMIN", "EDITOR")
                        .requestMatchers(HttpMethod.DELETE, "/categories/**").hasAnyRole("ADMIN", "EDITOR")

                        // 6. Qualquer outra rota exige login (REGRA FINAL)
                        .anyRequest().authenticated()
                )
                // Configurações extras fora do authorizeHttpRequests
                .headers(headers -> headers.frameOptions(frame -> frame.disable())) // Permite exibir o H2 Console
                .httpBasic(Customizer.withDefaults()); // Autenticação Básica

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Define as origens permitidas (Frontend)
        configuration.setAllowedOrigins(List.of(
                "http://127.0.0.1:5500",
                "http://localhost:5500"
        ));

        // Métodos permitidos
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Cabeçalhos permitidos
        configuration.setAllowedHeaders(List.of("*"));

        // Permite o envio de credenciais (Cookies/Auth Headers)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
