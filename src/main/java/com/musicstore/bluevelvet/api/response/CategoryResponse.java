package com.musicstore.bluevelvet.api.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CategoryResponse {
    Long id;
    String name;
    String description;
    Long parentCategoryId;
}
