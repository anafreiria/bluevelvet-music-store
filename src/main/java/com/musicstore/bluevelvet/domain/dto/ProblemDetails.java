package com.musicstore.bluevelvet.domain.dto;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemDetails implements Serializable {

    private LocalDateTime timestamp;

    private String path;

    private String error;

    private Integer status;

    private String userMessage;

}
