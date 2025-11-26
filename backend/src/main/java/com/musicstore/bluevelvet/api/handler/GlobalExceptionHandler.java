package com.musicstore.bluevelvet.api.handler;

import com.musicstore.bluevelvet.domain.dto.ProblemDetails;
import com.musicstore.bluevelvet.domain.exception.ProductNotFoundException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(value = { ProductNotFoundException.class })
    private ResponseEntity<?> handleNotFound(RuntimeException exception, WebRequest request) {
        ProblemDetails problemDetails = ProblemDetails.builder()
                .timestamp(LocalDateTime.now())
                .path(request.getContextPath())
                .error(HttpStatus.NOT_FOUND.getReasonPhrase())
                .status(HttpStatus.NOT_FOUND.value())
                .userMessage(exception.getMessage())
                .build();

        return handleExceptionInternal(exception, problemDetails, new HttpHeaders(), HttpStatus.NOT_FOUND, request);
    }

}
