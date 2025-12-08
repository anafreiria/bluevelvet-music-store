package com.musicstore.bluevelvet.api.controller;

import com.musicstore.bluevelvet.api.request.CategoryRequest;
import com.musicstore.bluevelvet.api.response.CategoryResponse;
import com.musicstore.bluevelvet.domain.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

    @GetMapping
    public ResponseEntity<?> listCategories(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "asc") String sort) {
        if (page == null || size == null) {
            log.info("Listing all categories (non paginated)");
            List<CategoryResponse> categories = categoryService.listAllResponses();
            return ResponseEntity.ok(categories);
        }

        log.info("Listing categories with pagination. page={}, size={}, sort={}", page, size, sort);
        return ResponseEntity.ok(categoryService.listPaginatedResponses(page, size, sort));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategory(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.findById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> createCategory(@ModelAttribute CategoryRequest request) {
        log.info("Creating category: {}", request.getName());
        return ResponseEntity.ok(categoryService.create(request));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CategoryResponse> updateCategory(@PathVariable Long id, @ModelAttribute CategoryRequest request) {
        log.info("Updating category id: {}", id);
        return ResponseEntity.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        log.info("Request received to delete category id {}", id);
        categoryService.delete(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
