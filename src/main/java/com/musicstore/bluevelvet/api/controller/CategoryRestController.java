package com.musicstore.bluevelvet.api.controller;

import com.musicstore.bluevelvet.api.request.CategoryRequest;
import com.musicstore.bluevelvet.api.response.CategoryResponse;
import com.musicstore.bluevelvet.domain.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Log4j2
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/categories")
public class CategoryRestController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody CategoryRequest request) {
        log.info("Request received to create a category with name {}", request.getName());
        return ResponseEntity.ok(categoryService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> listCategories() {
        log.info("Request received to list categories");
        return ResponseEntity.ok(categoryService.listAll());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        log.info("REST CONTROLLER: Recebida requisição para deletar ID: {}", id);

        // Aqui é onde acontece a mágica.
        // Se você descomentar/adicionar essa linha, o IntelliJ vai mostrar "1 uso" no Service.
        categoryService.delete(id);

        return ResponseEntity.noContent().build();
    }
}
