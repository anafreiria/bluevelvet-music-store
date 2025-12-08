package com.musicstore.bluevelvet.api.response;

import lombok.Builder;
import lombok.Value;
import java.util.ArrayList;
import java.util.List;

@Value
@Builder
public class CategoryResponse {
    Long id;
    String name;
    String description;
    String image;
    Boolean enabled;
    Long parentCategoryId;

    // A anotação @Builder.Default garante que, se não passares nada,
    // ele cria uma lista vazia em vez de deixar como null.
    @Builder.Default
    List<CategoryResponse> children = new ArrayList<>();
}