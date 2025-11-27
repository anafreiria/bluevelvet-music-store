package com.musicstore.bluevelvet.api.request;

import lombok.*;

@Getter
@Setter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ProductDimensionRequest {

    private Float length;

    private Float width;

    private Float height;

    private Float weight;

}
