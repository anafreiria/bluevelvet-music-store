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
    private MultipartFile imageFile;
    private Boolean enabled;
}