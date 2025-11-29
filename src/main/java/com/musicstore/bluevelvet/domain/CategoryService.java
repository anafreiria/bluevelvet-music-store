package com.musicstore.bluevelvet.domain;

import com.musicstore.bluevelvet.api.request.CategoryRequest;
import com.musicstore.bluevelvet.api.response.CategoryResponse;
import com.musicstore.bluevelvet.domain.exception.CategoryNotFoundException;
import com.musicstore.bluevelvet.infrastructure.CategoryRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository repository;

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
    }

    public CategoryResponse create(CategoryRequest request) {
        Category parentCategory = null;
        if (request.getParentCategoryId() != null) {
            parentCategory = repository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new CategoryNotFoundException(
                            "Parent category not found with id %d".formatted(request.getParentCategoryId())));
        }

        Category category = new Category(request.getName(), request.getDescription(), parentCategory);
        Category saved = repository.save(category);

        return CategoryResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .parentCategoryId(parentCategory != null ? parentCategory.getId() : null)
                .build();
    }

    public List<CategoryResponse> listAll() {
        return repository.findAll().stream()
                .map(category -> CategoryResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .description(category.getDescription())
                        .parentCategoryId(category.getParentCategory() != null ? category.getParentCategory().getId() : null)
                        .build())
                .collect(Collectors.toList());
    }

    // Método para listar categorias com paginação e ordenação
    public Page<Category> listPaginated(int page, String sort) {

        // Define tamanho da página (5 itens por página)
        Pageable pageable = PageRequest.of(page, 5);

        // Verifica se a ordenação é descendente
        if ("desc".equalsIgnoreCase(sort)) {
            return repository.findAllTopLevelSortedDesc(pageable);
        }

        // Caso contrário, ordenação ascendente
        return repository.findAllTopLevelSortedAsc(pageable);
    }
}
