package com.musicstore.bluevelvet.api.request;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class CategoryRequest {
    private String name;
    private String description;
    private Long parentCategoryId;

    // Campo para receber o arquivo do formulário
    private MultipartFile imageFile;

    // Campo para status
    private boolean enabled;
}