package com.musicstore.bluevelvet.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
// MODIFIQUEI O ARQUIVO PARA FACILITAR
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Desabilita a proteção contra CSRF (necessário para o POST do formulário funcionar sem token)
                .csrf(csrf -> csrf.disable())

                // Configura as permissões de requisição
                .authorizeHttpRequests(auth -> auth
                        // Permite acesso a TUDO (arquivos estáticos, API, etc) sem login
                        .anyRequest().permitAll()
                );

        return http.build();
    }
}