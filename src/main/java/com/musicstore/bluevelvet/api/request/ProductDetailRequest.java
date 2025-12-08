package com.musicstore.bluevelvet.api.request;

import lombok.*;

@Getter
@Setter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailRequest {

    private String name;

    private String value;

}
