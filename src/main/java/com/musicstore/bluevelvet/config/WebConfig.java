package com.musicstore.bluevelvet.api.config; // Ajuste o pacote se necessário

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Mapeia a URL "/user-images/**" direto para a pasta física do seu computador
        registry.addResourceHandler("/user-images/**")
                .addResourceLocations("file:src/main/resources/static/user-images/");
    }
}